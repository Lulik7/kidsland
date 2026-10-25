"""Records the robot guide narration in Greek with Piper (voice el_GR rapunzelina low, CC0).

Usage: python3 scripts/record_guide_el.py <scenes.json> <el-gr-rapunzelina-low.onnx>
scenes.json is [{"i": scene index, "text": Greek text}], taken from the RobotGuide scenes and i18n.el.ts.
"""
import sys
import json, subprocess, wave, os
from piper import PiperVoice
from piper.config import SynthesisConfig
SUB={'Kidsland':'Κίντσλαντ','Scratch':'Σκρατς','Roblox':'Ρόμπλοξ','Python':'Πάιθον','Unity':'Γιούνιτι','XP':'πόντους εμπειρίας','email':'ιμέιλ'}
v=PiperVoice.load(sys.argv[2])
out='packages/client/public/voice/el'
for x in json.load(open(sys.argv[1])):
    t=x['text']
    for a,b in SUB.items(): t=t.replace(a,b)
    wav='/tmp/guide-el.wav'
    with wave.open(wav,'wb') as w: v.synthesize_wav(t,w,syn_config=SynthesisConfig(length_scale=1.0))
    r=v.config.sample_rate
    # a touch higher and brighter, so the robot sounds cheerful but every word stays clear
    af=f'asetrate={r}*1.07,aresample=22050,atempo={1/1.07:.4f},highpass=f=90,loudnorm=I=-16'
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i',wav,'-af',af,'-ac','1','-b:a','48k',f'{out}/{x["i"]}.mp3'],check=True)
print('ok')
