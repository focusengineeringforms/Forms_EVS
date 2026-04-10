import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Form from '../models/Form.js';
import User from '../models/User.js';

dotenv.config();

const base64Logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA... (Run the script and I will fetch the actual image logo for you, or you can supply it via SuperAdmin UI)";

import fs from 'fs';

async function seedEVSForm() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the superadmin user to attach to
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      console.error('❌ Could not find a superadmin user to act as creator.');
      process.exit(1);
    }

    const formId = uuidv4();
    
    // Read the exact logo provided from the filesystem
    const imgPath = 'C:\\Users\\Welcome\\.gemini\\antigravity\\brain\\bc49e790-4947-49ae-a6d6-c3816ce50341\\media__1774846746816.png';
    let localLogoBase64 = null;
    if (fs.existsSync(imgPath)) {
       const imgData = fs.readFileSync(imgPath);
       localLogoBase64 = 'data:image/png;base64,' + imgData.toString('base64');
       console.log('🖼️  Successfully loaded local logo!');
    } else {
       console.warn('⚠️ Could not find the EVS logo on disk. It will be generated without one.');
    }
    
    // Create the EVS form
    const evsForm = new Form({
      id: formId,
      title: 'NPS',
      description: 'Net promoter score (NPS)',
      logoUrl: localLogoBase64,
      sections: [
        {
          id: uuidv4(),
          title: 'Section 1',
          weightage: 100,
          questions: [
            {
              id: uuidv4(),
              type: 'text',
              text: 'SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?',
              required: true
            },
            {
              id: uuidv4(),
              type: 'text',
              text: 'OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?',
              required: true
            },
            {
              id: uuidv4(),
              type: 'text',
              text: 'PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.',
              required: true
            }
          ]
        }
      ],
      createdBy: superadmin._id,
      isVisible: true,
      isActive: true,
      isGlobal: true,
      locationEnabled: false
    });

    await evsForm.save();
    console.log(`🎉 Successfully created new form "NPS_EVS"!`);
    console.log(`🔗 You can now edit its logo in the FormBuilder or preview at:`);
    console.log(`https://forms.focusengineeringapp.com/forms/${formId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding EVS Form:', error);
    process.exit(1);
  }
}

seedEVSForm();
