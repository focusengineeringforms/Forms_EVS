import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

    // Read the LATEST logo from local path and convert to base64
    const logoLocalPath = 'C:\\Users\\Welcome\\.gemini\\antigravity\\brain\\ebef2388-89b8-461a-b19c-ac630866994b\\media__1775024133081.jpg';
    const logoData = fs.readFileSync(logoLocalPath);
    const base64Logo = `data:image/jpeg;base64,${logoData.toString('base64')}`;

    // Target the production NPS form
    const targetId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
    
    await forms.updateOne(
      { id: targetId },
      { 
        $set: { 
          logoUrl: base64Logo
        } 
      }
    );
    
    console.log(`SUCCESS! New Black Background Logo applied to NPS form (${targetId}).`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
