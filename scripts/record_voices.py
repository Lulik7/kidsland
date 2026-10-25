"""Records lesson lines with Piper neural voices (https://github.com/rhasspy/piper).

Usage: python3 scripts/record_voices.py <lang> <lines.json> <female.onnx> <male.onnx|-> [male pitch factor]
LENGTH_SCALE (env, default 1.08) sets the speaking pace: smaller is quicker.
Writes packages/client/public/voice/<lang>/lines/<hash>-<f|m>.mp3 and skips files that already exist.
With "-" for the male model, the female voice is pitched down for male speakers.
A model written as "espeak:<voice>" (e.g. espeak:ka+f3) records with espeak-ng, for languages Piper lacks.
"""
import json, os, subprocess, sys, tempfile, wave
from piper import PiperVoice
from piper.config import SynthesisConfig

lang, lines_file, female_model, male_model = sys.argv[1:5]
factor = float(sys.argv[5]) if len(sys.argv) > 5 else 0.78
load = lambda m: m if m.startswith('espeak:') else PiperVoice.load(m)
voices = {'f': load(female_model)}
voices['m'] = voices['f'] if male_model == '-' else load(male_model)
out = os.path.join(os.path.dirname(__file__), '..', 'packages', 'client', 'public', 'voice', lang, 'lines')
os.makedirs(out, exist_ok=True)
wav = os.path.join(tempfile.gettempdir(), f'rec-{lang}.wav')
made = 0
for item in json.load(open(lines_file)):
    dst = os.path.join(out, item['file'] + '.mp3')
    if os.path.exists(dst):
        continue
    v = voices[item['g']]
    if isinstance(v, str):
        subprocess.run(['espeak-ng', '-v', v.split(':', 1)[1], '-s', '130', '-w', wav, item['text']], check=True)
        rate = 22050
    else:
        with wave.open(wav, 'wb') as w:
            v.synthesize_wav(item['text'], w, syn_config=SynthesisConfig(length_scale=float(os.environ.get('LENGTH_SCALE', '1.08'))))
        rate = v.config.sample_rate
    if item['g'] == 'm' and male_model == '-':
        af = f'asetrate={rate}*{factor},aresample=22050,atempo={1 / factor:.4f}'
    else:
        af = 'aresample=22050'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af', af, '-ac', '1', '-b:a', '32k', dst], check=True)
    made += 1
print(lang, 'recorded', made)
