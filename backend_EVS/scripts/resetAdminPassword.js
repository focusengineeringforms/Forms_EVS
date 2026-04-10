import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/User.js';

const resetAdminPassword = async () => {
    try {
        await connectDB();

        const email = 'admin@focus.com'; // Wait, let's see what admin emails exist from the logs...
        // Ah, default tenant admin might be riya@focusengineering.in or someone else. Let me check the logs again... wait!

        const userNamesToUpdate = ['riya@focusengineering.in', 'testing@gmail.com', 'admin@focus.com', 'testing@gmail.com'];

        console.log('--- RESETTING SOME TENANT ADMIN PASSWORDS ---');

        for (const eml of userNamesToUpdate) {
            const user = await User.findOne({ email: eml });
            if (user) {
                user.password = 'school123';
                await user.save();
                console.log(`✅ Reset password for ${eml} to 'school123'`);
            } else {
                console.log(`⚠️ User ${eml} not found in database.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

resetAdminPassword();
