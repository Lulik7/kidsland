"""Records lesson lines with Piper neural voices (https://github.com/rhasspy/piper).

Usage: python3 scripts/record_voices.py <lang> <lines.json> <female.onnx> <male.onnx|-> [male pitch factor]
LENGTH_SCALE (env, default 1.0; single words are said 1.3 times slower) sets the speaking pace: smaller is quicker.
Writes packages/client/public/voice/<lang>/lines/<hash>-<f|m>.mp3 and skips files that already exist.
With "-" for the male model, the female voice is pitched down for male speakers.
A model written as "espeak:<voice>" (e.g. espeak:ka+f3) records with espeak-ng, for languages Piper lacks.
"""
import array, json, os, subprocess, sys, tempfile, wave
from trim_tail import trim
from piper import PiperVoice
from piper.config import SynthesisConfig

# The Greek voice drags out a word said on its own and babbles after it for seconds. Inside a phrase
# («ναι, και ναι.») it says the word at a natural pace, so we record the phrase and keep the first word.
CARRIER_LANGS = {'el'}


def first_word_only(path, phonemes, inner_pause=False):
    """Keeps the first word of «word, και word.»: the cut goes at the quietest moment (the comma's pause)
    near where a word of this many phonemes should end."""
    with wave.open(path) as r:
        params, frames = r.getparams(), r.readframes(r.getnframes())
    s = array.array('h', frames)
    step = params.framerate // 40  # 25 ms
    env = [(sum(x * x for x in s[i:i + step]) / max(1, len(s[i:i + step]))) ** 0.5 for i in range(0, len(s), step)]
    peak = max(env, default=0)
    if not peak:
        return
    start = next(k for k, e in enumerate(env) if e > peak * 0.3)
    expected = (0.085 * phonemes + 0.1) * 40  # in frames
    # A phrase with its own comma pauses inside too: look for the end a little later.
    early, late = (1.05, 2.0) if inner_pause else (0.85, 1.8)
    lo, hi = start + int(expected * early), min(len(env) - 1, start + int(expected * late))
    if lo >= hi:
        return
    cut = min(range(lo, hi + 1), key=lambda k: env[k])
    if env[cut] > peak * 0.15:
        print('no clear pause after', path, file=sys.stderr)
    end = min(len(s), (cut + 1) * step)
    tail = array.array('h', s[:end])
    fade = min(len(tail), step * 3)
    for k in range(fade):
        tail[len(tail) - fade + k] = int(tail[len(tail) - fade + k] * (1 - k / fade))
    with wave.open(path, 'wb') as w:
        w.setparams(params)
        w.writeframes(tail.tobytes())


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
        short = len(item['text'].split()) <= 2
        carrier = short and lang in CARRIER_LANGS
        with wave.open(wav, 'wb') as w:
            # Single words come out rushed and clipped: say them slower.
            pace = float(os.environ.get('LENGTH_SCALE', '1.0')) * (1.1 if carrier else 1.3 if short else 1.0)
            text = f"{item['text'].rstrip('.!?;')}, και {item['text'].rstrip('.!?;')}." if carrier else item['text']
            v.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=pace))
        if carrier:
            first_word_only(wav, sum(len([p for p in ph if p not in 'ˈˌ ,.!?;']) for ph in v.phonemize(item['text'])), ',' in item['text'])
        rate = v.config.sample_rate
    # Clean-up for every voice: cut rumble and hiss, even out loudness.
    # Silence before and after, so browsers never swallow the start of a short word.
    clean = 'highpass=f=70,lowpass=f=7600,afftdn=nf=-30,loudnorm=I=-18:TP=-2,adelay=150:all=1,apad=pad_dur=0.25'
    if item['g'] == 'm' and male_model == '-':
        # Rubber Band moves the pitch and the voice timbre down without changing the tempo (no slow-motion effect).
        af = f'aresample=24000,rubberband=pitch={factor}:formant=shifted:pitchq=quality,{clean}'
    else:
        af = f'aresample=24000,{clean}'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-af', af, '-ac', '1', '-b:a', '64k', dst], check=True)
    if len(item['text'].split()) <= 2 and not carrier:
        trim(dst, len(item['text'].split()) == 1)  # short words: drop the babble some voices add after them
    made += 1
print(lang, 'recorded', made)
