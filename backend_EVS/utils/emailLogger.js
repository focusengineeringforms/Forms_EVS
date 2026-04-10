import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../logs');
const emailLogFile = path.join(logDir, 'email-logs.json');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Initialize log file if it doesn't exist
if (!fs.existsSync(emailLogFile)) {
    fs.writeFileSync(emailLogFile, JSON.stringify([], null, 2));
}

export const logEmail = (emailData) => {
    try {
        const logs = JSON.parse(fs.readFileSync(emailLogFile, 'utf8'));

        const logEntry = {
            timestamp: new Date().toISOString(),
            to: emailData.to,
            subject: emailData.subject,
            status: emailData.status || 'sent',
            messageId: emailData.messageId || null,
            error: emailData.error || null
        };

        logs.push(logEntry);

        // Keep only last 100 emails
        if (logs.length > 100) {
            logs.shift();
        }

        fs.writeFileSync(emailLogFile, JSON.stringify(logs, null, 2));

        return logEntry;
    } catch (error) {
        console.error('Failed to log email:', error);
        return null;
    }
};

export const getEmailLogs = (limit = 10) => {
    try {
        const logs = JSON.parse(fs.readFileSync(emailLogFile, 'utf8'));
        return logs.slice(-limit).reverse(); // Get last N logs, newest first
    } catch (error) {
        console.error('Failed to read email logs:', error);
        return [];
    }
};

export const getEmailStats = () => {
    try {
        const logs = JSON.parse(fs.readFileSync(emailLogFile, 'utf8'));

        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(log => log.timestamp.startsWith(today));

        return {
            total: logs.length,
            today: todayLogs.length,
            successful: logs.filter(log => log.status === 'sent' && !log.error).length,
            failed: logs.filter(log => log.error).length
        };
    } catch (error) {
        console.error('Failed to get email stats:', error);
        return { total: 0, today: 0, successful: 0, failed: 0 };
    }
};
