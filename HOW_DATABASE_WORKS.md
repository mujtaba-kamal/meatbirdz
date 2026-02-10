# 🗄️ How Your Database Gets Set Up in Supabase

## Understanding the Process

**You don't "copy" a database to Supabase.** Instead, you:
1. Create an **empty** database in Supabase
2. **Create the structure** (tables) using Prisma
3. **Add initial data** (menu items, users) using the seed script

---

## Step-by-Step Process

### Step 1: Create Empty Database in Supabase ✅

When you create a Supabase project:
- You get a **fresh, empty PostgreSQL database**
- No tables, no data - just an empty database
- This is like getting a blank notebook

**What you have:**
- Database connection string
- Empty database ready to use

---

### Step 2: Create Database Structure (Tables) 📋

Your database needs **tables** to store data. This is defined in `prisma/schema.prisma`.

**What Prisma does:**
- Reads your schema file
- Creates tables in Supabase based on your schema
- Sets up relationships between tables

**Tables that will be created:**
- `MenuItem` - Stores your menu items (burgers, wraps, etc.)
- `User` - Stores user accounts (customers, admin)
- `Order` - Stores customer orders
- `OrderItem` - Stores items in each order

**How to do it:**
```bash
# Set your database URL
export DATABASE_URL="your_supabase_connection_string"

# Create the tables in Supabase
npx prisma db push
```

**What happens:**
- Prisma connects to your Supabase database
- Creates all the tables defined in `schema.prisma`
- Sets up columns, data types, relationships
- Your database now has structure, but no data yet

---

### Step 3: Add Initial Data (Seed) 🌱

Now you need to **fill the database** with initial data:
- Menu items (burgers, wraps, drinks, etc.)
- Test users (admin, customer accounts)

**How to do it:**
```bash
# Make sure DATABASE_URL is set
export DATABASE_URL="your_supabase_connection_string"

# Add initial data
npx prisma db seed
```

**What happens:**
- Runs the `prisma/seed.ts` script
- Creates menu items (all your burgers, wraps, fries, drinks)
- Creates test users (admin@meatbirdz.com, customer@meatbirdz.com)
- Your database now has data!

---

## Visual Explanation

```
Step 1: Supabase Project Created
┌─────────────────┐
│  Empty Database │  ← Just created, nothing in it
└─────────────────┘

Step 2: Run `prisma db push`
┌─────────────────┐
│  Database with  │
│  Tables Created │  ← Structure is ready
│  - MenuItem     │
│  - User         │
│  - Order        │
│  - OrderItem    │
└─────────────────┘
     (Empty tables)

Step 3: Run `prisma db seed`
┌─────────────────┐
│  Database with  │
│  Tables + Data  │  ← Now has menu items and users!
│  - MenuItem     │
│    ✓ 50+ items  │
│  - User         │
│    ✓ Admin      │
│    ✓ Customer   │
│  - Order        │
│    (empty)      │
│  - OrderItem    │
│    (empty)      │
└─────────────────┘
```

---

## Complete Setup Process

### Option A: Using Terminal (Recommended)

```bash
# 1. Navigate to your project
cd /Users/mujtaba/birminghamWebProject

# 2. Set your database connection string
export DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# 3. Create the database structure (tables)
npx prisma db push

# You'll see output like:
# ✔ Generated Prisma Client
# ✔ Database schema pushed successfully

# 4. Add initial data (menu items, test users)
npx prisma db seed

# You'll see output like:
# Test users created:
# Admin: admin@meatbirdz.com / admin123
# Customer: customer@meatbirdz.com / customer123
# Menu items created: 50+
```

### Option B: Using .env File

```bash
# 1. Create/edit .env file in your project root
# Add this line:
DATABASE_URL="your_supabase_connection_string"

# 2. Run the commands (DATABASE_URL will be read from .env)
npx prisma db push
npx prisma db seed
```

---

## What Gets Created?

### 1. Database Tables (from `prisma/schema.prisma`)

**MenuItem Table:**
- Stores all your menu items
- Fields: id, name, description, price, category, image, available

**User Table:**
- Stores user accounts
- Fields: id, name, email, password, role, phone

**Order Table:**
- Stores customer orders
- Fields: id, customerName, customerEmail, totalAmount, status, etc.

**OrderItem Table:**
- Stores items in each order
- Fields: id, orderId, menuItemId, quantity, price

### 2. Initial Data (from `prisma/seed.ts`)

**Menu Items:**
- All burgers (Angus Classic, BBQ Bacon, etc.)
- All wraps (Chicken Wrap, Veggie Wrap, etc.)
- All sides (Fries, Loaded Fries, etc.)
- All drinks (Coca Cola, Sprite, etc.)
- All dips and boxes
- **Total: 50+ menu items**

**Test Users:**
- Admin: `admin@meatbirdz.com` / `admin123`
- Customer: `customer@meatbirdz.com` / `customer123`

---

## Verify It Worked

### Check in Supabase Dashboard:

1. Go to Supabase → Your Project
2. Click **Table Editor** (left sidebar)
3. You should see:
   - ✅ `MenuItem` table (with 50+ items)
   - ✅ `User` table (with 2 test users)
   - ✅ `Order` table (empty, ready for orders)
   - ✅ `OrderItem` table (empty, ready for order items)

### Check via Terminal:

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
```

This opens a web interface where you can see all your data!

---

## Important Notes

### ⚠️ You Need to Do This Manually

- Supabase doesn't automatically copy your database
- You need to run `prisma db push` and `prisma db seed`
- This is a one-time setup (or whenever you change the schema)

### 🔄 When to Run Again

Run `prisma db push` when:
- You change `prisma/schema.prisma` (add/remove tables, fields)
- You need to update the database structure

Run `prisma db seed` when:
- You want to reset menu items
- You want to add more test data
- You want to clear and re-add initial data

### 🚫 Don't Run Seed in Production

- `prisma db seed` clears existing data and re-adds it
- Only use it for initial setup or development
- In production, add data through your website interface

---

## Troubleshooting

### "Can't reach database server"
- Check your `DATABASE_URL` is correct
- Make sure Supabase project is active (not paused)
- Verify password is correct

### "Table already exists"
- Tables were already created
- This is fine - Prisma will update them if needed
- You can continue to seed

### "Seed script failed"
- Check your `DATABASE_URL` is set
- Make sure `prisma db push` ran successfully first
- Check the error message for details

---

## Summary

**Your database setup process:**

1. ✅ **Create Supabase project** → Get empty database
2. ✅ **Run `prisma db push`** → Create tables (structure)
3. ✅ **Run `prisma db seed`** → Add menu items and test users

**Result:** Fully functional database with all your menu items ready to use! 🎉

---

## Quick Command Reference

```bash
# Set database URL
export DATABASE_URL="your_connection_string"

# Create tables
npx prisma db push

# Add initial data
npx prisma db seed

# View database (optional)
npx prisma studio
```

That's it! Your database will be set up and ready to use. 🚀

