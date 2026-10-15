import { db } from './index';
import { admins } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const name = process.env.ADMIN_SEED_NAME;
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !name || !password || password.length < 12) {
    throw new Error('Set ADMIN_SEED_EMAIL, ADMIN_SEED_NAME, and ADMIN_SEED_PASSWORD (at least 12 characters) before seeding.');
  }

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(admins).values({
    email,
    name,
    passwordHash,
    role: 'super_admin',
    isActive: true,
  }).onConflictDoNothing({ target: admins.email });

  console.log('Seed completed. Existing admin emails were left unchanged.');
}

seed().catch(console.error);
