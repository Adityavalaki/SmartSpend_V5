const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync(require('path').join(__dirname, '..', 'transactions.js'), 'utf8');
const context = {
  console,
  window: {},
  document: {},
};
vm.createContext(context);
vm.runInContext(code, context);

assert.strictEqual(typeof context.applyWalletDelta, 'function', 'applyWalletDelta should exist');

function plain(v) {
  return JSON.parse(JSON.stringify(v));
}

let wallets = { cash: 100, digital: 200 };
wallets = context.applyWalletDelta(wallets, 'cash', 'expense', 25);
assert.deepStrictEqual(plain(wallets), { cash: 75, digital: 200 }, 'cash expense should reduce cash wallet');

wallets = context.applyWalletDelta(wallets, 'cash', 'income', 5);
assert.deepStrictEqual(plain(wallets), { cash: 80, digital: 200 }, 'cash income should increase cash wallet');

wallets = context.applyWalletDelta(wallets, 'upi', 'expense', 50);
assert.deepStrictEqual(plain(wallets), { cash: 80, digital: 150 }, 'digital expense should reduce digital wallet');

wallets = context.applyWalletDelta(wallets, 'debit_card', 'income', 20);
assert.deepStrictEqual(plain(wallets), { cash: 80, digital: 170 }, 'digital income should increase digital wallet');

console.log('balance-sync.test.js passed');
