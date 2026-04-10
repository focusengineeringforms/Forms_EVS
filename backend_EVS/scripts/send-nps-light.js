import dotenv from "dotenv";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const client = twilio(process.env.WA_TWILIO_ACCOUNT_SID, process.env.WA_TWILIO_AUTH_TOKEN);
const NUMBERS = ["+919894286683", "+916380456632"];
const FORM_LINK = "https://forms.focusengineeringapp.com/evs-nps/forms/38136dc5-1ac3-4724-b4df-e9d697d17071?theme=light";
const TEMPLATE_SID = process.env.WA_TWILIO_INVITE_TEMPLATE_SID;

async function sendNPSInvites() {
  for (const number of NUMBERS) {
    console.log(`🚀 Sending NPS Form (WHITE THEME) to ${number}...`);
    try {
      const message = await client.messages.create({
        from: `whatsapp:${process.env.WA_TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${number}`,
        contentSid: TEMPLATE_SID,
        contentVariables: JSON.stringify({
          "1": FORM_LINK
        })
      });
      console.log(`✅ Sent to ${number}! SID: ${message.sid}`);
    } catch (error) {
      console.error(`❌ FAILED ${number}:`, error.message);
      // Fallback
      const body = `📋 *NPS FEEDBACK FORM*\n\nHello! We value your feedback. Please fill out our survey in light mode:\n\nLink: ${FORM_LINK}\n\nThank you!`;
      try {
        const fbMessage = await client.messages.create({
            from: `whatsapp:${process.env.WA_TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${number}`,
            body: body
        });
        console.log(`✅ Fallback sent to ${number}! SID: ${fbMessage.sid}`);
      } catch (fbErr) {
        console.error(`❌ Fallback failed for ${number}:`, fbErr.message);
      }
    }
  }
}

sendNPSInvites();
