# Migrate Meal Options Column

The `selectedMealOptions` column needs to be added to the `OrderItem` table.

## Option 1: Use the Migration API Endpoint (Recommended)

Call this endpoint from your deployed Vercel app:

```
POST https://meatbirdz.vercel.app/api/migrate-meal-options?token=YOUR_SETUP_TOKEN
```

Replace `YOUR_SETUP_TOKEN` with the value from your Vercel environment variable `SETUP_TOKEN`.

### Using curl:
```bash
curl -X POST "https://meatbirdz.vercel.app/api/migrate-meal-options?token=YOUR_SETUP_TOKEN"
```

### Using browser:
Just visit the URL in your browser (GET request also works):
```
https://meatbirdz.vercel.app/api/migrate-meal-options?token=YOUR_SETUP_TOKEN
```

## Option 2: Run Prisma Migrate Locally

If you have database access locally:

```bash
npx prisma db push
```

This will push the schema changes including the new `selectedMealOptions` column.

## Verify Migration

After running the migration, try creating an order again. The error should be resolved.

