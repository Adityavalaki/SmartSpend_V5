# SmartSpend Deployment Guide

## 1) Pre-deploy gates
1. Run automated regression tests:
   ```bash
   node tests/run-all-tests.js
   ```
2. Run smoke checklist:
   - Follow `SMOKE_TEST_CHECKLIST.md`.

## 2) Deploy
- Push to `main` (or release branch) and let GitHub Pages publish.
- CI (`.github/workflows/node-tests.yml`) must pass before merge.

## 3) Cache rollout notes
- Service worker uses a versioned cache key in `sw.js` (`CACHE_NAME`).
- When changing runtime behavior or module wiring, bump cache key and script query versions.

## 4) Post-deploy verification
1. Reload once to activate latest SW.
2. Open browser console and verify health check log includes build metadata.
3. Confirm dashboard net balance and wallet cards remain in sync after add/delete transaction.

## 5) Rollback strategy
- Revert last commit and redeploy.
- Bump `CACHE_NAME` again to force clients off bad assets.
