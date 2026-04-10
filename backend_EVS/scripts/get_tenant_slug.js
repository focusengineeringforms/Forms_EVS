import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Usage: node backend/scripts/get_tenant_slug.js <tenantId>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const t = await Tenant.findById(tenantId);
    
    console.log('--- RESULT ---');
    console.log('The correct slug is:', t ? t.slug : 'NOT FOUND');
    console.log('--------------');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
