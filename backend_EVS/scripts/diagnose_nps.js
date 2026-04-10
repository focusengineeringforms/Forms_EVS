import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Production DB');

    const db = mongoose.connection.db;
    const forms = db.collection('forms');
    const tenants = db.collection('tenants');

    const formId = '38136dc5-1ac3-4724-b4df-e9d697d17071';

    // 1. Check form state
    const form = await forms.findOne({ id: formId });
    console.log('\n=== FORM STATE ===');
    console.log('Form found:', !!form);
    if (form) {
      console.log('isVisible:', form.isVisible);
      console.log('isActive:', form.isActive);
      console.log('status:', form.status);
      console.log('tenantId:', form.tenantId);
      console.log('sharedWithTenants:', form.sharedWithTenants);
      console.log('sections:', form.sections?.length || 0);
    }

    // 2. Check tenant with slug evs-nps
    const tenant = await tenants.findOne({ slug: 'evs-nps' });
    console.log('\n=== TENANT STATE ===');
    console.log('Tenant found:', !!tenant);
    if (tenant) {
      console.log('Tenant ID:', tenant._id);
      console.log('Tenant name:', tenant.name);
      console.log('isActive:', tenant.isActive);
    }

    // 3. Check if they match
    if (form && tenant) {
      console.log('\n=== OWNERSHIP CHECK ===');
      const isOwned = form.tenantId && form.tenantId.toString() === tenant._id.toString();
      console.log('Form tenantId:', form.tenantId?.toString());
      console.log('Tenant _id:', tenant._id.toString());
      console.log('isOwnedByTenant:', isOwned);
      
      if (!isOwned) {
        console.log('\n⚠️  FIXING: Setting form tenantId to match tenant...');
        await forms.updateOne(
          { id: formId },
          { $set: { tenantId: tenant._id, isVisible: true, isActive: true, status: 'published' } }
        );
        console.log('✅ Fixed! Form now linked to correct tenant.');
      } else {
        console.log('✅ Form is correctly linked to tenant!');
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

main();
