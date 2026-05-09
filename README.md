# AimHarderAutoBooking

## Docker execution

1. Create the .env.development or .env.production file.
2. Run the command `pnpm run build:docker:development` or `pnpm run build:docker:production`.
3. Run the command `pnpm run start:development` or `pnpm run start:production`.

## Local execution

1. Create the .env.local file.
2. Execute `pnpm install`.
3. Run the command `pnpm run start:db:local`.
4. Run the command `pnpm run start:local`.

## Environment Variables

| Name | Description | Type |
|------|-------------|------|
| SIMULATION_MODE | *[Debugging]* If true, it only browses without making a reservation. If false, it makes a reservation. **Production value: false** | Boolean |
| EXECUTE_JOB | *[Debugging]* If true, it executes the cron job. If false, it doesn't execute the cron job and performs a direct execution. **Production value: true** | Boolean |
| SEND_TELEGRAM_NOTIFICATION | If true, it sends a Telegram notification. If false, it doesn't send a Telegram notification. | Boolean |
| DB_HOST | *localhost* for local execution. *couchdb-autobookings* for docker execution. | String |
