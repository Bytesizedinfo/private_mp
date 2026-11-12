# Spend & Save

A budgeting app for your phone and computer. It answers three things:

- **How much can I spend?** One "safe to spend" number for the month (bills and set-asides already taken off), with Today / Week / Month / All views.
- **Am I saving?** A savings % comes off every pay first.
- **When will my goals be done?** Goals (emergency fund, trips, big purchases, debts) get monthly amounts worked out from your projected income, in priority order.

Tabs: **Home** (safe to spend, this month's plan, goals), **Goals** (progress rings, timeline, phases, catch-up options), **Forecast** (income ahead, where each pay goes, savings growth, past insights) and **More** (activity, plan settings, bills, categories, settings).

**Your data stays on your phone.** Nothing you log is sent anywhere or stored in this repository. Use More → Settings → Download a backup now and then.

## Install it
- **iPhone:** open the site in Safari, tap Share, then **Add to Home Screen**.
- **Android:** open the site in Chrome, tap the menu, then **Install app**.
- **Computer:** open the site in Chrome or Edge and choose **Install** in the address bar.

## Moving your data in
On the first screen, tap **Restore from a backup** and pick a Spend & Save backup file (`spend-save-backup-….json`). Backups from older versions are upgraded when they load.

## Changing the app
The page is built from `src/`; don't edit `index.html` by hand.

```
python build.py
```

This writes `index.html` (this site), `dist/artifact.html` (the claude.ai version) and a new cache name in `sw.js`, so installed copies pick up the update. It also writes two test pages:

- `tests/engine_test.html` checks the money maths in `src/money.js`.
- `tests/app_test.html` clicks through every screen with example data.

Open either in a browser; the page title says PASS or FAIL.
