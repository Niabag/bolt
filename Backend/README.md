# Backend Setup

This API requires Node.js with pnpm or npm.

1. Copy `.env.example` to `.env` and update the values.
2. Install dependencies:
   ```
   pnpm install
   ```
3. Start the development server:
   ```
   pnpm run dev
   ```

The server includes Stripe support. Ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are defined in your `.env`.
You can customize the trial duration with `TRIAL_PERIOD_DAYS`.

### Card view tracking

The endpoint `/api/business-cards/track-view/:userId` records when a visitor scans
your digital business card. To prevent duplicate notifications caused by quick
page redirects, consecutive views within 30 seconds are now merged into a single
event. Only the first view in that time window triggers a real-time
"card_scan" notification.
