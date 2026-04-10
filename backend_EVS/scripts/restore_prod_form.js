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
    const responses = db.collection('responses');
    const tenants = db.collection('tenants');

    // 1. Find the EVS NPS tenant
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant EVS NPS not found!');
      process.exit(1);
    }

    // 2. Find all unique formIds in responses
    const uniqueFormIds = await responses.distinct('formId');
    console.log('Unique Form IDs in responses:', uniqueFormIds);

    for (const formId of uniqueFormIds) {
      const count = await responses.countDocuments({ formId: formId });
      console.log(`Form ID: ${formId} - Responses: ${count}`);

      // 3. Restore ONLY the form with 24 responses
      if (count === 24) {
        console.log(`RESTORING Form: ${formId}...`);
        const existing = await forms.findOne({ id: formId });
        if (!existing) {
          await forms.insertOne({
            id: formId,
            title: 'NPS',
            description: 'Net promoter score (NPS)',
            tenantId: tenant._id,
            isPublic: true,
            questions: [
               { id: 'q1', type: 'scale', title: 'OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?', required: true },
               { id: 'q2', type: 'scale', title: 'SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?', required: true },
               { id: 'q3', type: 'paragraph', title: 'PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.', required: true }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('Production form RESTORED.');
        } else {
          console.log('Production form already exists.');
        }
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
