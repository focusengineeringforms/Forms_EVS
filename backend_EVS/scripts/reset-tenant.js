import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error);
        process.exit(1);
    }
};

const findAndReset = async () => {
    await connectDB();

    try {
        // Use dynamic import for models to ensure connection is ready
        const { default: User } = await import('../models/User.js');
        const { default: Tenant } = await import('../models/Tenant.js');

        // Find the "Default Business" Tenant
        const tenant = await Tenant.findOne({ slug: 'default' });

        if (!tenant) {
            console.log('❌ Tenant "default" not found.');
            console.log('Listing all tenants:');
            const allTenants = await Tenant.find({}, 'name slug');
            console.table(allTenants.map(t => ({ name: t.name, slug: t.slug })));
            process.exit(1);
        }

        console.log(`\n🏢 Found Tenant: ${tenant.name} (${tenant.slug})`);

        // Find the Admin User for this Tenant
        const user = await User.findOne({ tenantId: tenant._id, role: 'admin' });

        if (!user) {
            console.log('❌ No admin user found for this tenant.');
            process.exit(1);
        }

        console.log(`👤 Found Admin User: ${user.email} (Username: ${user.username})`);

        // Reset Password
        user.password = 'school123'; // Logic in User model should hash this
        await user.save();

        console.log('\n✅ Password reset successfully!');
        console.log('------------------------------------------------');
        console.log('🔑 CREDENTIALS FOR TESTING:');
        console.log(`   Email:    ${user.email}`);
        console.log(`   Password: school123`);
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

findAndReset();
