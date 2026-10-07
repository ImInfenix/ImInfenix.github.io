import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { safePath } from './workspace.mjs';

const [toolName, ...toolArguments] = process.argv.slice(2);
if (toolName !== 'astro') throw new Error(`Outil inconnu : ${toolName}`);

const temporaryDirectory = safePath('.tools/tmp');
const astroExecutable = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));
mkdirSync(temporaryDirectory, { recursive: true });
const childProcess = spawn(process.execPath, [astroExecutable, ...toolArguments], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: '1',
    TMPDIR: temporaryDirectory,
    TEMP: temporaryDirectory,
    TMP: temporaryDirectory,
  },
});
childProcess.on('error', (error) => { console.error(error); process.exitCode = 1; });
childProcess.on('exit', (exitCode) => { process.exitCode = exitCode ?? 1; });
