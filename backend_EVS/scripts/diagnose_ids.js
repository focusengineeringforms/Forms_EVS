import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const forms = db.collection('forms');
  const tenants = db.collection('tenants');

  const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
  const form = await forms.findOne({ id: formId });
  console.log('FORM:', JSON.stringify(form, null, 2));

  if (form && form.tenantId) {
    const tenant = await tenants.findOne({ _id: form.tenantId });
    console.log('TENANT:', JSON.stringify(tenant, null, 2));
  }
  
  const allTenants = await tenants.find({}).toArray();
  console.log('ALL TENANTS SLUGS:', allTenants.map(t => t.slug));

  process.exit(0);
}

test();
