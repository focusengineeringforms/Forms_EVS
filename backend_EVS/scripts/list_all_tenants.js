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
    await mongoose.connect(uri);
    console.log('✅ Connected');

    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const tenants = await Tenant.find({});

    console.log('--- ALL TENANTS ---');
    tenants.forEach(t => {
      console.log(`Name: ${t.name}, Slug: ${t.slug}, ID: ${t._id}`);
    });
    console.log('-------------------');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
