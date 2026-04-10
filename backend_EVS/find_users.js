import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function findUsers() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({ lastName: /Hari/ }).toArray();
    console.log('Users found:', users.map(u => ({ id: u._id, email: u.email, role: u.role, tenantId: u.tenantId })));
    
    // Also check our form's creator
    const form = await mongoose.connection.db.collection('forms').findOne({ id: '38136dc5-1ac3-4724-b4df-e9d697d17071' });
    console.log('Form createdBy:', form.createdBy);
    
    process.exit(0);
}
findUsers();
