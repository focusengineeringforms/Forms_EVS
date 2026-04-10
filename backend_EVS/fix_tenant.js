import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Form from './models/Form.js';

dotenv.config();

async function updateQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const form = await Form.findOne({ id: '38136dc5-1ac3-4724-b4df-e9d697d17071' });
    if (!form) {
      console.error('Form not found!');
      process.exit(1);
    }
    
    // Rebuild the questions array directly to perfectly match the mockup's order and types
    form.sections[0].questions = [
      {
         id: form.sections[0].questions[1].id, // Keep existing ID
         text: 'OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?',
         type: 'scale',
         min: 0,
         max: 10,
         subParam1: 'Not at all likely',
         subParam2: 'Extremely likely',
         required: true
      },
      {
         id: form.sections[0].questions[0].id,
         text: 'SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?',
         type: 'scale',
         min: 1,
         max: 5,
         subParam1: 'Very unsatisfied',
         subParam2: 'Very satisfied',
         required: true
      },
      {
         id: form.sections[0].questions[2].id,
         text: 'PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.',
         type: 'paragraph',
         required: true
      }
    ];
    
    form.markModified('sections');
    await form.save();
    
    console.log('Successfully updated questions to scale type!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
updateQuestions();
