import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Form from './models/Form.js';

dotenv.config();

async function setLogo() {
  try {
    const dir = 'C:\\Users\\Welcome\\.gemini\\antigravity\\brain\\bc49e790-4947-49ae-a6d6-c3816ce50341';
    
    // Find latest file starting with media__ and ending with .png
    const files = fs.readdirSync(dir);
    const mediaFiles = files.filter(f => f.startsWith('media__') && f.endsWith('.png'));
    
    if (mediaFiles.length === 0) {
      console.log('No media files found!');
      process.exit(1);
    }
    
    // Sort by modified time descending to get the latest one
    mediaFiles.sort((a, b) => {
      return fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs;
    });
    
    const latestImage = mediaFiles[0];
    console.log('Found latest image:', latestImage);
    
    const imgData = fs.readFileSync(path.join(dir, latestImage));
    const base64 = 'data:image/png;base64,' + imgData.toString('base64');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const result = await Form.updateOne(
      { id: '38136dc5-1ac3-4724-b4df-e9d697d17071' },
      { $set: { logoUrl: base64 } }
    );
    
    console.log('Update result:', result.modifiedCount);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

setLogo();
