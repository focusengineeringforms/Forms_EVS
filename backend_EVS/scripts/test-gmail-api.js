import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

async function testGmail() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI
  );
  
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  
  try {
    const res = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Google API Authenticated! Email address:', res.data.emailAddress);
  } catch (error) {
    console.error('❌ Google API Error:', error.message);
  }
}

testGmail();
