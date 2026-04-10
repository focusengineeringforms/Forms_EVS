import { MongoClient } from 'mongodb';

async function main() {
  // HARDCODED URI for verification
  const uri = 'mongodb+srv://focushub360db:Priya%4040123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority';
  console.log('Connecting to Atlas with hardcoded URI...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    const db = client.db('focushub');
    
    const responses = db.collection('responses');
    const forms = db.collection('forms');
    const tenants = db.collection('tenants');

    const stats = await responses.aggregate([
      { $group: { _id: "$questionId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('--- RESPONSE STATS ---');
    console.log(stats);
    
    if (stats.length > 0) {
      const topFormId = stats[0]._id;
      const count = stats[0].count;
      console.log(`Top form ID: ${topFormId} (${count} responses)`);
      
      const existing = await forms.findOne({ id: topFormId });
      if (existing) {
        console.log(`Form ${topFormId} still exists with title: ${existing.title}`);
      } else {
        console.log(`Form ${topFormId} is MISSING. Restoring...`);
        const evsNpsTenant = await tenants.findOne({ slug: 'evs-nps' });
        
        await forms.insertOne({
          id: topFormId,
          title: 'NPS',
          description: 'Net promoter score (NPS)',
          tenantId: evsNpsTenant?._id,
          status: 'published',
          isGlobal: true,
          isVisible: true,
          isActive: true,
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
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

main();
