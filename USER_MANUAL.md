# 🚘 CUSTOMER FORM MANAGEMENT SYSTEM: USER MANUAL
> **Enterprise-Grade Multichannel Survey & Feedback Platform**  
> *Prepared for: EVS (Engineering Verification Systems) & Focus Engineering Clients*

---

## 📖 TABLE OF CONTENTS
1. **System Introduction & Access Controls**
   - Access Roles & Credentials
   - The Tenant Concept & Branded Banner
   - The Public Customer Portal URL
2. **Creating Custom Forms (Dynamic Form Builder)**
   - Creating a Form from Scratch
   - Understanding the 22 Supported Question Types
   - Designing Deeply Nested Conditional Branching Logic
   - Organizing Forms into Multi-Step Sections
3. **The Customer-Facing Experience (Form Filler)**
   - "Fit-to-Screen" Dynamic Viewport Layout
   - Bilingual reactive Language Switching (English / Arabic / Both)
   - Geolocational Anti-Tampering Verification (Nominatim OpenStreetMap)
   - Auto-Save Session Preservation
4. **Sending Form Invitations (The Multi-Channel Engine)**
   - **WhatsApp Invitations** *(Production Verified)*
   - **SMS Invitations** *(Twilio Carrier SMS)*
   - **Email Invitations** *(MailerSend HTTP API & Nodemailer SMTP)*
   - File Upload Format Requirements (Excel/CSV Template)
5. **Real-Time Invite Status Tracking**
   - Monitoring Delivery & Response Rate Analytics
   - Advanced Searching, Date-Range Filtering, and Sorting
   - Exporting Delivery Logs to CSV
6. **Analyzing Responses & Exporting Reports**
   - Dashboard Analytics & Net Promoter Score (NPS) Doughnut Charts
   - Reading Specific Customer Submissions
   - Viewing Diagnostic File Uploads (AWS S3 Secure Storage)
   - Generating PDF Reports via Puppeteer
7. **System Configuration, Troubleshooting, & Best Practices**
   - Environment Configuration (.env reference)
   - Resolving Render CORS and Backend Spin-down Delay
   - Managing Twilio Geographic Permissions

---

## 1. SYSTEM INTRODUCTION & ACCESS CONTROLS

The **Customer Form Management System** is a premium, multi-tenant enterprise solution built with the MERN stack (MongoDB, Express, React, Node.js). It is specifically customized to gather high-fidelity customer feedback, particularly for automotive maintenance and engineering services, and distribute invites instantly via **WhatsApp**, **SMS**, and **Email**.

### 🔐 Access Roles & Default Credentials
The system features strict role-based access control (RBAC). It includes three default accounts configured on startup:

| Role | Access Level | Target User | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Full global admin panel, tenant registration, system-wide analytics, server configuration. | Focus Engineering Admin | Email: `superadmin@focus.com`<br>Password: `superadmin123#` |
| **Production Admin (EVS)** | Manage EVS-specific forms, launch invites, view response analytics, and download reports. | Hussein (EVS UAE) | Email: `hussein@evsuae.com`<br>Password: `hussein@EVS` |
| **Tenant Admin** | Complete access to manage a single business branch's forms, templates, and responses. | Standard Business Owner | Email: `admin@focus.com`<br>Password: `admin123#` |

> [!WARNING]
> **Production Security:** For security reasons, please change default passwords immediately after logging into the admin dashboard for the first time.

### 🏢 The Tenant Concept & Dashboard Banner
When a Tenant Admin or EVS Admin logs in, they are greeted by their **Tenant Information Banner** at the top of the dashboard. This banner displays:
*   **Business Name:** e.g., Focus Engineering or EVS Dubai.
*   **Tenant Slug:** A unique URL-friendly text string (e.g., `evs`) used to identify the organization.
*   **Customer Portal URL:** The permanent public landing page link for this business. For example:  
    `https://forms.focusengineeringapp.com/evs`  
    Any customer navigating here will see a directory of your published, publicly available surveys.

---

## 2. CREATING CUSTOM FORMS (DYNAMIC FORM BUILDER)

The platform includes a powerful, drag-and-drop style **Form Creator** designed to build complex, branching checklists and feedback forms without typing any code.

### 🛠️ Creating a Form from Scratch
1. Navigate to the **Forms Management** tab from the main sidebar.
2. Click **Create New Form** at the top-right of the screen.
3. In the metadata popup, enter:
   *   **Form Title:** The customer-facing heading of your survey (e.g., "Car Maintenance Satisfaction Survey").
   *   **Description:** Clear instructions explaining the purpose of the form.
   *   **Logo URL:** Direct link to your custom brand logo. If left blank, it defaults to the Tenant's uploaded branding assets.
   *   **Location Capture Enabled:** Check this box if you want to enforce browser GPS tracking to verify where the form is filled out.
4. Click **Initialize Form** to load the Form Editor Canvas.

### 📝 Understanding the 22 Supported Question Types
When adding a new question, select from an extensive list of specialized types designed to gather clean, structured data:

```
┌────────────────────────────────────────────────────────┐
│               SUPPORTED QUESTION TYPES                 │
├───────────────────────┬────────────────────────────────┤
│ 1. Text               │ Short open-ended text answers. │
│ 2. Paragraph          │ Multi-line text for feedback.  │
│ 3. Multiple Choice    │ Radio buttons (Choose one).    │
│ 4. Yes/No/NA          │ Fast engineering checklist.    │
│ 5. Checkboxes         │ Choose multiple answers.       │
│ 6. Search Dropdown    │ Filter large option lists.     │
│ 7. Email Input        │ Built-in format verification.  │
│ 8. URL Link           │ Enforces web address format.   │
│ 9. Phone Number       │ Validates contact numbers.     │
│ 10. Date Selector     │ Calendar date selection.       │
│ 11. Time Selector     │ Hour/Minute picker.            │
│ 12. File Upload       │ Secure S3 attachment upload.   │
│ 13. Range Slider      │ Choose value within limits.    │
│ 14. Star Rating       │ Traditional rating stars.      │
│ 15. Linear Scale      │ 0-10 Scale (Ideal for NPS).    │
│ 16. Choice Grid       │ Rows x Cols (One choice/row).  │
│ 17. Checkbox Grid     │ Rows x Cols (Multi-choice/row).│
│ 18. Image Choice      │ Radio choices using images.    │
│ 19. Slider (1-10)     │ Visual slider rating bar.      │
│ 20. Emoji Star        │ Combined stars and emojis.     │
│ 21. Emoji Reaction    │ 5 Faces: Sad -> Very Happy.    │
│ 22. NPS/TGW Buckets   │ Things Gone Wrong group picker │
└───────────────────────┴────────────────────────────────┘
```

> [!NOTE]
> **Product NPS / TGW Buckets:** This is a proprietary, multi-level hierarchy designed for car maintenance feedback. When a user selects a primary mechanical category (Level 1, e.g. *Brakes*), the system dynamically filters and shows related issues at subsequent levels (Level 2, e.g. *Squeaking Brakes*, Level 3, and so on) for extremely precise defect tracking.

### 🔀 Designing Deeply Nested Conditional Branching Logic
To keep forms concise, you can configure **Conditional Follow-up Questions** that only appear when triggered by a customer's specific answer.

1. Click on the question you wish to make the **Parent Question** (must be a Choice-based question, such as *Yes/No/NA*, *Multiple Choice*, or *Linear Scale*).
2. Click **Add Follow-Up Question** inside that question's card.
3. Configure the **Show When** trigger rule:
   *   **Select Value:** Choose the exact response that triggers the follow-up. For example, if the Parent Question is: *"Were you satisfied with our car service?"*, you can set the trigger to: `NO`.
4. Add the follow-up question details (e.g., a *Paragraph* question: *"Please explain what went wrong"*).
5. The form creator will display this as an indented tree branch. You can recursively click *Add Follow-Up* on a follow-up question to build deeply nested pathways (e.g., Parent Question -> Level 1 Follow-up -> Level 2 Follow-up).

### 🗂️ Organizing Forms into Multi-Step Sections
Long checklists are overwhelming on mobile. The builder allows you to slice forms into distinct chapters or **Sections**:
1. Click **Add New Section** in the left outline pane.
2. Drag and drop existing questions between sections, or create new questions directly inside the chosen section.
3. The Customer Form Filler will automatically display these as sequential, page-by-page steps with a progress bar.

---

## 3. THE CUSTOMER-FACING EXPERIENCE (FORM FILLER)

The customer-facing layout (`customer-module_EVS`) is meticulously engineered to achieve the highest possible survey completion rates, tailored specifically for mobile phones.

### 📱 "Fit-to-Screen" Dynamic Viewport Layout
Unlike traditional web pages that require endless vertical scrolling, this mobile experience uses a strict **Fit-to-Screen Flex Layout** (`100dvh` dynamic height):
*   **Header:** Stays locked at the top, displaying the business logo.
*   **Body Content:** Scrollable box holding the active section's questions.
*   **Footer:** Stays locked at the bottom, housing back/next navigation buttons.
*   This design ensures a premium experience that eliminates horizontal shifting, making it feel like a native mobile app.

### 🌐 Bilingual Reactive Language Switching (English / Arabic / Both)
The form filler features a reactive language engine. Customers can toggle languages instantly using the **Globe Dropdown** in the top corner of the active section:
1.  **English:** Standard left-to-right (LTR) layout with English text.
2.  **Arabic:** Automatically flips the entire interface to right-to-left (RTL) mode, swapping standard fonts to clean Arabic typography (Tahoma/Arial) and showing Arabic text.
3.  **Both:** A side-by-side bilingual display. Questions, helper texts, and button indicators appear in both English and Arabic, ensuring all demographics are comfortably accommodated.

### 📍 Geolocational Anti-Tampering Verification
To prevent fraudulent feedback, the system supports hardware-enforced location verification:
1. When the form loads, the browser requests secure high-accuracy GPS coordinates (`latitude`, `longitude`, `accuracy`).
2. The customer-facing module instantly contacts the **Nominatim OpenStreetMap API** to perform secure reverse-geocoding.
3. This translates raw GPS points into a readable street address (e.g., *"Focus Engineering workshop, Al Quoz Industrial Area 3, Dubai, UAE"*).
4. These telemetry coordinates, source metadata, and geolocal timestamps are saved directly inside the submission object, creating an audit trail that guarantees the customer was physically present at the business location.

### 💾 Auto-Save Session Preservation
If a customer gets a phone call, loses their internet connection, or accidentally closes their browser tab mid-survey, the form state is automatically saved to local storage. When they re-open the link, their progress is instantly restored exactly where they left off, preventing data loss.

---

## 4. SENDING FORM INVITATIONS (THE MULTI-CHANNEL ENGINE)

The system features three distinct channels to reach your clients. From the main dashboard, click on any published form and select **Send Invites** to open the distribution wizard.

---

### 💬 CHANNEL A: WHATSAPP INVITATIONS
*This channel is optimized using Focus Engineering's verified WhatsApp business number to achieve near-instantaneous delivery, bypassing Meta's standard 24-hour initiation windows.*

```
                       WHATSAPP INVITE WORKFLOW
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ Upload CSV/XLS │ ──> │ Validate & Map │ ──> │ Batch Delivery │
 │ (Email/Phone)  │     │ UAE/IND Numbers│     │ (15 at a time) │
 └────────────────┘     └────────────────┘     └────────────────┘
                                                        │
 ┌────────────────┐     ┌────────────────┐              │
 │ Real-Time Logs │ <── │  Twilio API    │ <────────────┘
 │ & Failures Box │     │ Content Sid v1 │
 └────────────────┘     └────────────────┘
```

#### Step 1: Upload and Auto-Clean Numbers
1. Select the **WhatsApp Invite** tab.
2. Click **Download Template** to download an Excel sheet with pre-configured header fields: `Phone` and `Email`.
3. Fill out the spreadsheet and click **Choose Excel File** to upload.
4. The system automatically parses and repairs phone numbers based on local market formats:
   *   **UAE Numbers:** Local numbers starting with `05...` (10 digits) or `5...` (9 digits) are instantly cleaned and formatted to international format (`+9715...`).
   *   **Indian Numbers:** Numbers starting with `6-9` (10 digits) are auto-formatted with the `+91` prefix.
   *   *Other international numbers must be entered with a leading plus sign (+) and country code.*

#### Step 2: Review Preview Statistics
Before sending, the wizard displays a checklist summary:
*   **Valid Phones:** Phone numbers that passed cleaning checks and are ready for dispatch.
*   **Invalid:** Numbers containing letters, wrong lengths, or missing codes.
*   **Duplicates:** Numbers present multiple times in the upload sheet (automatically filtered out).
*   *You can choose to select all valid numbers or check individual boxes.*

#### Step 3: Configure Language & Template Bypass
Select the invitation language: **English (EN)**, **Arabic (AR)**, or **Bilingual (BOTH)**. 
*   *Technical Detail:* The system uses Twilio's **Content API Template SID** (`service_update_v1`). This verified template has a manually approved button link aligned between Meta and Twilio, bypassing sandbox restrictions and guaranteeing delivery even to cold customers who have never messaged your shop before.

#### Step 4: Batch Dispatch & Visual Progress
Click **Send Invites**.
*   The system dispatches messages in safe, rate-limited batches of **15 recipients** at a time.
*   A circular loader shows real-time percentage progress (e.g. `45% completed`).
*   A green progress bar slides to show immediate updates.
*   If a number fails (e.g., Twilio error 63016 or recipient has no WhatsApp active), the failure count rises, and a detailed **Failure Details Box** lists each failed phone number alongside its exact API error reason for quick troubleshooting.

---

### 📱 CHANNEL B: SMS INVITATIONS
*Traditional cellular SMS invites are useful for reaching clients with older phones or limited internet access.*

1. Select the **SMS Invite** tab and upload your list.
2. The system formats numbers (auto-appending `+91` for India or `+971` for UAE).
3. Select your template language.
   *   *Technical Detail:* The SMS message body is written in a professional format, while the survey link dynamically appends language parameters (`?lang=ar` or `?lang=both`) so that the customer is instantly greeted by the correct layout when clicked.
4. Messages are sent from your purchased Twilio carrier number (e.g., `+18452804623`).

---

### 📧 CHANNEL C: EMAIL INVITATIONS
*For a highly branded, high-fidelity message, use the secure email invitation wizard.*

```
                     EMAIL TEMPLATE STRUCTURE
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                   [ BRANDED BUSINESS LOGO ]                  │
│                                                              │
│  Dear Valued Customer,                                       │
│                                                              │
│  Thank you for visiting Focus Engineering. We appreciate     │
│  your business and request your feedback to help us serve    │
│  you better.                                                 │
│                                                              │
│                    ┌──────────────────────┐                  │
│                    │    FILL OUT FORM     │                  │
│                    └──────────────────────┘                  │
│                                                              │
│  Direct Link: https://forms.focusengineeringapp.com/...      │
└──────────────────────────────────────────────────────────────┘
```

1. Select the **Email Invite** tab.
2. Upload the CSV list. A valid `Email` column is required.
3. Review the parsed email list (Valid, Invalid, Duplicates, and Existing submissions are color-coded in green, yellow, and red).
4. Choose the language parameter (English, Arabic, or Both).
5. **How the email is sent:**
   *   **Production (MailerSend HTTP API):** Bypasses blocked standard email ports (SMTP ports are blocked on Render web servers). Uses a dedicated API key and custom verified sender domain to deliver straight to the inbox, bypassing spam filters.
   *   **Development fallback (SMTP/Gmail):** Nodemailer connects directly to standard Gmail App Passwords or Outlook SMTP configurations.
6. **The Email Layout:** Customers receive a fully responsive HTML newsletter featuring your custom logo, a prominent clickable action button, side-by-side English/Arabic instructions, and a secure direct feedback link.

---

### 📂 File Upload Format Requirements (Excel/CSV Template)
To ensure zero errors during list uploads, structure your spreadsheet file exactly like the following:

```csv
Email,Phone
customer.one@gmail.com,+971527519273
customer.two@evsuae.com,0527519273
customer.three@example.com,+919894286683
```

*   **Header row (Row 1):** MUST contain exactly `Email` and `Phone` (Case-Sensitive).
*   **Phone Column:** Optional for email-only invites; required for SMS and WhatsApp. Recommended in international format with country code (e.g. `+971...`). Local UAE formatting (`05...` or `5...`) will be automatically repaired.

---

## 5. REAL-TIME INVITE STATUS TRACKING

Once invites are sent, you can track customer engagement down to the millisecond on the **Form Invite Status** dashboard.

### 📊 Monitoring Delivery & Response Rate Analytics
At the top of the Status dashboard, four statistics cards keep you updated:
1.  **Total Invites:** The absolute count of invitations sent across this form.
2.  **Responded:** The number of customers who successfully clicked the link and submitted feedback.
3.  **Invited Responses:** The subset of responses that originated from unique tracking tokens.
4.  **Response Rate:** Calculated dynamically (e.g., `53%`) to evaluate the effectiveness of your campaign.

### 🔍 Advanced Searching, Date-Range Filtering, and Sorting
A comprehensive search grid makes locating specific client engagement fast and simple:
*   **Instant Search:** Start typing a phone number or email address to filter the table instantly.
*   **Status Filter Dropdown:** Narrow the view to:
    *   `Sent` (Invite dispatched, link has not been filled out yet).
    *   `Responded` (Customer completed the checklist; response recorded).
    *   `Expired` (Token validity has lapsed).
*   **Sort Order:** Sort by Email, Status, or Sent Date in ascending/descending order.
*   **Date Range Selector:** Filter invites based on the exact day they were sent or responded.

### 📥 Exporting Delivery Logs to CSV
Need to share the delivery tracking data with a client or manager?
1. Click **Export CSV** at the top right of the screen.
2. The browser will instantly download a structured file (`invites_[FormID]_[Date].csv`).
3. This report lists Serial Numbers, Recipient Emails, Phone Numbers, Statuses, Sent Timestamps, and Response Timestamps, ready to import directly into Microsoft Excel or Google Sheets.

---

## 6. ANALYZING RESPONSES & EXPORTING REPORTS

The main goal of the system is to process customer submissions into actionable engineering and service improvements.

### 📈 Net Promoter Score (NPS) Doughnut Charts
When you select a form on the dashboard, the system renders an interactive **NPS Doughnut Chart**:
*   **YES (Promoters - Dark Blue):** Customers who chose "YES" or rated services highly.
*   **NO (Detractors - Light Blue):** Customers who highlighted issues.
*   **N/A (Neutral - Royal Blue):** Customers who had neutral responses or skipped non-mandatory choices.
*   The breakdown displays raw counts and dynamic percentages, allowing you to instantly assess a workshop's performance.

### 🔍 Reading Specific Customer Submissions
1. Navigate to the **Responses** tab from the main menu.
2. Click **View Details** on any submission row to open the inspector.
3. The detail view shows:
   *   **Customer Metadata:** Browser type, IP address, and date/time of submission.
   *   **Physical Telemetry:** Latitude, Longitude, location accuracy, and open-street reverse-geocoded address display name.
   *   **Response Grid:** A complete list of all questions alongside the customer's selected answers, organized by section.

### 📎 Viewing Diagnostic File Uploads (AWS S3)
If a form includes a *File Upload* question, customers can snap pictures of mechanical defects or upload diagnostic reports:
*   When a customer uploads a file, it is transferred via a secure stream to **AWS S3** storage.
*   In the Response detail view, the uploaded file appears as an interactive preview thumbnail.
*   Clicking the file securely opens or downloads the file directly from your AWS S3 bucket.

### 📄 Generating PDF Reports via Puppeteer
For client reporting, the system features automated PDF compilation:
1. Click **Generate PDF Report** inside the response sheet.
2. The backend launches a headless **Puppeteer browser** instance on the server.
3. Puppeteer renders a styled dashboard report containing the form title, customer info, location coordinates, and the complete response list.
4. It compiles this page into a professional PDF and downloads it to your computer, ready to print or email to your client.

---

## 7. SYSTEM CONFIGURATION & TROUBLESHOOTING

For administrators maintaining the platform, refer to these operational instructions:

### ⚙️ Environment Configuration (.env reference)
Ensure your `backend_EVS/.env` file contains correct, trimmed variables:

```env
# Server Settings
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://forms.focusengineeringapp.com

# Database Connection (Production Render Cluster)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forms-db

# Token Authentication
JWT_SECRET=use-a-long-random-alphanumeric-string

# Production MailerSend (API Delivery)
MAILERSEND_API_KEY=mlsn.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILERSEND_FROM_EMAIL=feedback@evsuae.com

# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SMS_NUMBER=+18452804623

# WhatsApp Verified Settings
WA_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WA_TWILIO_AUTH_TOKEN=your_twilio_auth_token
WA_TWILIO_WHATSAPP_NUMBER=+971527519273
WA_TWILIO_INVITE_TEMPLATE_SID=HXf0ce62599ceb23e409faea968f99691e
```

---

### 🚨 Common Troubleshooting Steps

#### 1. CORS Errors ("Failed to load form" in Customer Console)
*   **The Issue:** The customer-filler page shows a red error screen, and the browser console logs a CORS origin block.
*   **The Solution:** The backend re-validates origins based on the `FRONTEND_URL` environment variable. Ensure this variable includes the full secure protocol.
    *   ✅ **Correct:** `FRONTEND_URL=https://forms.focusengineeringapp.com`
    *   ❌ **Incorrect:** `FRONTEND_URL=forms.focusengineeringapp.com`
*   *Note:* After changing environment variables on Render, wait ~60 seconds for the backend service to automatically rebuild and show a "Deploy Live" status.

#### 2. Render Cold Starts ("Retry Connection" screen)
*   **The Issue:** When a customer clicks a feedback link, they are occasionally greeted by a custom "Connection Delay / Retry Connection" screen.
*   **The Solution:** The backend API is hosted on Render's free tier, which puts the server to "sleep" after 15 minutes of inactivity. The customer module detects this connection delay and shows a branded, helpful retry screen. Instruct customers or staff to **wait 30-60 seconds** for the server to spin up, then click **Retry Connection** to reload the form with zero loss of progress.

#### 3. WhatsApp messages fail with Error 63016 (Non-sandbox delivery)
*   **The Issue:** Twilio console logs show message delivery failed.
*   **The Solution:** Standard Twilio accounts restrict initiating messages outside of a 24-hour window unless you use an approved **Content Template**. 
    *   Ensure `WA_TWILIO_INVITE_TEMPLATE_SID` is set to an active, approved meta template SID (e.g. `HXf0ce62599ceb23e409faea968f99691e`).
    *   Make sure you are utilizing the single-variable parameter format `{ "1": link_suffix }` in your backend code, stripping any base URL parameters.

#### 4. Twilio Geographical Permission Block
*   **The Issue:** Invites to UAE (+971) or India (+91) fail with permission errors.
*   **The Solution:** Twilio accounts block international SMS/WhatsApp numbers by default.
    1. Log into the **Twilio Console**.
    2. Go to **Messaging** -> **Settings** -> **Geo Permissions**.
    3. Find **United Arab Emirates** and **India** in the list, check their enable boxes, and save.
