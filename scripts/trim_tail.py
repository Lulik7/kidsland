"""Cuts the drawn-out tail some Piper voices add after short words (Greek "καλός" came out 6 s long).

Usage: python3 scripts/trim_tail.py [--word] <file.mp3>...   (rewrites files in place, prints what changed)
--word: each file is one word, so it ends with its first loud stretch.
The word itself is the first loud stretch; it ends where a quiet run of 0.4 s or more begins,
and the file is cut there only when more sound (the model babbling on) comes after that pause.
"""
import array, subprocess, sys

RATE, STEP = 24000, 1200  # 50 ms frames


def envelope(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(RATE), '-'], capture_output=True, check=True).stdout
    s = array.array('h', raw)
    return [(sum(x * x for x in s[i:i + STEP]) / max(1, len(s[i:i + STEP]))) ** 0.5 for i in range(0, len(s), STEP)]


def cut_point(env):
    """Seconds where the word ends, or None when nothing needs cutting."""
    peak = max(env, default=0)
    if not peak:
        return None
    loud = [e > peak * 0.3 for e in env]
    start = loud.index(True)
    quiet = 0
    for i in range(start, len(env)):
        quiet = quiet + 1 if not loud[i] else 0
        if quiet == 8:  # 0.4 s of quiet: the word is over
            end = i - quiet + 1
            # Cut only when loud babble follows the pause; keep 0.2 s for a soft final consonant.
            return (end + 4) * STEP / RATE if any(loud[i:]) else None
    return None


def word_cut_point(env):
    """For a single word: it ends after the first loud run (short dips inside the word allowed),
    and is cut there when more sound keeps going after it."""
    peak = max(env, default=0)
    if not peak:
        return None
    loud = [e > peak * 0.3 for e in env]
    start = loud.index(True)
    gap, end = 0, len(env)
    for i in range(start, len(env)):
        gap = gap + 1 if not loud[i] else 0
        if gap > 2:
            end = i - gap + 1
            break
    keep = end + 4  # 0.2 s for a soft final consonant like «ς»
    return keep * STEP / RATE if any(e > peak * 0.1 for e in env[keep:]) else None


def trim(path, single_word=False):
    env = envelope(path)
    cut = word_cut_point(env) if single_word else cut_point(env)
    if cut is None:
        return None
    tmp = path + '.tmp.mp3'
    af = f'atrim=0:{cut:.2f},afade=t=out:st={max(0, cut - 0.12):.2f}:d=0.12,apad=pad_dur=0.25'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', path, '-af', af, '-ac', '1', '-b:a', '64k', tmp], check=True)
    subprocess.run(['mv', tmp, path], check=True)
    return len(env) * STEP / RATE, cut


if __name__ == '__main__':
    word = sys.argv[1] == '--word'
    for p in sys.argv[1 + word:]:
        r = trim(p, word)
        if r:
            print(f'{p}: {r[0]:.1f}s -> {r[1] + 0.25:.1f}s')
