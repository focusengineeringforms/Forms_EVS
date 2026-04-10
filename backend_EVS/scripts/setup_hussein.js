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

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const users = db.collection('users');
    const tenants = db.collection('tenants');

    // 1. Find the EVS NPS tenant
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant EVS NPS not found!');
      process.exit(1);
    }
    console.log('Found tenant:', tenant.name, tenant._id);

    // 2. Create or Update Hussein user
    const email = 'hussein.eldomor@evsuae.com';
    const password = 'Hussein@EVS';
    const hashedPassword = await bcrypt.hash(password, 10);

    let husseinUser = await users.findOne({ email });
    if (husseinUser) {
      console.log('Updating existing Hussein account...');
      await users.updateOne(
        { _id: husseinUser._id },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            tenantId: tenant._id,
            isActive: true,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      console.log('Creating new Hussein account...');
      const result = await users.insertOne({
        email,
        username: 'hussein.eldomor',
        password: hashedPassword,
        firstName: 'Hussein',
        lastName: 'Eldomor',
        role: 'admin',
        tenantId: tenant._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      husseinUser = { _id: result.insertedId };
    }

    // 3. Ensure Hussein is in the tenant's admin list
    let adminIds = Array.isArray(tenant.adminId) ? tenant.adminId : (tenant.adminId ? [tenant.adminId] : []);
    const adminIdStrs = adminIds.map(id => id.toString());
    
    if (!adminIdStrs.includes(husseinUser._id.toString())) {
      adminIds.push(husseinUser._id);
      await tenants.updateOne(
        { _id: tenant._id },
        { $set: { adminId: adminIds } }
      );
      console.log('Hussein added as admin to the tenant');
    }

    console.log('-----------------------------------');
    console.log('SUCCESS! Profile Created for Hussein:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Business Assigned:', tenant.name);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (e) {
    console.error('ERROR OCCURRED:');
    console.error(e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

main();
