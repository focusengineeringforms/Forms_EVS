import mongoose from 'mongoose';
import dotenv from 'dotenv';
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
    console.log('Connected to Production DB');

    const db = mongoose.connection.db;
    const forms = db.collection('forms');
    const tenants = db.collection('tenants');

    // 1. Find EVS Tenant
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant "evs-nps" not found!');
      process.exit(1);
    }

    const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';

    // 2. Direct database update to bypass UI validation
    console.log(`Manually assigning NPS form (${formId}) to Tenant ${tenant.name}...`);
    
    // Update the form to have the tenantId AND be global
    await forms.updateOne(
      { id: formId },
      { 
        $set: { 
          tenantId: tenant._id,
          isGlobal: true,
          status: 'published',
          isVisible: true,
          isActive: true,
          updatedAt: new Date()
        } 
      }
    );

    // Also update the tenant to reference the form if needed (optional but good for consistency)
    await tenants.updateOne(
      { _id: tenant._id },
      { $addToSet: { forms: formId } }
    );

    console.log('-----------------------------------');
    console.log('SUCCESS! NPS Form linked to Tenant.');
    console.log('Form is now LIVE.');
    console.log('-----------------------------------');

    process.exit(0);
  } catch (e) {
    console.error('ERROR OCCURRED:');
    console.error(e.message);
    process.exit(1);
  }
}

main();
