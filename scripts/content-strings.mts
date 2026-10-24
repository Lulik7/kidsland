// Prints every Russian string of courses and articles that needs a translation, as a JSON array.
import { ARTICLES, COURSES } from '../packages/shared/src/index';
import { collectStrings } from '../packages/client/src/content/segments';

const all = collectStrings([COURSES, ARTICLES], new Set<string>());
process.stdout.write(JSON.stringify([...all].sort()));
