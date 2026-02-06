# MeatBirdz - Online Food Ordering System

A modern, mobile-responsive online ordering website for fast food restaurants built with Next.js, TypeScript, and Stripe.

## Features

- 🍔 **Menu Display**: Browse burgers, wraps, fries, and drinks
- 🛒 **Shopping Cart**: Add items, adjust quantities, and manage your order
- 💳 **Payment Processing**: Secure card payments via Stripe
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 👨‍💼 **Admin Dashboard**: Restaurant owner can view and manage orders
- 📍 **Order Tracking**: Complete order details with delivery address
- ✅ **Order Confirmation**: Real-time order status updates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: Stripe
- **State Management**: Zustand
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/meatbirdz?schema=public"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Set up the database:

```bash
# Push Prisma schema to database
npm run db:push

# Seed the database with sample menu items
npm run db:seed
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up a webhook endpoint:
   - URL: `https://yourdomain.com/api/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook secret to your `.env` file

## Project Structure

```
meatbirdz/
├── app/
│   ├── api/          # API routes
│   ├── admin/        # Admin dashboard
│   ├── cart/         # Shopping cart page
│   ├── checkout/     # Checkout page
│   ├── menu/         # Menu display page
│   ├── payment/      # Payment processing page
│   └── order-confirmation/  # Order confirmation page
├── components/       # React components
├── lib/              # Utility functions
├── prisma/           # Database schema and migrations
└── store/            # Zustand state management
```

## Features in Detail

### Customer Features
- Browse menu by category
- Add items to cart
- View cart and adjust quantities
- Enter delivery information
- Secure payment processing
- Order confirmation with details

### Admin Features
- View all orders
- See order details (customer info, items, address)
- Update order status (Confirmed, Preparing, Ready, Delivered)
- Real-time order updates
- Payment status tracking

## Future Enhancements

- Google Pay and Apple Pay integration
- Order tracking for customers
- Email notifications
- SMS notifications
- Customer accounts and order history
- Menu item images
- Reviews and ratings

## License

MIT

