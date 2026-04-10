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
    
    // 1. Check all collections to find where the data is stored
    const collections = await db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name));

    // 2. Identify the correct responses collection
    const possibleCollections = ['formresponses', 'responses', 'surveyresponses', 'answers'];
    for (const collName of possibleCollections) {
      const coll = db.collection(collName);
      const count = await coll.countDocuments({});
      console.log(`Collection: ${collName} - Total Documents: ${count}`);
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
