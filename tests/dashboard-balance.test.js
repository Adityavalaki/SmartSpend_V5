const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const elements = {};
function mk(id) {
  if (!elements[id]) {
    elements[id] = { id, textContent: '', className: '', style: {}, checked: false };
  }
  return elements[id];
}

const documentStub = {
  head: { appendChild: () => {} },
  documentElement: { style: {} },
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  getElementById: (id) => mk(id),
  querySelectorAll: () => [],
  addEventListener: () => {},
};

const context = {
  console,
  document: documentStub,
  window: { matchMedia: () => ({ matches: false }) },
  localStorage: { setItem() {}, getItem() { return 'auto'; } },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
};

vm.createContext(context);
vm.runInContext(code, context);

// Stub extracted module functions called by updateDashboard.
context.updateBudgetUI = () => {};
context.buildInsightsLocal = () => {};
context.renderRecent = () => {};
context.buildDashCharts = () => {};

// Prepare globals used by app logic.
context.cfg.currency = '₹';
context.wallets = { cash: 50, digital: 150 };
context.txs = [
  { type: 'income', amount: 500, pay_mode: 'cash', tx_date: context.TODAY },
  { type: 'expense', amount: 120, pay_mode: 'digital', tx_date: context.TODAY }
];

context.updateDashboard();

assert.strictEqual(mk('bal-val').textContent, '200.00', 'bal-val should use wallet net (cash + digital)');
assert.strictEqual(mk('bal-eq').textContent, '₹380', 'bal-eq should use flow balance (income - expense)');
assert.strictEqual(mk('bal-eq').className, 'pos', 'bal-eq should have positive class for positive flow');

console.log('dashboard-balance.test.js passed');
