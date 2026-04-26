# SmartSpend Smoke Test Checklist

Use this checklist after each deploy or service-worker cache bump.

## Quick Automation (local)
- [ ] Run `node tests/run-all-tests.js` and confirm all tests pass.
- [ ] Run `node tests/balance-sync.test.js` and confirm it passes.

## Boot & Session
- [ ] Open app and confirm no health-check error toast appears.
- [ ] Verify Dashboard tab loads by default.
- [ ] Verify user badge and theme button render normally.

## Balance Consistency
- [ ] Confirm **Header Net Balance** equals **Cash Wallet + Digital Wallet**.
- [ ] Confirm equation line (`Income - Expenses`) can differ from wallet net and still update.

## Transactions
- [ ] Add an **expense (digital)** and confirm without refresh:
  - [ ] transaction appears in history
  - [ ] digital wallet card updates
  - [ ] header net balance updates
- [ ] Add an **income (cash)** and confirm same instant updates.
- [ ] Delete a transaction and confirm balances re-sync without refresh.

## Wallets / Goals / Split
- [ ] Set cash and digital wallet balances manually.
- [ ] Perform a transfer and verify history + balances.
- [ ] Create and delete a goal.
- [ ] Create and delete a split expense.

## Analytics / Export / Settings
- [ ] Open analytics tab; verify charts render.
- [ ] Export CSV and JSON successfully.
- [ ] Change currency setting and confirm dashboard reflects it.

## Feedback
- [ ] Submit feedback with rating + message.
- [ ] Verify entry appears in recent feedback list.

## PWA / Cache Update
- [ ] After deploy, reload once to ensure latest service worker is active.
- [ ] Re-open app and confirm no stale balance behavior.
