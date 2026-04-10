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

    // 1. Search for any form with NPS in the title
    const npsCandidates = await forms.find({ 
      title: { $regex: /NPS/i },
      sections: { $exists: true, $not: { $size: 0 } } 
    }).toArray();

    if (npsCandidates.length > 0) {
      console.log(`Found ${npsCandidates.length} NPS candidates.`);
      const template = npsCandidates[0]; // Use the first one
      console.log(`Using template: "${template.title}" (ID: ${template.id})`);
      
      const targetId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
      await forms.updateOne(
        { id: targetId },
        { 
          $set: { 
            title: template.title || 'NPS',
            sections: template.sections,
            followUpQuestions: template.followUpQuestions || []
          } 
        }
      );
      console.log(`SUCCESS! NPS form (${targetId}) restored from "${template.title}".`);
    } else {
      console.log('No form with "NPS" title and sections found in DB!');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
