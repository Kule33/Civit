# SendGrid SMTP Setup Guide for CIVIT

## ✅ What's Been Done

The backend is now configured to send emails via SendGrid SMTP. All code changes are complete.

## 🚀 SendGrid Setup Steps

### Step 1: Create SendGrid Account

1. **Sign up for SendGrid:**
   - Go to: https://signup.sendgrid.com/
   - Choose **Free Plan** (100 emails/day forever - perfect for your project!)
   - Complete registration and verify your email

2. **Complete Sender Authentication:**
   - SendGrid will guide you through sender verification
   - You need to verify your sender email: `alexshantha1@gmail.com`
   - Check your email for verification link from SendGrid
   - Click the link to verify

### Step 2: Create API Key

1. **Navigate to API Keys:**
   - Login to SendGrid Dashboard
   - Go to: **Settings** → **API Keys**
   - Or direct link: https://app.sendgrid.com/settings/api_keys

2. **Create New API Key:**
   - Click **"Create API Key"**
   - Name: `CIVIT Backend`
   - Permission: **Full Access** (or at minimum: Mail Send)
   - Click **"Create & View"**

3. **Copy API Key:**
   - You'll see a key like: `SG.xxxxxxxxxxxxxxxxxxxxx...`
   - **COPY THIS KEY IMMEDIATELY** - you can't see it again!
   - It's about 69 characters long

### Step 3: Update Configuration

Open: `d:\JV\Civit\backend\appsettings.json`

Find this section:
```json
"EmailSettings": {
  "AdminEmail": "alexshantha1@gmail.com",
  "SmtpHost": "smtp.sendgrid.net",
  "SmtpPort": 587,
  "SmtpUsername": "apikey",
  "SmtpPassword": "YOUR_SENDGRID_API_KEY_HERE",  // ← REPLACE THIS
  "SenderEmail": "alexshantha1@gmail.com",
  "SenderName": "CIVIT Question Paper System"
},
```

**Replace** `YOUR_SENDGRID_API_KEY_HERE` with your SendGrid API key.

Example:
```json
"SmtpPassword": "SG.abc123xyz789...",
```

**IMPORTANT:** Make sure `SenderEmail` matches the verified sender in SendGrid!

### Step 4: Verify Sender Identity

Before sending emails, you must verify your sender email in SendGrid:

1. **Go to Sender Authentication:**
   - Dashboard → **Settings** → **Sender Authentication**
   - Or: https://app.sendgrid.com/settings/sender_auth

2. **Single Sender Verification** (Easiest for small projects):
   - Click **"Verify a Single Sender"**
   - Fill in form:
     - From Email: `alexshantha1@gmail.com`
     - From Name: `CIVIT System`
     - Reply To: `alexshantha1@gmail.com`
     - Company: `CIVIT Education`
   - Click **"Create"**
   - Check your email and click verification link

3. **Wait for Verification:**
   - You'll receive an email from SendGrid
   - Click the verification link
   - Once verified, you can send emails!

### Step 5: Restart Backend

```powershell
# Stop the current backend (Ctrl+C in terminal)
# Then restart:
.\start-backend.bat
```

## 📧 How Emails Work with SendGrid

### When User Submits Typeset Request:

1. **Email to Admin** (`alexshantha1@gmail.com`):
   - From: `alexshantha1@gmail.com` (via SendGrid)
   - Subject: "New Typeset Request from [User Name] - [Subject] [Exam Type]"
   - Includes: User details, paper details, user's message
   - **Attachment:** Generated PDF file
   - Reply-to: User's email

2. **Confirmation Email to User**:
   - From: `alexshantha1@gmail.com` (via SendGrid)
   - Subject: "Typeset Request Received - Request #[ID]"
   - Includes: Request details, what happens next

### When Admin Updates Status:

**Email to User**:
- From: `alexshantha1@gmail.com` (via SendGrid)
- Subject: "Typeset Request #[ID] - Status Update"
- Includes: New status, admin notes
- Color-coded by status

## 🎁 SendGrid Free Tier Benefits

- ✅ **100 emails/day** - Forever free!
- ✅ **No credit card required**
- ✅ **Better deliverability** than Gmail SMTP
- ✅ **Email analytics** - See opens, clicks, bounces
- ✅ **Professional sender** - Emails won't go to spam
- ✅ **Global infrastructure** - Fast delivery worldwide

## 🧪 Testing

After setup:

1. **Generate a paper** in the frontend
2. **Submit typeset request**
3. **Check SendGrid Dashboard:**
   - Go to: **Activity** → **Email Activity**
   - See real-time delivery status
4. **Check inbox:** `alexshantha1@gmail.com`
   - Should receive email with PDF attachment
5. **Check user's inbox:** Should receive confirmation

## ⚠️ Important Notes

### Security:
- **API Key is SECRET** - Don't share or commit to Git
- Keep it in `appsettings.json` (already in `.gitignore`)
- SendGrid username is always: `apikey` (literal string)

### Sender Email:
- Must match verified sender in SendGrid
- If you change sender email, verify it in SendGrid first
- Unverified senders = emails won't send

### Limits:
- Free: 100 emails/day
- More than enough for this project
- If you need more, upgrade plans start at $15/month (40,000 emails)

## 🔧 Troubleshooting

### Email not sending?

1. **Check backend logs:**
   - `✅ Email sent successfully to...` (success)
   - `❌ Error sending email...` (failure with details)
   - `SMTP password not configured` (missing API key)

2. **Common Issues:**

   **"Sender not verified":**
   - Go to SendGrid → Sender Authentication
   - Verify your sender email
   - Wait for verification email

   **"Invalid API key":**
   - Generate new API key
   - Make sure you copied the full key
   - Check for extra spaces or newlines

   **"Authentication failed":**
   - Username must be exactly: `apikey` (lowercase)
   - Password must be your SendGrid API key starting with `SG.`

   **Emails not arriving:**
   - Check SendGrid Activity feed
   - Check spam folder
   - Verify recipient email is correct

3. **SendGrid Activity Feed:**
   - Dashboard → Activity → Email Activity
   - See detailed logs of all emails
   - Shows: Processed, Delivered, Opened, Bounced, etc.

### Testing SendGrid Connection:

SendGrid provides detailed error messages in:
- Backend console logs
- SendGrid Dashboard → Activity feed
- Email event webhooks (advanced)

## 📊 SendGrid Dashboard Features

After setup, you can:
- **Monitor email delivery** - Real-time activity feed
- **Track opens/clicks** - See engagement metrics
- **View bounces** - Identify invalid emails
- **Manage suppressions** - Handle unsubscribes
- **Download reports** - CSV export of activity

## 🔐 Best Practices

1. **Rotate API Keys:**
   - Generate new key every 90 days
   - Delete old keys after rotation

2. **Use Least Privilege:**
   - API key only needs "Mail Send" permission
   - Don't use "Full Access" in production

3. **Monitor Usage:**
   - Check SendGrid dashboard daily
   - Watch for bounce rate (should be <5%)
   - Monitor sending quota

4. **Sender Reputation:**
   - Don't send spam
   - Handle bounces properly
   - Respect unsubscribe requests

## 📝 Configuration Summary

```json
"EmailSettings": {
  "AdminEmail": "alexshantha1@gmail.com",      // Who receives typeset requests
  "SmtpHost": "smtp.sendgrid.net",             // SendGrid SMTP server
  "SmtpPort": 587,                             // TLS port
  "SmtpUsername": "apikey",                    // Always "apikey" (literal)
  "SmtpPassword": "SG.your_api_key_here",     // Your SendGrid API key
  "SenderEmail": "alexshantha1@gmail.com",     // Must be verified in SendGrid
  "SenderName": "CIVIT Question Paper System"  // Display name
}
```

## 🎉 Advantages Over Gmail

| Feature | Gmail SMTP | SendGrid |
|---------|-----------|----------|
| Setup Complexity | Medium | Easy |
| Daily Limit | ~500 emails | 100 emails (free) |
| Deliverability | Good | Excellent |
| Analytics | No | Yes |
| Spam Risk | Medium | Low |
| Professional | No | Yes |
| API Access | No | Yes |
| Support | Community | Email support |

## 🚀 Next Steps

1. Create SendGrid account
2. Verify sender email
3. Generate API key
4. Update `appsettings.json`
5. Restart backend
6. Test by submitting typeset request
7. Check SendGrid Activity dashboard
8. Verify emails received

---

## 📞 Need Help?

- **SendGrid Docs:** https://docs.sendgrid.com/
- **SendGrid Support:** https://support.sendgrid.com/
- **Backend Logs:** Check console for detailed errors
- **Activity Feed:** SendGrid Dashboard → Activity

---

**Ready to test?** Once you've added the API key and restarted, submit a typeset request and watch the SendGrid Activity feed! 🎉
