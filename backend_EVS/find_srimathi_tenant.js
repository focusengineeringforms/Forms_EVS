import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function findSrimathiTenant() {
    await mongoose.connect(process.env.MONGODB_URI);
    const tenant = await mongoose.connection.db.collection('tenants').findOne({ _id: new mongoose.Types.ObjectId('694b7d1e207767f610d4374f') });
    console.log('Srimathi Tenant slug:', tenant.slug);
    process.exit(0);
}
findSrimathiTenant();
