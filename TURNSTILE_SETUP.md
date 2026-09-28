# Turnstile authentication setup

## Diagnosed cause

The reported development message was the component's missing-site-key branch: it never loaded Cloudflare without a key, and the form correctly stayed disabled without a token. At inspection, `.env` and `.env.local` were absent and `.env.example` had an empty `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY`. Vite uses the correct `import.meta.env` name. Installed Supabase 2.105.4 supports `options.captchaToken` on both password login and signup; those calls are correct. No repository CSP was found in Vercel, Vite or HTML configuration.

Remote Vercel environment variables, hosting-level CSP and Supabase CAPTCHA configuration cannot be inferred from local files and must be checked below.

Browser verification also caught Cloudflare rejecting `turnstile.ready()` on an asynchronously loaded script. The loader now uses the script load event directly; a regression test prevents reintroducing that error.

Local validation: production build and four loader tests pass. The test browser returned Cloudflare error 300030 and displayed the safe Retry state; Retry re-entered verification without a page reload. Successful challenges and real sign-in/signup still require testing in a supported regular browser with matching site/secret configuration. No CAPTCHA bypass was added.

## Cloudflare

1. Open Cloudflare Dashboard > Turnstile > Add widget.
2. Name it **A-Level Dojo**.
3. Add `aleveldojo.com`, `www.aleveldojo.com`, and the active Vercel preview hostname if previews need authentication (for example `alevel-dojo-canny-s-projects.vercel.app`). Enter hostnames without protocols or paths.
4. Select **Managed** mode and create the widget.
5. Copy its public **Site Key**. Copy its private **Secret Key** separately and keep it private. Do not paste either into Codex or commit real keys to GitHub.

## Vercel

1. Open the A-Level Dojo project > Settings > Environment Variables.
2. Add `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY` with the public Site Key.
3. Enable Production and Preview. Enable Development only if needed. Save.
4. When ready, deploy the commit containing these fixes and redeploy after setting/changing the variable. Vite embeds environment variables during the build: merely saving a variable does not change an existing deployment.
5. Check that the widget allows every hostname used by those deployments.

## Supabase

1. Open the correct A-Level Dojo Supabase project (the project URL is in `src/supabaseClient.js`).
2. Open Authentication settings > CAPTCHA Protection or Bot and Abuse Protection.
3. Enable CAPTCHA and choose **Cloudflare Turnstile**.
4. Paste the matching private **Secret Key** here and save.

**Public Site Key -> Vercel `VITE_CLOUDFLARE_TURNSTILE_SITE_KEY`. Private Secret Key -> Supabase CAPTCHA settings only.** Never put the private Secret Key in a `VITE_` variable, frontend source, logs or git. Keep CAPTCHA enabled. Supabase validates the token server-side; client verification alone is insufficient.

## Local development

The local app requires an explicit public Site Key in ignored `.env.local`:

```text
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=YOUR_PUBLIC_SITE_KEY
```

No test-key fallback is used when this key is missing. A test widget can report success in the browser while the connected Supabase project rejects its token if Supabase uses a real Secret Key. Production rejects known test keys. The Site Key is public; keep the private Secret Key only in Supabase CAPTCHA settings.

To sign in against the existing Supabase project locally, configure its matching real public Site Key in ignored `.env.local`, allow `localhost` (and `127.0.0.1` if used) in that Cloudflare widget, and **restart Vite** after changing `.env.local`. A separate development Supabase project can use Cloudflare's matching test secret for UI tests, but never change the real project's Secret Key to a test secret.

## Loading and retry

Both forms share a single official script load. Script errors/timeouts offer **Retry verification**. Expired tokens are cleared and the widget resets. Widget failures clear the token and remove the failed widget; Retry creates a fresh one. Switching modes, failed auth and closing the modal clear tokens and remove obsolete widgets. No page reload is used. Production with a missing key shows a generic unavailable message and stays locked.

If a CSP is configured outside the repository, allow `https://challenges.cloudflare.com` in `script-src` and `frame-src`; add that exact origin to `connect-src` only if the policy blocks required Cloudflare connections. Do not add unrestricted wildcards or weaken other directives.

## Verification checklist after manual configuration

- Sign in: email, password, visible dark widget, no Confirm password. Submit unlocks after verification.
- Signup: retains Confirm password and validates matching passwords. Test with a new account and follow its confirmation link.
- Use an existing account to check the normal sign-in redirect and session persistence.
- Wrong password or failed signup: inline error, token cleared, fresh verification required. CAPTCHA rejection has its own message.
- Expiry: submit becomes disabled; a new token is required. Switch modes and close/reopen: one widget per form, one shared script. The homepage inline form is a separate form and legitimately has its own widget.
- Block the Cloudflare script in browser devtools, open the form, then unblock and press Retry verification. The form must recover without a page reload.
- Forgot password: verify, request the email and follow its secure link. The reset-password form retains its own confirmation and recovery session.
- Check desktop/mobile and browser-tab switching. Do not print tokens, passwords or secrets while testing.

Automated loader checks: `node --test scripts/turnstile.test.mjs`.

References: https://developers.cloudflare.com/turnstile/troubleshooting/testing/ and https://supabase.com/docs/guides/auth/auth-captcha
