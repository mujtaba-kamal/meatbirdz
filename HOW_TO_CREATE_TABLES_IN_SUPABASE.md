# 🗄️ How to Create Tables in Supabase (Manual Method)

Since the database connection isn't working yet, you can create the tables manually using Supabase's SQL Editor.

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Sign in and select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Copy and Paste the SQL Script

1. Open the file `supabase-setup.sql` in your project
2. Copy the entire contents
3. Paste it into the Supabase SQL Editor

### Step 3: Run the SQL Script

1. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
2. Wait for it to complete
3. You should see "Success. No rows returned"

### Step 4: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ `MenuItem`
   - ✅ `User`
   - ✅ `Order`
   - ✅ `OrderItem`

### Step 5: Seed Menu Items (Optional)

After tables are created, you can either:

**Option A: Use the setup API endpoint** (once connection works):
```
https://meatbirdz.vercel.app/api/setup-db
```

**Option B: Add items manually** in Supabase Table Editor:
- Go to Table Editor → `MenuItem` table
- Click "Insert" → "Insert row"
- Add menu items one by one

**Option C: Use the seed SQL script** (see `supabase-seed.sql`)

---

## What Gets Created?

- **MenuItem table**: Stores all menu items (burgers, wraps, drinks, etc.)
- **User table**: Stores user accounts (customers, admin)
- **Order table**: Stores customer orders
- **OrderItem table**: Stores items in each order

---

## Troubleshooting

### Error: "type already exists"
- The enum types might already exist
- This is okay, just continue

### Error: "relation already exists"
- Tables might already exist
- You can drop them first if needed:
  ```sql
  DROP TABLE IF EXISTS "OrderItem" CASCADE;
  DROP TABLE IF EXISTS "Order" CASCADE;
  DROP TABLE IF EXISTS "MenuItem" CASCADE;
  DROP TABLE IF EXISTS "User" CASCADE;
  ```
- Then run the setup script again

---

Once tables are created, your app will be able to store and retrieve data!

