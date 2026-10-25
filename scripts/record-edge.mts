// Re-records the lesson lines of a language with Microsoft Edge's natural voices, replacing the Piper recordings
// in packages/client/public/voice/<lang>/lines. It needs the internet, so run it on your own computer:
//   npx tsx scripts/record-edge.mts el
// Lines already recorded in this run are listed in lines/.edge-done and skipped, so it can be restarted.
import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { voiceLines } from './voiceLines.mts';

const VOICES: Record<string, { f: string; m: string; rate: string }> = {
  // Lessons play Greek 1.12× faster (speech.ts RECORDED_PACE), so record a little slower than normal.
  el: { f: 'el-GR-AthinaNeural', m: 'el-GR-NestorasNeural', rate: '-15%' },
};

const lang = process.argv[2];
const cfg = VOICES[lang];
if (!cfg) throw new Error(`No Edge voices set for "${lang}". Known: ${Object.keys(VOICES).join(', ')}`);
const dir = `packages/client/public/voice/${lang}/lines`;
mkdirSync(dir, { recursive: true });
const donePath = `${dir}/.edge-done`;
const done = new Set(existsSync(donePath) ? readFileSync(donePath, 'utf8').split('\n').filter(Boolean) : []);

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function synth(tts: MsEdgeTTS, text: string): Promise<Buffer> {
  const { audioStream } = tts.toStream(xml(text), { rate: cfg.rate });
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    audioStream.on('data', (c: Buffer) => chunks.push(c));
    audioStream.on('end', () => resolve(Buffer.concat(chunks)));
    audioStream.on('error', reject);
  });
}

const lines = voiceLines(lang).filter((l) => !done.has(l.file));
console.log(`${lines.length} lines to record`);
for (const g of ['f', 'm'] as const) {
  let tts = new MsEdgeTTS();
  await tts.setMetadata(cfg[g], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  let n = 0;
  for (const l of lines.filter((x) => x.g === g)) {
    for (let attempt = 1; ; attempt++) {
      try {
        const audio = await synth(tts, l.text);
        if (audio.length < 1000) throw new Error('empty audio');
        writeFileSync(`${dir}/${l.file}.mp3`, audio);
        appendFileSync(donePath, l.file + '\n');
        break;
      } catch (e) {
        if (attempt >= 4) throw new Error(`Could not record "${l.text}": ${e}`);
        // A dropped connection: wait and reconnect.
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        tts.close();
        tts = new MsEdgeTTS();
        await tts.setMetadata(cfg[g], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      }
    }
    if (++n % 50 === 0) console.log(`${g === 'f' ? 'female' : 'male'} voice: ${n}`);
  }
  tts.close();
}
console.log('Done. Now: git add packages/client/public/voice && git commit -m "Greek voices" && git push');
