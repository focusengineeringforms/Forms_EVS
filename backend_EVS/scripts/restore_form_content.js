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

    // 1. Find a form that HAS sections
    const completeForm = await forms.findOne({ 
      sections: { $exists: true, $not: { $size: 0 } } 
    });

    if (completeForm) {
      console.log(`Found a template form: "${completeForm.title}" (ID: ${completeForm.id})`);
      console.log(`Sections count: ${completeForm.sections.length}`);
      
      // 2. Restore this structure to our production NPS form
      const targetId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
      await forms.updateOne(
        { id: targetId },
        { 
          $set: { 
            sections: completeForm.sections,
            followUpQuestions: completeForm.followUpQuestions || []
          } 
        }
      );
      console.log(`SUCCESS! NPS form (${targetId}) structure restored.`);
    } else {
      console.log('No form with sections found in DB!');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
