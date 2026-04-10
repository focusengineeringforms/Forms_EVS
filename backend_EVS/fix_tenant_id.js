import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findTenant() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // We don't know the exact model name, so we'll check the connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Most likely 'tenants' or 'merchants'
    const tenantCollection = mongoose.connection.db.collection('tenants');
    const tenant = await tenantCollection.findOne({ slug: 'evs-nps' });
    
    if (tenant) {
      console.log('Found tenant:', tenant._id, tenant.name);
      
      // Now update the form to use this REAL ObjectId for tenantId
      const formCollection = mongoose.connection.db.collection('forms');
      const result = await formCollection.updateOne(
        { id: '38136dc5-1ac3-4724-b4df-e9d697d17071' },
        { $set: { tenantId: tenant._id } }
      );
      console.log('Updated form with real tenant ObjectId. Match:', result.matchedCount, 'Mod:', result.modifiedCount);
    } else {
      console.log('Tenant evs-nps not found by slug!');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

findTenant();
