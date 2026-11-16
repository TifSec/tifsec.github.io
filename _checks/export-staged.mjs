import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const cwd = resolve(process.argv[2]);
const paths = execFileSync('git', ['diff', '--cached', '--name-only'], { cwd, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const files = paths.map(path => ({ path: path.replaceAll('\\', '/'), content: readFileSync(resolve(cwd, path)).toString('base64') }));
process.stdout.write(JSON.stringify(files));
