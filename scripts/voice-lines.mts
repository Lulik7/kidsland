// Lists every line of a language course that the site reads aloud, with the speaker's gender,
// for scripts/record_voices.py. Usage: npx tsx scripts/voice-lines.mts fr > /tmp/fr-lines.json
import { voiceLines } from './voiceLines.mts';

console.log(JSON.stringify(voiceLines(process.argv[2])));
