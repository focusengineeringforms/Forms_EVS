import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function upgradeRole() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = mongoose.connection.db.collection('users');
    
    // Update both variations of the email to SuperAdmin
    const result = await User.updateMany(
        { email: { $in: ['smtsrimathii@gmail.com', 'srimathihai@gmail.com'] } },
        { $set: { role: 'superadmin' } }
    );
    
    console.log('Update result:', result.modifiedCount);
    
    // Also ensuring your current account ID is used as the creator for better visibility
    const srimathi = await User.findOne({ email: 'srimathihai@gmail.com' });
    if (srimathi) {
        const Form = mongoose.connection.db.collection('forms');
         await Form.updateOne(
            { id: '38136dc5-1ac3-4724-b4df-e9d697d17071' },
            { $set: { createdBy: srimathi._id } }
        );
        console.log('Form createdBy updated to your current ID.');
    }

    process.exit(0);
}
upgradeRole();
