import { MongoClient } from 'mongodb';

const uris = [
  'mongodb+srv://focushub360db:Priya%4040123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority',
  'mongodb+srv://focushub360db:Priya@40123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority',
  'mongodb+srv://focushub360db:Priya123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority',
  'mongodb+srv://focushub360db:Priya@123@focusforms.8im0otd.mongodb.net/focushub?retryWrites=true&w=majority'
];

async function test() {
  for (const uri of uris) {
    console.log(`Testing: ${uri.replace(/:.*@/, ':****@')}`);
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
      await client.connect();
      console.log('✅ SUCCESS!');
      process.exit(0);
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    } finally {
      await client.close();
    }
  }
}

test();
