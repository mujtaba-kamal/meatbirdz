# Logo Setup Instructions

## Current Status
The logo file (`logo.png`) is not present in the `/public` directory.

## To Add Your Logo:

1. **Place your logo file here:**
   ```
   /public/logo.png
   ```

2. **Recommended specifications:**
   - Format: PNG (with transparency) or SVG
   - Size: At least 400x400px for best quality
   - Background: Transparent preferred
   - Should include: Chicken burger graphic, "MEATBIRDZ" text, "EST 2025", and "SMASH FRIED FIRE" tagline

3. **After adding the file:**
   - Hard refresh your browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows/Linux)
   - Or clear browser cache completely
   - The logo will automatically appear in:
     - **Navbar** (top left, small size)
     - **Homepage hero section** (center, large size)

## If Logo Still Not Showing:

1. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

2. **Check file name:**
   - Must be exactly: `logo.png` (lowercase)
   - Must be in `/public/` directory

3. **Restart dev server:**
   ```bash
   # Kill server
   lsof -ti:3000 | xargs kill -9
   
   # Clear cache
   rm -rf .next
   
   # Restart
   npm run dev
   ```

## Current Fallback
Until you add the logo file, a chef hat icon will be displayed as a fallback.

