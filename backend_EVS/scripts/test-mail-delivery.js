import "../config/env.js";
import mailService from "../services/mailService.js";

async function testMail() {
    console.log("🚀 STARTING: Vertical Mail Delivery Test...");
    console.log("📊 ENV Config Check: MailerSend Key Length:", (process.env.MAILERSEND_API_KEY || "").length);
    console.log("📬 Sender Email:", process.env.SMTP_USER);
    
    const testOptions = {
        to: "bharathanvicky@gmail.com",
        subject: "🛠️ Focus Forms - Critical Delivery Test",
        html: `<h1>System Test</h1><p>Sent at: ${new Date().toLocaleString()}</p><p>Sender: ${process.env.SMTP_USER}</p>`
    };

    try {
        const result = await mailService.sendEmail(testOptions);
        if (result.success) {
            console.log("✅ SUCCESS! Message ID:", result.messageId);
            console.log("💡 Check your inbox at bharathanvicky@gmail.com!");
        } else {
            console.error("❌ FAILED:", result.error || "Unknown Error");
        }
    } catch (err) {
        console.error("🔥 CRITICAL ERROR:", err.message);
    }
}

testMail();
