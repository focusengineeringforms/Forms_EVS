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

    // 2. NPS form content (matching your high-standard design)
    const npsForm = {
      id: formId,
      title: 'NPS',
      description: 'Net promoter score (NPS)',
      tenantId: tenant._id,
      status: 'published',
      isGlobal: true,
      isVisible: true,
      isActive: true,
      settings: {
        requireAuth: false,
        allowMultipleSubmissions: true,
        showProgressBar: false
      },
      sections: [
        {
          id: "section_1",
          title: "EVS NPS FEEDBACK",
          questions: [
            {
              id: "q_1",
              type: "scale",
              text: "OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?",
              required: true,
              min: 0,
              max: 10,
              options: ["NOT AT ALL LIKELY", "EXTREMELY LIKELY"]
            },
            {
              id: "q_2",
              type: "scale",
              text: "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?",
              required: true,
              min: 1,
              max: 5,
              options: ["VERY UNSATISFIED", "VERY SATISFIED"]
            },
            {
              id: "q_3",
              type: "paragraph",
              text: "PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.",
              required: true
            }
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 3. Upsert the form
    console.log(`Restoring NPS form (${formId})...`);
    await forms.updateOne(
      { id: formId },
      { $set: npsForm },
      { upsert: true }
    );

    console.log('-----------------------------------');
    console.log('SUCCESS! NPS Form Restored to Production.');
    console.log('Form ID:', formId);
    console.log('Assigned to Tenant:', tenant.name);
    console.log('-----------------------------------');

    process.exit(0);
  } catch (e) {
    console.error('ERROR OCCURRED:');
    console.error(e.message);
    process.exit(1);
  }
}

main();
