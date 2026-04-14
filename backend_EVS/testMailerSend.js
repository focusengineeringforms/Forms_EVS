import dotenv from 'dotenv';
dotenv.config();

import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const sentFrom = new Sender("feedback@evsuae.com", "EVSUAE");
const recipients = [new Recipient("test@example.com")];
const emailParams = new EmailParams()
  .setFrom(sentFrom)
  .setTo(recipients)
  .setSubject("Test MailerSend")
  .setHtml("<p>Testing</p>");

mailersend.email.send(emailParams)
  .then(res => console.log("MailerSend Success:", res.statusCode))
  .catch(err => console.error("MailerSend Error:", err.body || err));
