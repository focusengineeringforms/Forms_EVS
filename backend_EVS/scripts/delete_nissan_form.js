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

    // 1. Find the Nissan India form
    const nissanForm = await forms.findOne({ title: 'Nissan India' });
    if (nissanForm) {
      console.log(`Found Nissan form (ID: ${nissanForm.id}). DELETING...`);
      await forms.deleteOne({ _id: nissanForm._id });
      await responses.deleteMany({ questionId: nissanForm.id }); // Use correct field linked to responses
      console.log('Nissan India form and related responses DELETED successfully.');
    } else {
      console.log('Nissan India form not found.');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
