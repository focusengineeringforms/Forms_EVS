import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://focushub360db:Priya%40123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority';

async function test() {
  console.log(`Testing: ${uri.replace(/:.*@/, ':****@')}`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('✅ SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    process.exit(1);
  } finally {
    await client.close();
  }
}

test();
