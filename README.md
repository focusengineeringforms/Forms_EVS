# Form Management System

A comprehensive, enterprise-grade form management solution built with the MERN stack (MongoDB, Express, React, Node.js). This system allows for creating dynamic forms, collecting responses, managing users with role-based access, and visualizing data through analytics.

## � Live Deployments

- **Customer Facing Forms**: [https://forms.focusengineeringapp.com](https://forms.focusengineeringapp.com)
- **Admin Panel**: [https://formsadmin.netlify.app](https://formsadmin.netlify.app)
- **Backend API**: [https://forms-backend-1-9ate.onrender.com/api](https://forms-backend-1-9ate.onrender.com/api)

## �🚀 Project Structure

The project is organized into two main directories:

- **`backend_EVS/`**: Node.js/Express REST API (Render).
- **`customer-module_EVS/`**: Premium, mobile-optimized form filler for end-users (Cloudflare Pages).
- **`frontend_EVS/`**: Admin dashboard for form building and analytics (Netlify).

## ✨ Key Features

### Core Functionality
- **NPS Optimized UI**: "Fit-to-Screen" mobile experience with no vertical or horizontal scrolling.
- **Branded White Theme**: Permanent light-mode UI for a premium, professional feel.
- **Dynamic Form Builder**: Create complex forms with various input types and logic.
- **Multi-Channel Invites**: Send via Email, SMS, and WhatsApp with real-time tracking.

### Advanced Integrations
- **Authentication**: Secure JWT-based authentication.
- **File Storage**:
  - AWS S3 for scalable file storage.
  - Cloudinary for image optimization (legacy/optional).
  - Google Drive integration for specific workflows.
- **Multi-Channel Notifications**:
  - **Email**: SMTP (Gmail/Outlook) or MailerSend
  - **SMS**: Twilio SMS service
  - **WhatsApp**: Twilio WhatsApp API
- **PDF Generation**: Automated PDF report generation using Puppeteer.

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Services**: AWS SDK, Twilio, Nodemailer, Puppeteer, Google APIs

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State/API**: Context API + Custom Hooks
- **Icons**: Lucide React

---

## ⚡ QUICK START: RUN THE PROJECT

To start the full system, run these commands in THREE separate terminals:

**Terminal 1 (Backend - API & WhatsApp):**
```bash
cd backend_EVS
npm run dev
```

**Terminal 2 (Admin Panel):**
```bash
cd frontend_EVS
npm run dev
```
 
**Terminal 3 (Customer Module):**
```bash
cd customer-module_EVS
npm run dev
```

---

## 🚦 Getting Started

You can run this application in two ways:

### Option 1: Docker (Recommended - Easiest)

Run everything with one command using Docker:

```bash
# Copy environment template
cp .env.docker .env

# Edit .env with your credentials

# Start all services (MongoDB, Backend, Frontend)
docker-compose up -d
```

Access the app at http://localhost:3000

**Docker Services:**
- **MongoDB**: Database (port 27017)
- **Backend**: API server (port 5000)
- **Frontend**: React app (port 3000)

**Docker Commands:**
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas connection)
- Git

#### Quick Start

1. **Clone the repository** (if not already done)

2. **Install Dependencies**:
   ```bash
   # Install backend dependencies
   cd backend_EVS
   npm install

   # Install admin dependencies
   cd ../frontend_EVS
   npm install
 
   # Install customer module dependencies
   cd ../customer-module_EVS
   npm install
   ```

3. **Configure Environment**:
   - Create `backend_EVS/.env` with required variables (see configuration section below)
   - Update MongoDB URI, SMTP credentials, and other services

4. **Start the Servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend_EVS
   npm run dev

   # Terminal 2 - Admin Panel  
   cd frontend_EVS
   npm run dev
 
   # Terminal 3 - Customer Module
   cd customer-module_EVS
   npm run dev
   ```

5. **Access the Application**:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5001

---

## 🔐 Default Login Credentials

The system creates default accounts on first run:

**Super Admin** (System-wide access)
- Email: `superadmin@focus.com`
- Password: `superadmin123#`
- Access: All tenants, system configuration

**Production Admin (Hussein)**
- Email: `hussein@evsuae.com`
- Password: `hussein@EVS`
- Access: EVS NPS form management and analytics

**Tenant Admin** (Default Business)
- Email: `admin@focus.com`  
- Password: `admin123#`
- Access: Default tenant forms and users

> **⚠️ Security Warning**: Change these passwords immediately in production!

---

## 📝 Environment Configuration

Create a `.env` file in the `backend/` directory with these variables:

### Required Configuration

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/forms-db
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forms-db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173

# Email Configuration (Choose one)
# Option 1: Gmail SMTP (Recommended for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SHOP_EMAIL=your-email@gmail.com

# Option 2: Outlook SMTP
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587
# SMTP_USER=your-email@outlook.com
# SMTP_PASS=your-password

# Option 3: MailerSend (Production)
# MAILERSEND_API_KEY=your-mailersend-api-key
# MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
# MAILERSEND_FROM_NAME=Your App Name

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_SMS_NUMBER=+18452804623
TWILIO_SMS_NUMBER_SID=your-sms-number-sid

# WhatsApp Configuration (Twilio)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_INVITE_TEMPLATE_SID=your-template-sid

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

# Optional: Cloudinary (Legacy)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📧 Email Setup

### Gmail Setup (Recommended for Development)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Factor Authentication**
3. Generate an **App Password**:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the 16-character password
4. Use this password in `SMTP_PASS`

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # 16-character app password
SHOP_EMAIL=your-email@gmail.com
```

### Outlook Setup

**Configuration:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SHOP_EMAIL=your-email@outlook.com
```

### MailerSend Setup (Production)

1. Sign up at [MailerSend](https://www.mailersend.com/)
2. Verify your domain
3. Get your API key
4. Configure:

```env
MAILERSEND_API_KEY=your-api-key
MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
MAILERSEND_FROM_NAME=Your App Name
```

---

## 📱 SMS Setup (Twilio)

### 1. Create Twilio Account
- Sign up at [Twilio](https://www.twilio.com/)
- Get your Account SID and Auth Token

### 2. Purchase SMS Number
- Go to Phone Numbers → Buy a Number
- Choose a US number with SMS capabilities
- Recommended: `+1 845 280 4623` (or similar)

### 3. Configure Geographic Permissions
- Go to Messaging → Settings → Geo Permissions
- Enable countries you want to send to (e.g., India, US)

### 4. Verify Recipient Numbers (Trial Account)
- Go to Phone Numbers → Verified Caller IDs
- Add and verify recipient phone numbers
- Required for trial accounts

### 5. Configure Environment
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_NUMBER=+18452804623
TWILIO_SMS_NUMBER_SID=PNxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### SMS Costs (Approximate)
- **US Number**: $1.00/month
- **SMS to India**: $0.0520 per message
- **SMS to US**: $0.0079 per message

### Testing SMS
```bash
cd backend
node scripts/test-sms.js
```

---

## 💬 WhatsApp Setup (Twilio)

### Development/Testing (Sandbox - Immediate)

1. **Access Twilio Sandbox**:
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Join sandbox by sending code to `+1 415 523 8886`

2. **Configure**:
   ```env
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

3. **Test immediately** - No verification needed!

### 💬 Production WhatsApp (DIRECT BYPASS ACTIVE)

**✅ VERIFIED: Direct Delivery to India (+91) & UAE (+971)**

The system is now fully optimized for the **Focus Engineering Verified Account**. This configuration bypasses the 24-hour window restrictions and the sandbox-requirement.

#### 1. Configuration (Verified Path)
Ensure your `backend/.env` is set exactly like this for global reach:
```env
WA_TWILIO_ACCOUNT_SID=your_twilio_account_sid
WA_TWILIO_AUTH_TOKEN=your_twilio_auth_token
WA_TWILIO_WHATSAPP_NUMBER=+919486240282
WA_TWILIO_INVITE_TEMPLATE_SID=your_template_sid
```

#### 2. Why it's Reliable
Unlike standard trial numbers, this verified path uses an approved **Content API template** (`service_update_v1`). This template has been manually synced between Meta and Twilio to ensure it delivers even to users who haven't messaged the shop yet.

#### 3. Troubleshooting
- **Error 63016**: This will NOT occur with the current configuration as the template variables are pre-aligned (Single-variable mode `{{1}}`).
- **Delivery Delay**: If a message lags, check the **Twilio Content Template Builder** to ensure the "WhatsApp business initiated" status remains green.

---

## 🎯 Notification System Features

### Email Invites
- ✅ Send form invites via email
- ✅ Upload recipient lists (Excel/CSV)
- ✅ Track delivery status
- ✅ Unique invite links per recipient
- ✅ Resend functionality

### SMS Invites
- ✅ Send form invites via SMS
- ✅ Upload phone number lists (Excel/CSV)
- ✅ International phone support
- ✅ Track delivery status
- ✅ Unique invite links per recipient

### WhatsApp Invites
- ✅ Send form invites via WhatsApp
- ✅ Upload phone number lists (Excel/CSV)
- ✅ Template-based messaging
- ✅ Track delivery status
- ✅ Sandbox for testing

### File Upload Format

**Excel/CSV Requirements:**
```csv
Email,Phone
user1@example.com,+919894286683
user2@example.com,+911234567890
user3@example.com,+919876543210
```

**Columns:**
- **Email**: Required for email invites, optional for SMS/WhatsApp
- **Phone**: Required for SMS/WhatsApp, optional for email
- Phone numbers must be in international format (+country code)

---

## 🐳 Docker Deployment

### Production Deployment

1. **Update environment variables** in `.env`:
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://prismatic-puffpuff-3f5237.netlify.app
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/forms-db
   ```

2. **Build and deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Configure reverse proxy** (Nginx/Caddy) for SSL

### Docker Compose Services

**Development** (`docker-compose.yml`):
- Hot reload enabled
- Development ports exposed
- Volume mounts for live code changes

**Production** (`docker-compose.prod.yml`):
- Optimized builds
- No development dependencies
- Health checks enabled
- Restart policies configured

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Forms
- `GET /api/forms` - List all forms
- `POST /api/forms` - Create new form
- `GET /api/forms/:id` - Get form details
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/duplicate` - Duplicate form

### Invites
- `POST /api/forms/:formId/invites/upload` - Upload invite list
- `POST /api/forms/:formId/invites/send` - Send email invites
- `POST /api/forms/:formId/invites/sms/send` - Send SMS invites
- `POST /api/forms/:formId/invites/whatsapp/send` - Send WhatsApp invites
- `GET /api/forms/:formId/invites/stats` - Get invite statistics
- `GET /api/forms/:formId/invites` - List all invites

### Responses
- `GET /api/responses` - List all responses
- `POST /api/responses/:formId` - Submit form response
- `GET /api/responses/form/:formId` - Get form responses
- `GET /api/responses/form/:formId/export` - Export responses

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend_EVS
npm test
```

### Test SMS Functionality
```bash
cd backend_EVS
node scripts/test-sms.js
```

### Test Email Functionality
```bash
cd backend_EVS
node scripts/test-email.js
```

---

## 🔧 Troubleshooting & Production Notes
 
### 🌐 CORS & Production Access
If users see "Failed to load form" or CORS errors in the console:
1. Ensure the **Render Environment Variable** `FRONTEND_URL` includes the full protocol.
   - ✅ Correct: `https://forms.focusengineeringapp.com`
   - ❌ Incorrect: `forms.focusengineeringapp.com`
2. Backend re-deploys automatically when environment variables change. Wait for "Deploy Live".
 
### 🗄️ Database Mismatches
The project uses two different MongoDB Atlas clusters. Ensure your `.env` matches the correct one for the data you need:
- **Render Cluster**: `8im0otd.mongodb.net` (Used for production data).
- **Legacy Cluster**: `8ia0std.mongodb.net`.
 
### 🔄 Cold Starts
On the Render Free Tier, the backend will "spin down" after inactivity.
- The user will see a branded **"Retry Connection"** screen.
- Wait ~60 seconds for the server to wake up before clicking retry.

### MongoDB Connection Issues
- Verify MongoDB is running: `mongod --version`
- Check connection string in `.env`
- For Atlas: Whitelist your IP address

### Email Not Sending
- Verify SMTP credentials
- Check app password (Gmail)
- Enable "Less secure app access" if needed
- Check spam folder

### SMS Not Sending
- Verify Twilio credentials
- Check phone number format (+country code)
- Verify recipient numbers (trial account)
- Check geographic permissions

### WhatsApp Not Sending
- Verify sandbox join code sent
- Check template SID (production)
- Verify phone number format
- Check Twilio console logs

### Docker Issues
```bash
# View logs
docker-compose logs -f backend_EVS
docker-compose logs -f frontend_EVS

# Restart services
docker-compose restart

# Clean rebuild
docker-compose down
docker-compose up -d --build
```

---

## 📁 Project Structure

```
forms_new/
├── backend_EVS/
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (email, SMS, WhatsApp)
│   ├── middleware/      # Auth, validation
│   ├── scripts/         # Utility scripts
│   ├── .env            # Environment variables
│   └── server.js       # Entry point
│
├── frontend_EVS/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api/        # API client
│   │   ├── contexts/   # React contexts
│   │   ├── pages/      # Page components
│   │   └── utils/      # Utilities
│   └── vite.config.ts  # Vite configuration
│
├── customer-module_EVS/  # end-user UI
│
├── docker-compose.yml   # Docker development
├── Dockerfile          # Docker image
└── README.md          # This file
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Change default admin passwords
- [ ] Set strong `JWT_SECRET`
- [ ] Configure production MongoDB (Atlas)
- [ ] Set up SSL certificates
- [ ] Configure production email service
- [ ] Set up SMS/WhatsApp production numbers
- [ ] Configure AWS S3 for file storage
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Environment Variables for Production

```env
NODE_ENV=production
FRONTEND_URL=https://prismatic-puffpuff-3f5237.netlify.app
MONGODB_URI=mongodb+srv://...
JWT_SECRET=very-long-random-string
# ... other production values
```

---

## 🤝 Contributing

Please ensure you follow the project's coding standards and submit pull requests for any new features or bug fixes.

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit pull request
5. Wait for code review

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For issues and questions:
- Check this README first
- Review error logs
- Check Twilio/AWS console for service issues
- Contact system administrator

---

## 📝 Version History

### v2.0.0 (Current)
- ✅ Multi-channel notifications (Email, SMS, WhatsApp)
- ✅ Invite tracking and analytics
- ✅ Docker deployment support
- ✅ AWS S3 file storage
- ✅ Enhanced security

### v1.0.0
- Initial release
- Basic form builder
- Response collection
- User management

---

**Built with ❤️ using MERN Stack**
