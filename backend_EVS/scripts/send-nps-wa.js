import dotenv from "dotenv";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const client = twilio(process.env.WA_TWILIO_ACCOUNT_SID, process.env.WA_TWILIO_AUTH_TOKEN);
const TARGET_NUMBER = "+919894286683";
const FORM_LINK = "https://forms.focusengineeringapp.com/evs-nps/forms/38136dc5-1ac3-4724-b4df-e9d697d17071";
const TEMPLATE_SID = process.env.WA_TWILIO_INVITE_TEMPLATE_SID;

async function sendNPSInvite() {
  console.log(`🚀 Sending NPS Form Invite via WhatsApp to ${TARGET_NUMBER}...`);
  try {
    const message = await client.messages.create({
      from: `whatsapp:${process.env.WA_TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${TARGET_NUMBER}`,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": FORM_LINK
      })
    });
    console.log("✅ NPS Form successfully sent via WhatsApp!");
    console.log(`📲 SID: ${message.sid}`);
    console.log(`📊 Status: ${message.status}`);
  } catch (error) {
    console.error("❌ FAILED to send WhatsApp:", error.message);
    if (error.code === 21608) {
        console.warn("⚠️ Number not in sandbox? Trying plain text fallback...");
        // Fallback to plain text
        const body = `📋 *NPS FEEDBACK FORM*\n\nHello! We value your feedback. Please take a moment to fill out our survey:\n\nLink: ${FORM_LINK}\n\nThank you!`;
        const fbMessage = await client.messages.create({
            from: `whatsapp:${process.env.WA_TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${TARGET_NUMBER}`,
            body: body
        });
        console.log("✅ Fallback plain text sent! SID:", fbMessage.sid);
    }
  }
}

sendNPSInvite();
