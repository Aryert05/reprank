import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import User from '../models/User.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const ADMIN_ACCOUNT = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'AdminPassword123',
  role: 'admin',
};

const seedAdmin = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed a fixed admin account in production.');
    process.exitCode = 1;
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing in backend/.env');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected for admin seeding.');

    const existingAdmin = await User.findOne({ email: ADMIN_ACCOUNT.email });
    if (existingAdmin) {
      console.log('Local admin demo account already exists; no changes made.');
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);
    await User.create({
      name: ADMIN_ACCOUNT.name,
      email: ADMIN_ACCOUNT.email,
      password: hashedPassword,
      role: ADMIN_ACCOUNT.role,
    });

    console.log('Local admin demo account created.');
  } catch (error) {
    console.error(
      `Admin seeding failed (${error?.name || 'Error'}${error?.code ? ` / ${error.code}` : ''}).`,
    );
    console.error('Check MongoDB connectivity and Atlas network access before retrying.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

seedAdmin();
