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

    // 1. Correct Logo: High-res white background version
    const logoLocalPath = 'C:\\Users\\Welcome\\.gemini\\antigravity\\brain\\ebef2388-89b8-461a-b19c-ac630866994b\\media__1775024413661.png';
    const logoData = fs.readFileSync(logoLocalPath);
    const base64Logo = `data:image/png;base64,${logoData.toString('base64')}`;

    const targetId = '38136dc5-1ac3-4724-b4df-e9d697d17071';

    // 2. Correct NPS structure (Likelihood to recommend EVS)
    // 2nd question: Scale (1-5) instead of Rating (No stars)
    const correctSections = [
      {
        id: "section_1",
        title: "EVS NPS FEEDBACK",
        questions: [
          {
            id: "q_1",
            type: "scale",
            text: "OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?",
            required: true,
            min: 0,
            max: 10,
            options: ["NOT AT ALL LIKELY", "EXTREMELY LIKELY"]
          },
          {
            id: "q_2",
            type: "scale", // Scale (1-5) to avoid stars
            text: "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?",
            required: true,
            min: 1,
            max: 5,
            options: ["VERY UNSATISFIED", "VERY SATISFIED"]
          },
          {
            id: "q_3",
            type: "paragraph",
            text: "PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.",
            required: true
          }
        ]
      }
    ];

    // 3. Force update
    await forms.updateOne(
      { id: targetId },
      { 
        $set: { 
          title: 'NPS',
          logoUrl: base64Logo,
          sections: correctSections,
          isVisible: true,
          isActive: true
        } 
      }
    );

    console.log(`SUCCESS! NPS form (${targetId}) final layout applied. 2nd question as scale (no stars), white logo at correct size.`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
