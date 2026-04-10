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

    const id1 = 'e8783fa3-2155-4d9b-ab76-544d0d68943d'; // Nissan India
    const id2 = '38136dc5-1ac3-4724-b4df-e9d697d17071'; // NPS

    const count1 = await responses.countDocuments({ questionId: id1 });
    const count2 = await responses.countDocuments({ questionId: id2 });

    console.log(`Summary Status:`);
    console.log(`- Nissan India (ID: ${id1}): ${count1} responses`);
    console.log(`- NPS (ID: ${id2}): ${count2} responses`);

    // We will keep ONLY the one with 24 responses.
    if (count1 === 24) {
      console.log('Nissan India is the PROD form. Keeping it.');
    } else if (count2 === 24) {
      console.log('NPS is the PROD form. Keeping it.');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
