import { MongoClient } from 'mongodb';

async function main() {
  const uri = 'mongodb+srv://focushub360db:Priya%4040123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('focushub');
    
    const users = await db.collection('users').find({}).toArray();
    console.log('--- USERS ---');
    users.forEach(u => console.log(`ID: ${u._id} | User: ${u.username} | Role: ${u.role}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
