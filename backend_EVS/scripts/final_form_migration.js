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

    // 1. Find the target tenant
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    if (!tenant) {
      console.error('Tenant EVS NPS not found!');
      process.exit(1);
    }

    // 2. Identify the form with 24 responses
    const targetFormId = 'e8783fa3-2155-4d9b-ab76-544d0d68943d';
    
    // 3. Update the form's tenantId to the target tenant
    // Also ensuring it is visible
    const updateResult = await forms.updateOne(
      { id: targetFormId },
      { $set: { 
          tenantId: tenant._id,
          isVisible: true,
          isPublic: true,
          updatedAt: new Date()
        } 
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(`SUCCESS! Form ${targetFormId} moved to EVS NPS tenant.`);
    } else {
      console.log('Form already assigned to the correct tenant or not found.');
      // Re-create just in case? Or search for it first.
      const found = await forms.findOne({ id: targetFormId });
      if (!found) {
        console.log('Re-creating form in case it was missing...');
        await forms.insertOne({
            id: targetFormId,
            title: 'NPS',
            description: 'Net promoter score (NPS)',
            tenantId: tenant._id,
            isPublic: true,
            isVisible: true,
            questions: [
               { id: 'q1', type: 'scale', title: 'OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?', required: true },
               { id: 'q2', type: 'scale', title: 'SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?', required: true },
               { id: 'q3', type: 'paragraph', title: 'PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.', required: true }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('Production form RE-CREATED under EVS NPS.');
      }
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
