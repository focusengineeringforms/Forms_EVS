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
    const responses = db.collection('formresponses');
    const tenants = db.collection('tenants');

    // 1. Find the EVS NPS tenant
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant EVS NPS not found!');
      process.exit(1);
    }

    // 2. Find all NPS forms for this tenant
    const allForms = await forms.find({ tenantId: tenant._id }).toArray();
    console.log(`Found ${allForms.length} forms in this tenant.`);

    for (const form of allForms) {
      // Find response count for each form
      const responseCount = await responses.countDocuments({ formId: form.id });
      console.log(`Form: ${form.title} (ID: ${form.id}) - Responses: ${responseCount}`);

      // 3. Delete if it doesn't have 24 responses
      // (Using < 24 as a safety check so we keep the main one)
      if (responseCount < 24) {
        console.log(`DELETING Form: ${form.id} and its associated responses...`);
        await forms.deleteOne({ _id: form._id });
        await responses.deleteMany({ formId: form.id });
        console.log(`Deleted!`);
      } else {
        console.log(`KEEPING Form: ${form.id} - This is the production form.`);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
