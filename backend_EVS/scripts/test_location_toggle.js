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

    // 1. Target the production NPS form
    const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
    
    const form = await forms.findOne({ id: formId });
    if (!form) {
      console.error('NPS Form not found!');
      process.exit(1);
    }

    console.log('Current locationEnabled:', form.locationEnabled);
    
    const newVal = !form.locationEnabled;
    console.log(`Attempting to set locationEnabled to ${newVal}...`);

    // We simulate the backend controller's logic
    const updateResult = await forms.updateOne(
      { _id: form._id },
      { $set: { locationEnabled: newVal, updatedAt: new Date() } }
    );

    if (updateResult.modifiedCount > 0) {
      console.log('SUCCESS! Location toggled via direct DB update.');
    } else {
      console.log('FAILED to toggle location via direct DB update.');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
