# Test Credentials

## Admin Account
- **Email:** admin@meatbirdz.com
- **Password:** admin123
- **Role:** ADMIN
- **Access:** Can view and manage all orders in the admin dashboard

## Customer Account
- **Email:** customer@meatbirdz.com
- **Password:** customer123
- **Role:** CUSTOMER
- **Access:** Can browse menu, place orders, and view their own order history

## Features by Role

### Admin Features
- Access to `/admin` dashboard
- View all orders from all customers
- Update order status (Confirmed, Preparing, Ready, Delivered)
- See complete order details including customer information and delivery address
- View payment status for all orders

### Customer Features
- Browse menu and add items to cart
- Place orders with delivery information
- View order history in `/dashboard`
- See order status and details
- Secure payment processing

## Creating New Accounts

You can create new accounts by:
1. Going to `/register`
2. Filling out the registration form
3. New accounts are created as CUSTOMER role by default

## Notes

- All passwords are hashed using bcrypt
- Admin routes are protected and require ADMIN role
- Customer dashboard shows only their own orders
- Orders are linked to user accounts when logged in

