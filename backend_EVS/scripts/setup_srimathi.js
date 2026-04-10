import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const users = db.collection('users');
    const tenants = db.collection('tenants');
    const forms = db.collection('forms');

    // 1. Find the EVS NPS tenant
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant EVS NPS not found!');
      process.exit(1);
    }
    console.log('Found tenant:', tenant.name, tenant._id);

    // 2. Create or Update Srimathi user
    const email = 'srimathi@gmail.com';
    const password = 'srimathi123';
    const hashedPassword = await bcrypt.hash(password, 10);

    let srimathiUser = await users.findOne({ email });
    if (srimathiUser) {
      console.log('Updating existing Srimathi account...');
      await users.updateOne(
        { _id: srimathiUser._id },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            tenantId: tenant._id,
            isActive: true
          } 
        }
      );
    } else {
      console.log('Creating new Srimathi account...');
      const result = await users.insertOne({
        email,
        username: 'srimathi',
        password: hashedPassword,
        firstName: 'Srimathi',
        lastName: 'EVS',
        role: 'admin',
        tenantId: tenant._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      srimathiUser = { _id: result.insertedId };
    }

    // 3. Ensure Srimathi is in the tenant's admin list
    let adminIds = Array.isArray(tenant.adminId) ? tenant.adminId : (tenant.adminId ? [tenant.adminId] : []);
    const adminIdStrs = adminIds.map(id => id.toString());
    
    if (!adminIdStrs.includes(srimathiUser._id.toString())) {
      adminIds.push(srimathiUser._id);
      await tenants.updateOne(
        { _id: tenant._id },
        { $set: { adminId: adminIds } }
      );
      console.log('Srimathi added as admin to the tenant');
    }

    // 4. Link the form to this tenant
    const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
    await forms.updateOne(
      { id: formId },
      { $set: { tenantId: tenant._id } }
    );
    console.log('Form linked to EVS NPS tenant');

    console.log('-----------------------------------');
    console.log('SUCCESS! Credentials for Srimathi:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Business:', tenant.name);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
