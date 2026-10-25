/**
 * Reads settings files for local runs, forgiving the usual Windows slips: the file saved as ".env.txt",
 * put in the project root instead of packages/server, a BOM, spaces around "=", quotes, or the Google
 * app password pasted with its spaces. Values already in the environment win.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = join(serverDir, '..', '..');
const CANDIDATES = [join(serverDir, '.env'), join(serverDir, '.env.txt'), join(rootDir, '.env'), join(rootDir, '.env.txt')];

/** Which settings files were found, for the admin's mail page. */
export const envFilesFound: string[] = [];
/** Files that hold an SMTP_URL line, once per line, so a duplicate shows up on the mail page. */
export const smtpUrlFiles: string[] = [];
/** SMTP_URL set in Windows itself (setx, system variables) before the files were read; the file now wins over it. */
export const smtpUrlFromSystem = process.env.SMTP_URL?.replace(/\s+/g, '') ?? '';
let smtpFromFile = false;

for (const file of CANDIDATES) {
  if (!existsSync(file)) continue;
  envFilesFound.push(file);
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
    // A mail address never has spaces: they come from copying the app password as Google shows it.
    if (key === 'SMTP_URL') {
      value = value.replace(/\s+/g, '');
      smtpUrlFiles.push(file);
      // The admin edits the file, so its mail line wins over an old one left in Windows settings.
      if (!smtpFromFile && value) {
        process.env.SMTP_URL = value;
        smtpFromFile = true;
        continue;
      }
    }
    if (process.env[key] === undefined || process.env[key] === '') process.env[key] = value;
  }
}

// Node's own --env-file keeps the spaces of a pasted Google app password; drop them here too.
if (process.env.SMTP_URL) process.env.SMTP_URL = process.env.SMTP_URL.trim().replace(/^(["'])(.*)\1$/, '$2').replace(/\s+/g, '');
