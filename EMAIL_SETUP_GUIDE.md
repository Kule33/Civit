# Gmail SMTP Setup Guide for CIVIT

## ✅ What's Been Done

The backend is now configured to send real emails via Gmail SMTP. All code changes are complete.

## 🔐 What You Need to Do

### Step 1: Create Gmail App Password

1. **Go to Google Account Security:**
   - Visit: https://myaccount.google.com/security
   
2. **Enable 2-Step Verification** (if not already enabled):
   - Click "2-Step Verification"
   - Follow the setup process
   
3. **Generate App Password:**
   - In Security settings, scroll to "2-Step Verification"
   - At the bottom, click "App passwords"
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: `CIVIT Backend`
   - Click **Generate**
   - You'll get a **16-character password** like: `abcd efgh ijkl mnop`
   - **Copy this password!**

### Step 2: Update Configuration

Open: `d:\JV\Civit\backend\appsettings.json`

Find this section:
```json
"EmailSettings": {
  "AdminEmail": "alexshantha1@gmail.com",
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": 587,
  "SmtpUsername": "alexshantha1@gmail.com",
  "SmtpPassword": "YOUR_APP_PASSWORD_HERE",  // ← REPLACE THIS
  "SenderEmail": "alexshantha1@gmail.com",
  "SenderName": "CIVIT Question Paper System"
},
```

**Replace** `YOUR_APP_PASSWORD_HERE` with your 16-character app password (remove spaces).

Example:
```json
"SmtpPassword": "abcdefghijklmnop",
```

### Step 3: Restart Backend

```powershell
# Stop the current backend (Ctrl+C in terminal)
# Then restart:
.\start-backend.bat
```

## 📧 How Emails Work Now

### When User Submits Typeset Request:

1. **Email to Admin** (`alexshantha1@gmail.com`):
   - Subject: "New Typeset Request from [User Name] - [Subject] [Exam Type]"
   - Includes: User details, paper details, user's message
   - **Attachment:** Generated PDF file
   - Sent from: `alexshantha1@gmail.com`

2. **Confirmation Email to User**:
   - Subject: "Typeset Request Received - Request #[ID]"
   - Includes: Request details, what happens next
   - Sent to: User's email from profile
   - Sent from: `alexshantha1@gmail.com`

### When Admin Updates Status:

**Email to User**:
- Subject: "Typeset Request #[ID] - Status Update"
- Includes: New status, admin notes
- Color-coded by status (Pending/In Progress/Completed/Rejected)
- Sent to: User's email
- Sent from: `alexshantha1@gmail.com`

## 🧪 Testing

After updating the password and restarting:

1. **Generate a paper** in the frontend
2. **Submit typeset request** with optional message
3. **Check your inbox:** `alexshantha1@gmail.com`
   - You should receive an email with PDF attachment
4. **Check user's inbox:** They should receive confirmation email

## ⚠️ Important Notes

- **App Password is NOT your regular Gmail password**
- Keep the app password **secret** (don't commit to Git)
- Emails come from `alexshantha1@gmail.com`
- Admin receives all typeset requests at `alexshantha1@gmail.com`
- Gmail has sending limits: ~500 emails/day (more than enough for this project)

## 🔧 Troubleshooting

### Email not sending?

1. **Check backend logs** - look for:
   - `✅ Email sent successfully to...` (success)
   - `❌ Error sending email...` (failure with details)
   - `SMTP password not configured` (missing password)

2. **Common Issues:**
   - Wrong app password → Generate new one
   - 2-Step Verification not enabled → Enable it first
   - Spaces in password → Remove all spaces
   - Using regular password → Must use App Password

3. **Gmail blocking?**
   - Check "Less secure app access" (shouldn't be needed with app password)
   - Check for email from Google about blocked sign-in attempt
   - Try generating new app password

### Testing SMTP Connection:

If emails still not working, check backend console for detailed error messages.

## 📝 Configuration Reference

All settings in `appsettings.json`:

```json
"EmailSettings": {
  "AdminEmail": "alexshantha1@gmail.com",      // Who receives typeset requests
  "SmtpHost": "smtp.gmail.com",                // Gmail SMTP server
  "SmtpPort": 587,                             // TLS port
  "SmtpUsername": "alexshantha1@gmail.com",    // Your Gmail address
  "SmtpPassword": "YOUR_16_CHAR_APP_PASSWORD", // App password from Google
  "SenderEmail": "alexshantha1@gmail.com",     // From address
  "SenderName": "CIVIT Question Paper System"  // From name
}
```

## 🎉 Once Working

You'll see real emails with:
- Professional HTML formatting
- PDF attachments for admin
- Color-coded status updates
- Responsive email design
- Proper sender name and email

---

**Need Help?** Check the backend console logs for detailed error messages!
