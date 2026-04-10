import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }
    
    console.log('Connecting to Production DB via .env...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const users = db.collection('users');
    const tenants = db.collection('tenants');

    // 1. Find the EVS NPS tenant
    let tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.log('Tenant "evs-nps" not found, creating it...');
      const tenantResult = await tenants.insertOne({
        name: 'EVS NPS',
        slug: 'evs-nps',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      tenant = { _id: tenantResult.insertedId, name: 'EVS NPS' };
    }
    
    console.log('Using tenant:', tenant.name, tenant._id);

    // 2. Create Hussein user with requested credentials
    const email = 'hussein@evsuae.com';
    const password = 'hussein@EVS';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Setting up account for ${email}...`);
    
    await users.updateOne(
      { email },
      { 
        $set: { 
          username: 'hussein',
          password: hashedPassword,
          firstName: 'Hussein',
          lastName: 'Eldomor',
          role: 'admin',
          tenantId: tenant._id,
          isActive: true,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    const updatedUser = await users.findOne({ email });
    
    // 3. Ensure Hussein is in the tenant's admin list
    await tenants.updateOne(
      { _id: tenant._id },
      { $addToSet: { adminId: updatedUser._id } }
    );

    console.log('-----------------------------------');
    console.log('SUCCESS! Profile Created/Updated for Hussein:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Business Assigned:', tenant.name);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (e) {
    console.error('ERROR OCCURRED:');
    console.error(e.message);
    process.exit(1);
  }
}

main();
