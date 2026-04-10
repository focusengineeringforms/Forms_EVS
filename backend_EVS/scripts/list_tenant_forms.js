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
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const forms = db.collection('forms');
    const tenants = db.collection('tenants');

    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant evs-nps not found!');
      process.exit(1);
    }

    const tenantForms = await forms.find({ tenantId: tenant._id }).toArray();
    console.log(`List of Forms for ${tenant.name}:`);
    tenantForms.forEach(f => {
      console.log(`- Title: "${f.title}" (ID: ${f.id})`);
    });

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
