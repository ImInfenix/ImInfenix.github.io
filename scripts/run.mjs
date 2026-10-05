import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { safePath } from './workspace.mjs';

const [tool, ...args] = process.argv.slice(2);
const bins = { astro: '../node_modules/astro/bin/astro.mjs' };
if (!(tool in bins)) throw new Error(`Outil inconnu : ${tool}`);
const temp = safePath('.tools/tmp');
mkdirSync(temp, { recursive: true });
const child = spawn(process.execPath, [fileURLToPath(new URL(bins[tool], import.meta.url)), ...args], {
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', TMPDIR: temp, TEMP: temp, TMP: temp },
});
child.on('error', (error) => { console.error(error); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
