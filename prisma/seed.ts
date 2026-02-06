import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.user.deleteMany()

  // Create test users
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const customerPassword = await bcrypt.hash('customer123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@meatbirdz.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+1 (555) 000-0001',
    },
  })

  const customer = await prisma.user.create({
    data: {
      name: 'Test Customer',
      email: 'customer@meatbirdz.com',
      password: customerPassword,
      role: 'CUSTOMER',
      phone: '+1 (555) 000-0002',
    },
  })

  console.log('Test users created:')
  console.log('Admin: admin@meatbirdz.com / admin123')
  console.log('Customer: customer@meatbirdz.com / customer123')

  // Create menu items
  const menuItems = [
    // Burgers
    {
      name: 'Classic Burger',
      description: 'Juicy beef patty with lettuce, tomato, onion, and special sauce',
      price: 8.99,
      category: 'burger',
      available: true,
    },
    {
      name: 'Cheeseburger',
      description: 'Classic burger with melted cheese',
      price: 9.99,
      category: 'burger',
      available: true,
    },
    {
      name: 'Bacon Burger',
      description: 'Beef patty with crispy bacon, cheese, and BBQ sauce',
      price: 11.99,
      category: 'burger',
      available: true,
    },
    {
      name: 'Chicken Burger',
      description: 'Grilled chicken breast with mayo and fresh veggies',
      price: 9.99,
      category: 'burger',
      available: true,
    },
    // Wraps
    {
      name: 'Chicken Wrap',
      description: 'Grilled chicken with lettuce, tomato, and ranch dressing',
      price: 7.99,
      category: 'wrap',
      available: true,
    },
    {
      name: 'Beef Wrap',
      description: 'Seasoned beef with vegetables and chipotle sauce',
      price: 8.99,
      category: 'wrap',
      available: true,
    },
    {
      name: 'Veggie Wrap',
      description: 'Fresh vegetables with hummus and tahini',
      price: 6.99,
      category: 'wrap',
      available: true,
    },
    // Fries
    {
      name: 'Regular Fries',
      description: 'Crispy golden fries',
      price: 3.99,
      category: 'fries',
      available: true,
    },
    {
      name: 'Loaded Fries',
      description: 'Fries topped with cheese, bacon, and jalapeños',
      price: 6.99,
      category: 'fries',
      available: true,
    },
    {
      name: 'Sweet Potato Fries',
      description: 'Crispy sweet potato fries',
      price: 4.99,
      category: 'fries',
      available: true,
    },
    // Drinks
    {
      name: 'Coca Cola',
      description: 'Refreshing cola drink',
      price: 2.49,
      category: 'drink',
      available: true,
    },
    {
      name: 'Sprite',
      description: 'Lemon-lime soda',
      price: 2.49,
      category: 'drink',
      available: true,
    },
    {
      name: 'Orange Juice',
      description: 'Fresh squeezed orange juice',
      price: 3.49,
      category: 'drink',
      available: true,
    },
    {
      name: 'Water',
      description: 'Bottled water',
      price: 1.99,
      category: 'drink',
      available: true,
    },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: item,
    })
  }

  console.log('Menu items seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

