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

    // Delete Nissan form (old test data)
    const targetFormId = 'e8783fa3-2155-4d9b-ab76-544d0d68943d';
    
    console.log(`Deleting Nissan India form (ID: ${targetFormId}) and its old test responses...`);
    await forms.deleteOne({ id: targetFormId });
    await responses.deleteMany({ questionId: targetFormId });
    
    console.log('Nissan India deletion COMPLETE.');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
