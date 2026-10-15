import { db } from './index';
import { admins } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  await db.insert(admins).values({
    email: 'admin@techconference2025.com',
    name: 'Conference Admin',
    passwordHash,
    role: 'super_admin',
    isActive: true,
  });

  console.log('Seed completed!');
  console.log('Default admin credentials:');
  console.log('Email: admin@techconference2025.com');
  console.log('Password: admin123');
  console.log('Please change this password after first login!');
}

seed().catch(console.error);
