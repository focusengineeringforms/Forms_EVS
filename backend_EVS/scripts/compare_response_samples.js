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
    const responses = db.collection('responses');

    const id1 = 'e8783fa3-2155-4d9b-ab76-544d0d68943d'; // Nissan India
    const id2 = '38136dc5-1ac3-4724-b4df-e9d697d17071'; // NPS

    const sample1 = await responses.findOne({ questionId: id1 });
    const sample2 = await responses.findOne({ questionId: id2 });

    console.log(`Sample 1 (Nissan):`, sample1 ? sample1.createdAt : 'NONE');
    console.log(`Sample 2 (NPS):`, sample2 ? sample2.createdAt : 'NONE');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
