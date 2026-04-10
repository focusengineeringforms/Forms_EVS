import dotenv from "dotenv";
import twilio from "twilio";
import path from "path";
import { fileURLToPath } from "url";

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const targetClientSid = process.env.WA_CLIENT_ACCOUNT_SID || process.env.WA_TWILIO_ACCOUNT_SID;
const targetClientToken = process.env.WA_CLIENT_AUTH_TOKEN || process.env.WA_TWILIO_AUTH_TOKEN;
const targetClientFrom = process.env.WA_CLIENT_WHATSAPP_NUMBER || process.env.WA_TWILIO_WHATSAPP_NUMBER;
const targetClientTemplate = process.env.WA_CLIENT_INVITE_TEMPLATE_SID || process.env.WA_TWILIO_INVITE_TEMPLATE_SID;

const client = twilio(targetClientSid, targetClientToken);
const TARGET_NUMBER = "+971566017771";
const TEMPLATE_SID = targetClientTemplate;

async function sendTest() {
  console.log(`🚀 Attempting to send WhatsApp Test to ${TARGET_NUMBER}...`);
  try {
    const message = await client.messages.create({
      from: `whatsapp:${targetClientFrom}`,
      to: `whatsapp:${TARGET_NUMBER}`,
      contentSid: TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": "John Doe" // Using a dummy name for variable {{1}}
      })
    });
    console.log("✅ SUCCESS! Message sent.");
    console.log(`📲 SID: ${message.sid}`);
    console.log(`📊 Status: ${message.status}`);
  } catch (error) {
    console.error("❌ FAILED:", error.message);
  }
}

sendTest();
