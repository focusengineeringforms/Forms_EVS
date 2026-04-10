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

    const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
    const slug = 'evs-nps';

    // 1. Ensure the tenant with specific slug exists and is active
    console.log(`Setting up tenant with slug: ${slug}...`);
    
    await tenants.updateOne(
      { slug: slug },
      { 
        $set: { 
          name: 'EVS NPS',
          isActive: true,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    const tenant = await tenants.findOne({ slug: slug });
    console.log('Tenant ready:', tenant._id);

    // 2. Link the form to this SPECIFIC tenant and slug
    console.log(`Linking form ${formId} to tenant ${tenant._id}...`);
    
    await forms.updateOne(
      { id: formId },
      { 
        $set: { 
          tenantId: tenant._id,
          status: 'published',
          isVisible: true,
          isActive: true,
          isGlobal: true,
          updatedAt: new Date()
        } 
      }
    );

    console.log('-----------------------------------');
    console.log('SUCCESS! NPS Tenant and Form Unified.');
    console.log('Link will now work for slug: evs-nps');
    console.log('-----------------------------------');

    process.exit(0);
  } catch (e) {
    console.error('ERROR OCCURRED:');
    process.exit(1);
  }
}

main();
