import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected successfully to server');
    const db = client.db('focushub');
    
    // 1. Find all unique questionIds in responses
    const responses = db.collection('responses');
    const forms = db.collection('forms');
    const tenants = db.collection('tenants');

    const stats = await responses.aggregate([
      { $group: { _id: "$questionId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('--- RESPONSE STATS BY FORM ID ---');
    console.log(stats);
    console.log('---------------------------------');

    const topFormId = stats[0]?._id;
    if (!topFormId) {
      console.log('No responses found.');
      process.exit(0);
    }

    console.log(`Top form ID: ${topFormId} with ${stats[0].count} responses.`);

    // 2. Check if this form exists in 'forms' collection
    const existing = await forms.findOne({ id: topFormId });
    if (existing) {
      console.log('Form already exists in forms collection.');
    } else {
      console.log('Form is MISSING from forms collection. Restoring...');
      
      const evsNpsTenant = await tenants.findOne({ slug: 'evs-nps' });
      if (!evsNpsTenant) {
         console.error('Tenant evs-nps not found. Using first tenant as fallback.');
      }

      await forms.insertOne({
        id: topFormId,
        title: 'NPS',
        description: 'Net promoter score (NPS)',
        tenantId: evsNpsTenant?._id,
        status: 'published',
        isGlobal: true,
        isVisible: true,
        isActive: true, // IMPORTANT: Ensure it's active
        questions: [
            { id: "q1", type: "scale", title: "OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?", required: true, subParam1: "Not at all likely", subParam2: "Extremely likely" },
            { id: "q2", type: "scale", title: "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?", required: true, subParam1: "Very unsatisfied", subParam2: "Very satisfied" },
            { id: "q3", type: "paragraph", title: "PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.", required: true }
        ],
        sections: [
          {
            id: "section_1",
            title: "EVS NPS FEEDBACK",
            questions: [
              { id: "q1", type: "scale", text: "OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?", required: true, min: 0, max: 10, options: ["Not at all likely", "Extremely likely"] },
              { id: "q2", type: "scale", text: "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?", required: true, min: 1, max: 5, options: ["Very unsatisfied", "Very satisfied"] },
              { id: "q3", type: "paragraph", text: "PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.", required: true }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Restoration COMPLETE.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
