import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function findSuperAdmins() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({ role: 'superadmin' }).toArray();
    console.log('SuperAdmins:', users.map(u => ({ id: u._id, email: u.email })));
    process.exit(0);
}
findSuperAdmins();
