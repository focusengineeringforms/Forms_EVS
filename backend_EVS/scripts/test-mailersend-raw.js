import "../config/env.js";
import fetch from "node-fetch";

async function testMailerSendRaw() {
    console.log("🚀 STARTING: RAW HTTP MailerSend Test...");
    const apiKey = process.env.MAILERSEND_API_KEY;
    const senderEmail = process.env.SMTP_USER;

    if (!apiKey) {
        console.error("❌ No API Key found in .env");
        return;
    }

    const payload = {
        from: {
            email: senderEmail,
            name: "Focus Forms Test"
        },
        to: [
            {
                email: "bharathanvicky@gmail.com"
            }
        ],
        subject: "🛠️ Raw HTTP Test",
        html: "<h1>Raw MailerSend Success!</h1><p>Test fired via plain Fetch.</p>",
    };

    try {
        const response = await fetch("https://api.mailersend.com/v1/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({ msg: "Could not parse JSON" }));
        console.log(`📊 Response Status: ${response.status}`);
        console.log("📄 Response Data:", JSON.stringify(data, null, 2));

        if (response.status === 202) {
            console.log("✅ SUCCESS! Mail accepted for delivery.");
        } else {
            console.log("❌ FAILED. Look at the error data above.");
        }
    } catch (err) {
        console.error("🔥 FETCH ERROR:", err.message);
    }
}

testMailerSendRaw();
