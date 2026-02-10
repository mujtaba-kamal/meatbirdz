# 💻 How to Run Database Commands

Step-by-step guide on where and how to run the database setup commands.

---

## Where to Run Commands

**In your Terminal/Command Prompt**, in your project folder.

---

## Step-by-Step Instructions

### Step 1: Open Terminal

**On Mac:**
- Press `Cmd + Space` (Spotlight)
- Type "Terminal"
- Press Enter
- OR use the Terminal app in Applications → Utilities

**On Windows:**
- Press `Win + R`
- Type `cmd` and press Enter
- OR search "Command Prompt" in Start menu

**On Linux:**
- Press `Ctrl + Alt + T`
- OR open Terminal from applications

---

### Step 2: Navigate to Your Project Folder

In the terminal, type:

```bash
cd /Users/mujtaba/birminghamWebProject
```

Press Enter.

**Verify you're in the right place:**
```bash
pwd
```

Should show: `/Users/mujtaba/birminghamWebProject`

---

### Step 3: Get Your DATABASE_URL from Vercel

1. **Open your browser**
2. Go to: https://vercel.com
3. Sign in
4. Click on your `birminghamWebProject` project
5. Go to **Settings** → **Environment Variables**
6. Find `DATABASE_URL`
7. **Click the eye icon** 👁️ to reveal the value
8. **Copy the entire connection string**

It should look like:
```
postgresql://postgres.xxxxx:YourPassword@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

---

### Step 4: Set the DATABASE_URL

**In your terminal**, type:

```bash
export DATABASE_URL="paste_your_connection_string_here"
```

**Important:**
- Replace `paste_your_connection_string_here` with the actual connection string you copied
- Keep the quotes `"..."` around it
- Make sure the password in the connection string is correct (not `[YOUR-PASSWORD]`)

**Example:**
```bash
export DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MyPassword123@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

Press Enter.

---

### Step 5: Test the Connection

**In the same terminal**, type:

```bash
npx prisma db push --skip-generate
```

Press Enter.

**What you'll see:**

**If successful:**
```
✔ Generated Prisma Client
✔ Database schema pushed successfully
```

**If it fails:**
- You'll see an error message
- Common errors:
  - "Can't reach database server" → Connection string might be wrong
  - "Authentication failed" → Password might be wrong
  - "Table already exists" → That's okay, tables are already there

---

### Step 6: Set Up Database (If Tables Don't Exist)

If the connection test worked, set up your database:

```bash
# Create tables
npx prisma db push

# Add menu items and test users
npx prisma db seed
```

**What happens:**
- `npx prisma db push` - Creates all tables in your database
- `npx prisma db seed` - Adds menu items and test users

**You'll see output like:**
```
Test users created:
Admin: admin@meatbirdz.com / admin123
Customer: customer@meatbirdz.com / customer123
Menu items created: 50+
```

---

## Complete Example Session

Here's what your terminal session should look like:

```bash
# 1. Navigate to project
cd /Users/mujtaba/birminghamWebProject

# 2. Set database URL (replace with your actual connection string)
export DATABASE_URL="postgresql://postgres.xxxxx:YourPassword@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# 3. Test connection
npx prisma db push --skip-generate

# 4. If successful, set up database
npx prisma db push

# 5. Add initial data
npx prisma db seed
```

---

## Important Notes

### ⚠️ Keep Terminal Window Open

- The `export DATABASE_URL` command only works in that terminal session
- If you close the terminal, you'll need to run `export DATABASE_URL` again
- Or use a `.env` file (see below)

### 🔄 Using .env File (Alternative)

Instead of `export`, you can create a `.env` file:

1. **Create `.env` file** in your project root:
   ```bash
   cd /Users/mujtaba/birminghamWebProject
   nano .env
   # OR
   code .env
   ```

2. **Add this line:**
   ```
   DATABASE_URL="your_connection_string_here"
   ```

3. **Save the file**

4. **Now you can run commands without `export`:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

**Note:** `.env` file is already in `.gitignore`, so it won't be committed to GitHub.

---

## Troubleshooting

### "Command not found: npx"

**Fix:** Install Node.js
- Download from: https://nodejs.org
- Install it
- Restart terminal
- Try again

### "Can't reach database server"

**Possible causes:**
- Connection string is wrong
- Supabase project is paused
- Wrong password

**Fix:**
- Double-check connection string from Vercel
- Make sure Supabase project is active
- Verify password is correct

### "Permission denied"

**Fix:**
- Make sure you're in the correct directory
- Check file permissions

---

## Quick Reference

**Where:** Terminal/Command Prompt  
**Directory:** `/Users/mujtaba/birminghamWebProject`  
**Commands:**
```bash
cd /Users/mujtaba/birminghamWebProject
export DATABASE_URL="your_connection_string"
npx prisma db push
npx prisma db seed
```

---

**That's it!** Run these commands in your terminal to set up your database. 🚀

