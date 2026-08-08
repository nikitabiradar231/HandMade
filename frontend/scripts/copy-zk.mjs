// Copies the compiler-generated ZK assets (zkir + keys) from
// `contracts/managed/handmade-marketplace` into `frontend/public/zkConfig`,
// where the browser's FetchZkConfigProvider serves them.
//
// FetchZkConfigProvider expects this exact layout:
//   /zkConfig/zkir/<circuitId>.bzkir
//   /zkConfig/keys/<circuitId>.prover
//   /zkConfig/keys/<circuitId>.verifier
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = path.join(root, 'contracts', 'managed', 'handmade-marketplace');
const target = path.join(root, 'frontend', 'public', 'zkConfig');

if (!fs.existsSync(path.join(source, 'zkir'))) {
  console.error(
    `[copy-zk] Missing ${source}/zkir — run \`npm run compile\` at the repo root first.`,
  );
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(path.join(source, 'zkir'), path.join(target, 'zkir'), { recursive: true });
fs.cpSync(path.join(source, 'keys'), path.join(target, 'keys'), { recursive: true });

console.log(`[copy-zk] Copied ZK assets -> ${path.relative(root, target)}`);
