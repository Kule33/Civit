# Supabase Configuration Guide

## 🚨 IMPORTANT: Required Configuration

This guide explains how to properly configure Supabase for the authentication features (signup, login, password reset) to work correctly.

---

## 📋 What Needs to Be Configured

### 1. **Redirect URLs** (Required)
Without this, users will see error pages after:
- Clicking email confirmation link (signup)
- Clicking password reset link (forgot password)

### 2. **Email Templates** (Optional but Recommended)
Makes emails look professional and branded with your app name.

---

## 🔧 Step-by-Step Configuration

### **Step 1: Access Supabase Dashboard**

1. Go to https://supabase.com
2. Sign in to your account
3. Select your project
4. You should see the project dashboard

---

### **Step 2: Configure Redirect URLs**

#### For Development:

1. Click **"Authentication"** in the left sidebar (🔐 icon)
2. Click on the **"URL Configuration"** tab
3. Scroll to the **"Redirect URLs"** section
4. Add the following URLs (click "Add URL" for each):
   - `http://localhost:5173/login` (for email confirmation after signup)
   - `http://localhost:5173/reset-password` (for password reset)
5. Click **"Save"**

#### For Production:

Add the same URLs but with your production domain:
- `https://yourdomain.com/login`
- `https://yourdomain.com/reset-password`

**Screenshot locations:**
```
Supabase Dashboard
  └─ Authentication
      └─ URL Configuration
          └─ Redirect URLs section
              └─ [Add URL button]
```

---

### **Step 3: (Optional) Customize Email Templates**

#### A. Confirmation Email (Signup)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Find **"Confirm signup"** template
3. Click **"Edit"**
4. Customize:

**Subject:**
```
Confirm Your Civit Account
```

**Body (HTML):**
```html
<h2>Welcome to Civit!</h2>
<p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Email</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't sign up for Civit, you can safely ignore this email.</p>
<p>Thanks,<br>The Civit Team</p>
```

5. Click **"Save"**

#### B. Password Reset Email

1. Still in **Email Templates**, find **"Reset Password"** template
2. Click **"Edit"**
3. Customize:

**Subject:**
```
Reset Your Civit Password
```

**Body (HTML):**
```html
<h2>Reset Your Password</h2>
<p>We received a request to reset your password for your Civit account.</p>
<p>Click the button below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
<p>This link will expire in 1 hour.</p>
<p>Thanks,<br>The Civit Team</p>
```

4. Click **"Save"**

---

## 🧪 Testing the Configuration

### Test Signup Flow:

1. Start your frontend: `npm run dev`
2. Go to `http://localhost:5173/login`
3. Click "Create a new account"
4. Enter email and password, click "Sign up as Teacher"
5. Check your email inbox (and spam folder)
6. You should see: **"Confirm Your Civit Account"** email
7. Click the confirmation link
8. You should be redirected to: `http://localhost:5173/login` ✅
9. You can now log in with your credentials

### Test Password Reset Flow:

1. Go to `http://localhost:5173/login`
2. Click "Forgot your password?"
3. Enter your email, click "Send Reset Link"
4. Check your email inbox (and spam folder)
5. You should see: **"Reset Your Civit Password"** email
6. Click the reset link
7. You should be redirected to: `http://localhost:5173/reset-password` ✅
8. Enter new password (twice), click "Reset Password"
9. You'll be redirected to login page

---

## 🔍 Troubleshooting

### Problem: "Invalid redirect URL" error

**Solution:** 
- Make sure you added the exact URLs to Supabase
- URLs must match exactly (including http/https, port, path)
- Don't forget the `/login` and `/reset-password` paths

### Problem: Users see "Unknown error page" after clicking email link

**Solution:**
- This happens when redirect URLs are not configured
- Follow Step 2 above to add the URLs
- Wait a few seconds for Supabase to update
- Test again with a new email confirmation

### Problem: Email not arriving

**Solution:**
- Check spam/junk folder
- In Supabase Dashboard, go to **Authentication** → **Users** to see if user was created
- Check Supabase logs for email sending errors
- For development, you can disable email confirmation:
  - Go to **Authentication** → **Providers** → **Email**
  - Toggle "Confirm email" OFF (not recommended for production)

### Problem: Reset password page shows "Invalid reset link"

**Solution:**
- The link may have expired (default: 1 hour)
- Request a new password reset
- Make sure you clicked the link from the email (not manually typing the URL)

---

## 📚 Additional Configuration (Optional)

### Change Token Expiration Times:

1. Go to **Authentication** → **Providers** → **Email**
2. Adjust settings:
   - **JWT expiry** (default: 3600 seconds = 1 hour)
   - **Refresh token rotation** (enabled by default)

### Customize Email Sender:

1. Go to **Settings** → **Auth**
2. Under **SMTP Settings**, you can configure:
   - Custom SMTP server
   - Custom "From" email address
   - Custom sender name

---

## ✅ Verification Checklist

After configuration, verify:

- [ ] Added `http://localhost:5173/login` to redirect URLs
- [ ] Added `http://localhost:5173/reset-password` to redirect URLs
- [ ] (Optional) Customized confirmation email template
- [ ] (Optional) Customized password reset email template
- [ ] Tested signup flow - email received and link redirects properly
- [ ] Tested password reset flow - email received and link redirects properly
- [ ] Checked Supabase logs for any errors

---

## 🎯 Current Code Configuration

The code is already configured to use these redirect URLs:

**Signup redirect** (AuthProvider.jsx):
```javascript
emailRedirectTo: `${window.location.origin}/login`
```

**Password reset redirect** (AuthProvider.jsx):
```javascript
redirectTo: `${window.location.origin}/reset-password`
```

This means:
- Development: Uses `http://localhost:5173`
- Production: Uses your production domain automatically

**No code changes needed** - just configure Supabase dashboard! 🎉

---

## 📞 Need Help?

If you're still having issues:
1. Check Supabase Dashboard → **Logs** for error messages
2. Check browser console (F12) for JavaScript errors
3. Verify the URLs in Supabase exactly match your app's URLs
4. Try clearing browser cache and cookies
5. Test with an incognito/private browser window

---

## 🚀 Production Deployment

When deploying to production:

1. **Add production URLs** to Supabase redirect URLs
2. **Test the flow** on production before announcing to users
3. **Keep development URLs** in the list for continued development
4. **Consider custom SMTP** for better email deliverability
5. **Enable rate limiting** in Supabase to prevent abuse

That's it! Your authentication system is now fully configured. 🎉
