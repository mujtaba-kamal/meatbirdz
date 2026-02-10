# 📋 How to Get Database Connection String from Supabase

Step-by-step guide to copy your database connection string.

---

## Step 1: Log into Supabase

1. Go to: https://supabase.com
2. Click "Sign In" (or "Start your project" if you don't have an account)
3. Log in with your account

---

## Step 2: Open Your Project

1. You'll see your projects dashboard
2. Click on your project (e.g., `birminghamWebProject`)
3. Wait for it to load (if it's still setting up, wait a few minutes)

---

## Step 3: Go to Settings

1. Look at the **left sidebar**
2. Find the **⚙️ Settings** icon (gear icon) at the bottom
3. Click on **Settings**

---

## Step 4: Go to Database Settings

1. In the Settings page, look at the **left sidebar** again
2. You'll see several options:
   - API
   - Database ← **Click this one!**
   - Auth
   - Storage
   - etc.
3. Click on **Database**

---

## Step 5: Find Connection String

1. Scroll down the Database settings page
2. Look for a section called **"Connection string"** or **"Connection pooling"**
3. You'll see tabs like:
   - **URI** ← Click this tab!
   - Transaction mode
   - Session mode
4. Click on the **URI** tab

---

## Step 6: Copy the Connection String

1. You'll see a connection string that looks like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
2. **Click the copy button** (📋 icon) next to the connection string
   - OR select all the text and copy it (Cmd+C on Mac, Ctrl+C on Windows)

---

## Step 7: Replace [YOUR-PASSWORD]

The connection string has `[YOUR-PASSWORD]` as a placeholder.

1. **Paste** the connection string somewhere (text editor, notes app)
2. **Find** `[YOUR-PASSWORD]` in the string
3. **Replace** it with the actual password you created when setting up the Supabase project
   - This is the password you set in Step 2.2 of the deployment guide
   - If you forgot it, you'll need to reset it (see below)

**Example:**
```
Before: postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
After:  postgresql://postgres.xxxxx:MySecurePassword123@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

---

## Step 8: Save the Connection String

1. **Copy the complete connection string** (with your password replaced)
2. **Save it somewhere safe** - you'll need it for:
   - Vercel environment variables
   - Local database setup
   - Future reference

⚠️ **Important:** Keep this connection string secure! Don't share it publicly.

---

## 🔍 Visual Guide

Here's what you're looking for:

```
Supabase Dashboard
├── Left Sidebar
│   ├── Table Editor
│   ├── SQL Editor
│   ├── ...
│   └── ⚙️ Settings ← Click here
│       └── Database ← Click here
│           └── Scroll down
│               └── Connection string
│                   └── URI tab ← Click here
│                       └── Copy button 📋
```

---

## 🔑 If You Forgot Your Database Password

### Option 1: Reset Password in Supabase

1. Go to Supabase → Your Project → Settings → Database
2. Scroll to **"Database password"** section
3. Click **"Reset database password"**
4. Enter a new password
5. **Save it!**
6. Update your connection string with the new password

### Option 2: Check Your Notes

- Check where you saved it when creating the project
- Check your password manager
- Check your email (Supabase might have sent it)

---

## ✅ Verify Your Connection String

Your connection string should look like this:

```
postgresql://postgres.xxxxxxxxxxxxx:YOUR_PASSWORD_HERE@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Parts of the connection string:**
- `postgresql://` - Protocol
- `postgres.xxxxxxxxxxxxx` - Your project identifier
- `YOUR_PASSWORD_HERE` - Your database password (replace this!)
- `aws-0-us-west-1.pooler.supabase.com` - Supabase server
- `6543` - Port number
- `postgres` - Database name

---

## 🎯 What to Do Next

Once you have your connection string:

1. **For Vercel:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Add new variable:
     - Key: `DATABASE_URL`
     - Value: Your connection string (with password replaced)
     - Save

2. **For Local Setup:**
   - Create/update `.env` file in your project
   - Add: `DATABASE_URL="your_connection_string_here"`

---

## 🆘 Troubleshooting

### Can't find Connection String?
- Make sure you're in the **Database** section of Settings
- Scroll down - it's usually near the bottom
- Look for "Connection string" or "Connection pooling"

### Connection String doesn't work?
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- Check if password has special characters (may need URL encoding)
- Verify your Supabase project is active and running

### Password has special characters?
If your password has special characters like `@`, `#`, `%`, etc., you may need to URL encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- Or use Supabase's password reset to create a simpler password

---

## 📝 Quick Checklist

- [ ] Logged into Supabase
- [ ] Opened your project
- [ ] Went to Settings → Database
- [ ] Found "Connection string" section
- [ ] Clicked "URI" tab
- [ ] Copied the connection string
- [ ] Replaced `[YOUR-PASSWORD]` with actual password
- [ ] Saved the connection string securely

---

**That's it!** You now have your database connection string ready to use! 🎉

