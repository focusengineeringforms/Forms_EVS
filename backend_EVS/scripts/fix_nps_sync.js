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

    const targetId = '38136dc5-1ac3-4724-b4df-e9d697d17071';

    // 1. Identify all forms with this ID
    const matches = await forms.find({ id: targetId }).toArray();
    console.log(`Found ${matches.length} forms with ID: ${targetId}`);

    // LOGO: Read the correct high-res logo (media__1775018556610.png is the logo file from previous turns if available)
    const logoLocalPath = 'C:\\Users\\Welcome\\.gemini\\antigravity\\brain\\ebef2388-89b8-461a-b19c-ac630866994b\\media__1775018556610.png';
    const logoData = fs.readFileSync(logoLocalPath);
    const base64Logo = `data:image/png;base64,${logoData.toString('base64')}`;

    // 2. Define the CORRECT NPS structure (Likelihood to recommend EVS)
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
            type: "rating",
            text: "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?",
            required: true,
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

    // 3. Update ALL matches with the correct structure and logo
    await forms.updateMany(
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

    console.log(`SUCCESS! NPS form (${targetId}) synchronized for all views.`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
