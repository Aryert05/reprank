import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import User from '../models/User.js';
import { DEMO_ACCOUNTS } from '../config/demoAccounts.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed fixed demo accounts in production.');
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
    console.log('MongoDB connected for demo-user seeding.');

    for (const account of DEMO_ACCOUNTS) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      const result = await User.findOneAndUpdate(
        { email: account.email },
        {
          $set: {
            name: account.name,
            email: account.email,
            password: hashedPassword,
            role: account.role,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      console.log(`Local demo account ready: ${account.label} (role: ${result.role}).`);
    }

    console.log('Demo-user seeding completed. No duplicate accounts were created.');
  } catch (error) {
    console.error(
      `Demo-user seeding failed (${error?.name || 'Error'}${error?.code ? ` / ${error.code}` : ''}).`,
    );
    console.error('Check MongoDB connectivity and Atlas network access before retrying.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

seedDemoUsers();
