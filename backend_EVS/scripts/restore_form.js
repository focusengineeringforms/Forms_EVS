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

    // 2. Find a response to identify the correct formId
    const sampleResponse = await responses.findOne({}); // Find any response
    if (!sampleResponse) {
      console.error('No responses found in database!');
      process.exit(1);
    }
    console.log('Found sample response. Form ID identified:', sampleResponse.formId);

    // 3. Restore the form
    // I am re-creating the production form based on the sample response's formId
    const productionFormId = sampleResponse.formId;
    
    const existing = await forms.findOne({ id: productionFormId });
    if (!existing) {
      console.log('Re-creating production form...');
      await forms.insertOne({
        id: productionFormId,
        title: 'NPS',
        description: 'Net promoter score (NPS)',
        tenantId: tenant._id,
        isPublic: true,
        questions: [], // We might need to fill this or Hussein can edit it
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Production form RESTORED.');
    } else {
      console.log('Production form already exists.');
    }

    // Double check the count
    const count = await responses.countDocuments({ formId: productionFormId });
    console.log(`The form now has ${count} responses.`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
