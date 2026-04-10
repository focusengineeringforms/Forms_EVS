import dotenv from "dotenv";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const client = twilio(process.env.WA_TWILIO_ACCOUNT_SID, process.env.WA_TWILIO_AUTH_TOKEN);
const TARGET_NUMBERS = ["+918807823770", "+919894286683", "+919688356144"];
const FORM_LINK = "https://forms.focusengineeringapp.com/evs-nps/forms/38136dc5-1ac3-4724-b4df-e9d697d17071";
const TEMPLATE_SID = process.env.WA_TWILIO_INVITE_TEMPLATE_SID;

async function sendNPSInvites() {
  for (const number of TARGET_NUMBERS) {
    console.log(`🚀 Sending NPS Form Invite via WhatsApp to ${number}...`);
    try {
      const message = await client.messages.create({
        from: `whatsapp:${process.env.WA_TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${number}`,
        contentSid: TEMPLATE_SID,
        contentVariables: JSON.stringify({
          "1": FORM_LINK
        })
      });
      console.log(`✅ Success for ${number}! SID: ${message.sid}`);
    } catch (error) {
      console.error(`❌ FAILED for ${number}: ${error.message}`);
      if (error.code === 21608 || error.message.includes('permission')) {
          console.warn(`⚠️ Attempting plain text fallback for ${number}...`);
          try {
              const body = `📋 *NPS FEEDBACK FORM*\n\nHello! We value your feedback. Please take a moment to fill out our survey:\n\nLink: ${FORM_LINK}\n\nThank you!`;
              const fbMessage = await client.messages.create({
                  from: `whatsapp:${process.env.WA_TWILIO_WHATSAPP_NUMBER}`,
                  to: `whatsapp:${number}`,
                  body: body
              });
              console.log(`✅ Fallback SUCCESS for ${number}! SID: ${fbMessage.sid}`);
          } catch (fbErr) {
              console.error(`❌ Fallback also FAILED for ${number}: ${fbErr.message}`);
          }
      }
    }
  }
}

sendNPSInvites();
