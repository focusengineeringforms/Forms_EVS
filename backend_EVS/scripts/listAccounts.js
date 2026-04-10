import '../config/env.js';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

const listUsersAndTenants = async () => {
    try {
        await connectDB();

        console.log('\n--- SYSTEM USERS & ACCOUNTS ---\n');

        // Get Super Admins
        const superAdmins = await User.find({ role: 'superadmin' }).select('firstName lastName email username');
        console.log('👑 SUPER ADMINS:');
        superAdmins.forEach(admin => {
            console.log(`- Name: ${admin.firstName} ${admin.lastName}, Email: ${admin.email}, Username: ${admin.username} (Password: srimathi123)`);
        });

        // Get Tenants Information
        const tenants = await Tenant.find();
        console.log('\n🏢 TENANTS IN SYSTEM:');
        if (tenants.length === 0) {
            console.log('No tenants found in the database.');
        } else {
            tenants.forEach(tenant => {
                console.log(`- ${tenant.name} (Slug: ${tenant.slug}) | ID: ${tenant._id}`);
            });
        }

        // Get all tenant admins
        const admins = await User.find({ role: 'admin' }).populate('tenantId', 'name slug');
        console.log('\n🧑‍💼 TENANT ADMINS:');
        if (admins.length === 0) {
            console.log('No admins found.');
        } else {
            admins.forEach(user => {
                const tenantName = user.tenantId ? user.tenantId.name : 'No Tenant Assigned';
                console.log(`- Name: ${user.firstName} ${user.lastName} | Username: ${user.username} | Email: ${user.email} | Tenant: ${tenantName}`);
            });
        }

        // Get other users
        const regularUsers = await User.find({ role: { $nin: ['superadmin', 'admin'] } }).populate('tenantId', 'name slug');
        console.log('\n👥 OTHER USERS (Subadmins, etc):');
        if (regularUsers.length === 0) {
            console.log('No other users found.');
        } else {
            regularUsers.forEach(user => {
                const tenantName = user.tenantId ? user.tenantId.name : 'No Tenant Assigned';
                console.log(`- Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'} | Username: ${user.username} | Email: ${user.email} | Role: ${user.role} | Tenant: ${tenantName}`);
            });
        }

        console.log('\n--- END OF LIST ---\n');

    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

listUsersAndTenants();
