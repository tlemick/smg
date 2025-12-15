// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding (Demo Mode)...');

  // Create initial admin user with plain text password
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smg.com' },
    update: {
      password: 'admin123' // Demo mode: plain text password
    },
    create: {
      email: 'admin@smg.com',
      name: 'System Administrator',
      password: 'admin123', // Demo mode: plain text password
      role: 'ADMIN',
      active: true,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);
  console.log(`📧 Admin login: admin@smg.com`);
  console.log(`🔑 Admin password: admin123`);
  console.log('');

  // Create a demo regular user with plain text password
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@smg.com' },
    update: {
      password: 'user123' // Demo mode: plain text password
    },
    create: {
      email: 'user@smg.com',
      name: 'Demo User',
      password: 'user123', // Demo mode: plain text password
      role: 'USER',
      active: true,
    },
  });

  console.log(`✅ Created demo user: ${regularUser.email}`);
  console.log(`📧 User login: user@smg.com`);
  console.log(`🔑 User password: user123`);
  console.log('');
  
  console.log('🎉 Database seeding completed! (Demo Mode - Plain Text Passwords)');
  console.log('⚠️  Note: This is for demonstration only. Never use plain text passwords in production!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 