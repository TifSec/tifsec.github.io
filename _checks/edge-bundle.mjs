import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../_supabase/functions/',import.meta.url));
function list(directory) {
    return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?list(resolve(directory,entry.name)):
        /\.(mjs|ts|json|jsonc)$/.test(entry.name)?[resolve(directory,entry.name)]:[]);
}
const files=list(root).map(path=>({name:relative(root,path).replaceAll('\\','/'),content:readFileSync(path,'utf8')}));
process.stdout.write(JSON.stringify(files));
