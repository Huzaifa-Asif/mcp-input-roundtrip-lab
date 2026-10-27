import { execFileSync } from 'node:child_process';
import { isEditorialPath } from './public-boundary-policy.mjs';

let files = [];
try {
  files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
} catch {
  throw new Error('Git index unavailable; the editorial boundary cannot be verified.');
}
const leaked = files.filter(isEditorialPath);
if (leaked.length) throw new Error(`Editorial-only paths are tracked: ${leaked.join(', ')}`);
console.log(`Verified ${files.length} tracked paths; editorial boundary clear.`);
