import { countBlocks, type BlockType, type Program } from '@kidsland/shared';
import * as Blockly from 'blockly';
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { defineBlocks, KIDS_THEME, loadProgram, toolboxFor, workspaceToProgram } from './blocks';

export interface EditorHandle {
  getProgram: () => Program;
  highlight: (blockId: string | null) => void;
}

interface Props {
  availableBlocks: BlockType[];
  initialProgram: Program | null;
  onBlockCount: (n: number) => void;
  ref?: Ref<EditorHandle>;
}

export function BlocklyEditor({ availableBlocks, initialProgram, onBlockCount, ref }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const countRef = useRef(onBlockCount);
  countRef.current = onBlockCount;

  useEffect(() => {
    defineBlocks();
    const ws = Blockly.inject(hostRef.current!, {
      toolbox: toolboxFor(availableBlocks),
      trashcan: true,
      renderer: 'zelos',
      theme: KIDS_THEME,
      grid: { spacing: 28, length: 3, colour: '#e3dcff', snap: false },
      zoom: { controls: true, startScale: 0.95 },
      move: { scrollbars: true, drag: true, wheel: true },
      sounds: false,
      // Serve Blockly's cursors and icons ourselves instead of from blockly-demo.appspot.com.
      media: '/blockly-media/',
    });
    wsRef.current = ws;
    loadProgram(ws, initialProgram);
    const onChange = (e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      countRef.current(countBlocks(workspaceToProgram(ws)));
    };
    ws.addChangeListener(onChange);
    countRef.current(countBlocks(workspaceToProgram(ws)));
    const resize = new ResizeObserver(() => Blockly.svgResize(ws));
    resize.observe(hostRef.current!);
    return () => {
      resize.disconnect();
      ws.dispose();
      wsRef.current = null;
    };
    // The editor is re-created per level via `key`, so props are read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getProgram: () => (wsRef.current ? workspaceToProgram(wsRef.current) : []),
    highlight: (id) => wsRef.current?.highlightBlock(id),
  }));

  return <div ref={hostRef} className="blockly-host" />;
}
