const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'transactions.js'), 'utf8');

const context = {
  console,
  MODE_LABEL: { upi: 'UPI' },
  cfg: { currency: '₹' },
  fmt: (n) => Number(n).toFixed(2),
  catEmoji: () => '🍔',
};

vm.createContext(context);
vm.runInContext(code, context);

assert.strictEqual(typeof context.txCard, 'function', 'txCard should exist');

const html = context.txCard({
  id: 'abc"def',
  pay_mode: 'upi',
  type: 'expense',
  tx_date: '2026-04-26',
  category: 'Food',
  amount: 25,
  description: 'test',
  recurring: false,
}, true);

assert.ok(html.includes('data-txid="abc&quot;def"'), 'delete button should HTML-escape tx id in data attribute');
assert.ok(html.includes("onclick=\"delTx(this.getAttribute('data-txid'))\""), 'delete button should read ID from data attribute');

console.log('transaction-delete-button.test.js passed');
