# Supabase Email Setup

The A-Level Dojo frontend requests confirmation and password-reset emails through Supabase Auth. The `RESEND_API_KEY` stored in Vercel is used by A-Level Dojo serverless email routes, but it does **not** automatically configure delivery for Supabase Auth emails.

## 1. Email confirmation setting

Open **Supabase Dashboard → Authentication → Providers → Email**.

- Enable the Email provider.
- Turn **Confirm email** on when users must verify their address before signing in.
- When confirmation is enabled, a signup normally returns a user but no session until the email is confirmed.
- If messages do not arrive, inspect Auth logs and configure custom SMTP.
- For short-lived local testing only, Confirm email can be turned off to allow immediate signup. Turn it back on when confirmation is required.

## 2. Supabase Auth logs

Open **Supabase Dashboard → Authentication → Logs** after attempting a new signup or resend.

Check for:

- Email rate limits
- SMTP not configured or authentication failures
- Delivery failures
- Rejection by the email provider
- Invalid or disallowed redirect URLs

Also check the Resend Logs page after custom SMTP is enabled. If Supabase logs an email attempt but Resend has no corresponding request, the SMTP connection or credentials are incorrect.

## 3. Resend SMTP for Supabase Auth

First verify `aleveldojo.com` in Resend. The sender address must belong to that verified domain.

Open **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**, enable custom SMTP, and enter:

```text
Host: smtp.resend.com
Port: 465
Username: resend
Password: your Resend API key
Sender email: support@aleveldojo.com
Sender name: A-Level Dojo
```

Save the settings, then request a fresh confirmation email. A Vercel `RESEND_API_KEY` by itself is not enough for Supabase signup or reset emails.

## 4. Redirect URLs

Open **Supabase Dashboard → Authentication → URL Configuration**.

Set the production Site URL to:

```text
https://aleveldojo.com
```

Add these Redirect URLs:

```text
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
https://aleveldojo.com/auth/callback
https://aleveldojo.com/reset-password
https://alevel-dojo-canny-s-projects.vercel.app/auth/callback
https://alevel-dojo-canny-s-projects.vercel.app/reset-password
```

When testing a Vercel preview deployment, also add its exact URLs:

```text
https://YOUR-VERCEL-PREVIEW-URL/auth/callback
https://YOUR-VERCEL-PREVIEW-URL/reset-password
```

If a confirmation link lands on `/#`, Supabase has normally rejected or ignored the requested `emailRedirectTo` and fallen back to the configured Site URL. Add the exact preview callback URL above, save the Supabase configuration, and request a brand-new confirmation email.

## 5. Email templates

Open **Supabase Dashboard → Authentication → Email Templates**.

### Confirm signup

- Subject: `Confirm your A-Level Dojo account`
- Paste the contents of `supabase-email-templates/confirm-signup.html`.

### Reset password

- Subject: `Reset your A-Level Dojo password`
- Paste the contents of `supabase-email-templates/password-reset.html`.

Both templates intentionally use Supabase's secure action URL:

```html
{{ .ConfirmationURL }}
```

Do not replace that variable with a localhost or production URL manually.

## Testing confirmation

1. Deploy the current app or run it at `http://localhost:5173`.
2. Confirm the matching callback URL is allowed in Supabase.
3. Create a brand-new account with an address not already present in Authentication → Users.
4. Check Supabase Auth logs immediately.
5. Check Resend logs and the recipient's spam folder.
6. Use **Resend confirmation email** from A-Level Dojo if needed.
7. Open the newest link once; older links can be expired or superseded.
8. The link should open `/auth/callback`, establish the session, and continue to onboarding.
