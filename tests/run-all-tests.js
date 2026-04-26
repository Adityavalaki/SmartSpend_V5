const { spawnSync } = require('child_process');
const path = require('path');

const tests = [
  'balance-sync.test.js',
  'dashboard-balance.test.js'
];

let failed = false;
for (const t of tests) {
  const p = path.join(__dirname, t);
  const res = spawnSync(process.execPath, [p], { stdio: 'inherit' });
  if (res.status !== 0) {
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
}

console.log('All tests passed.');
