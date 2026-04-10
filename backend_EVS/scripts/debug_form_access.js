import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri.replace(/:([^@]+)@/, ':****@'));
    await mongoose.connect(uri);
    console.log('✅ Connected');

    const Form = mongoose.model('Form', new mongoose.Schema({}, { strict: false }));
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));

    const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';
    const tenantSlug = 'evs';

    const form = await Form.findOne({ id: formId });
    const tenant = await Tenant.findOne({ slug: tenantSlug });

    console.log('\n--- Form Details ---');
    if (form) {
      console.log('ID:', form.id);
      console.log('Title:', form.title);
      console.log('Tenant ID:', form.tenantId);
      console.log('Is Global:', form.isGlobal);
      console.log('Is Visible:', form.isVisible);
      console.log('Is Active:', form.isActive);
      console.log('Shared With Tenants:', form.sharedWithTenants);
    } else {
      console.log('❌ Form not found');
    }

    console.log('\n--- Tenant Details ---');
    if (tenant) {
      console.log('ID:', tenant._id);
      console.log('Name:', tenant.name);
      console.log('Slug:', tenant.slug);
      console.log('Is Active:', tenant.isActive);
    } else {
      console.log('❌ Tenant not found');
    }

    if (form && tenant) {
      const isOwned = form.tenantId && form.tenantId.toString() === tenant._id.toString();
      const isShared = form.sharedWithTenants && form.sharedWithTenants.some(id => id.toString() === tenant._id.toString());
      console.log('\n--- Relationship ---');
      console.log('Is Owned by Tenant:', isOwned);
      console.log('Is Shared with Tenant:', isShared);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
