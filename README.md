# ViralVault — live admin publishing (GitHub Pages + Supabase)

A WorldStar-inspired (not affiliated) viral video website for **YouTube, Reddit, Facebook, and TikTok links**. Embedded playback uses the platforms' players, subject to platform permissions.

## What's new in v2

- **`admin.html`**: secure owner login and direct publishing, editing, deleting, starring/featuring, and draft management.
- **Supabase database**: published videos are visible to everyone without GitHub commits. Most changes appear when a viewer refreshes the site.
- **Row-Level Security (RLS)**: visitors can only read published videos; only explicitly authorized admin accounts can write.
- **GitHub Pages** continues to host the front end free of a dedicated web server.
- Optional visitor link submissions via Formspree (review only, never auto-publish).

> **Before you configure Supabase, the website remains in legacy JSON demo mode** (`data/videos.json`). The live publishing feature requires completing the setup below.

## Step 1 — Upload new files to your existing GitHub repo

1. Open `https://github.com/kingh3nry187/viralvault` or your repository URL.
2. Extract this ZIP file on your computer. Upload the **contents** of the `viralvault-github` folder (not the parent folder) into the root of your repository, preserving subfolders.
3. Replace the original matching files. Include the new files `admin.html`, `assets/admin.js`, `assets/admin.css`, and `supabase/schema.sql`.
4. Commit the changes to `main`.
5. In GitHub **Settings → Pages**, select **Deploy from GitHub Actions** if not already selected. The included workflow in `.github/workflows/deploy.yml` will publish the site.

## Step 2 — Create a Supabase project

1. Go to https://supabase.com/ and create a project. The free tier may have limits or pauses; check their current plan details.
2. Open **SQL Editor → New query**. Copy all of `supabase/schema.sql` into the editor and run it **once**.
3. Open **Authentication → Users**. Create your owner user with an email and strong password. If the dashboard offers an "Auto Confirm" option for this owner user, use it appropriately, or complete email verification.
4. **IMPORTANT — grant the owner account admin privileges.** In Supabase SQL Editor, run this SQL, replacing the placeholder with the actual email for the user you just created (keep the real email in the private SQL editor only, not on GitHub):

```sql
insert into public.admin_users(user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict (user_id) do nothing;
```

The insert should affect **one** row. If it affects zero, double-check that the Auth user was created and the email matches.

5. Optional: In Authentication settings, disable public email signups if this is an owner-only system. Even if signups are enabled, other users cannot publish because they are not in `admin_users`.

## Step 3 — Connect your website (public credentials only)

1. In the Supabase dashboard, find your **Project URL** and **Publishable key** under **Project Settings → API Keys** (menu names can vary).
2. Open `assets/config.js` in your GitHub repo and click the pencil icon.
3. Set:

```js
window.VIRALVAULT_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'sb_publishable_YOUR_PUBLIC_KEY',
  formspreeEndpoint: ''
};
```

**Never enter a secret key, `service_role` key, personal access token, or password here.** The publishable/legacy anon key is meant for frontend use. The RLS policies in `supabase/schema.sql` restrict access.

4. Commit the edit and wait for GitHub Pages to deploy.

## Step 4 — Publish your first video

1. Go to **`https://kingh3nry187.github.io/viralvault/admin.html`** (substitute your username/repo if different).
2. Sign in with your Supabase Auth owner email and password.
3. Paste a **full** URL of a YouTube video, Reddit post, TikTok video, or **public** Facebook video.
4. Enter the title and category, optionally add description and check **Feature this video**.
5. Keep **Visibility = Published (live)** and click **Publish video**.
6. Open your public homepage in a new tab and refresh. The video is now public without editing GitHub files.
7. To hide a post, use **Unpublish**. To modify it, click **Edit**. To remove it permanently, click **Delete**.

**Supported URLs:**
- YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`, `youtu.be/VIDEO_ID`, Shorts.
- TikTok: complete `https://www.tiktok.com/@username/video/VIDEO_ID` link (expand shortened links first).
- Reddit: `https://www.reddit.com/r/subreddit/comments/POST_ID/...` or `redd.it/POST_ID`.
- Facebook: public `https://www.facebook.com/.../videos/VIDEO_ID`, `facebook.com/reel/VIDEO_ID`, or `facebook.com/watch/?v=VIDEO_ID`.

## Visitor submissions (optional)

Set `formspreeEndpoint` in `assets/config.js` to your **own Formspree form URL** if you want links from visitors sent to your inbox for review. Admins use `admin.html` for immediate publishing. Without Formspree, public submission form does not accept live-mode submissions.

## Data migration from old version

After Supabase is configured, the website reads the live `videos` table **instead of `data/videos.json`**. Old demo entries will no longer be shown. Re-add any videos you want to keep through the dashboard. Existing JSON data remains in the repository only as a fallback if Supabase has not been configured.

## Security notes

- The admin page HTML is publicly reachable, but actions are **protected by Supabase Auth and SQL RLS policies**. Hiding an admin link is not security.
- The admin session is stored in the browser's `sessionStorage` and is cleared when the tab session ends or you log out. Avoid publishing on untrusted devices.
- Keep Supabase's default allowed-origins/auth security settings appropriate for your deployment; use HTTPS on GitHub Pages.
- All untrusted video titles and descriptions are escaped in HTML.
- Third-party embeds can be unavailable because of privacy, region, consent, or platform restrictions. Visitors can use **Open original**.
- Do not rehost copyrighted videos without permission or imply this website is affiliated with the original platforms or WorldStarHipHop.
- A static page cannot hide a publishable Supabase key, but the RLS policies protect database writes. Never disable those policies.

## Test locally

Run `python -m http.server 8000` in this folder, then open `http://localhost:8000`. GitHub Pages HTTPS is recommended for actual deployment.

## Folder structure

```
index.html               Public video browsing
admin.html               Owner login and publishing dashboard
assets/style.css         Public theme
assets/admin.css         Dashboard styling
assets/app.js            Public video cards and embeds
assets/admin.js          Admin authentication and CRUD
assets/config.js         Public Supabase URL/key and optional Formspree endpoint
data/videos.json         Demo fallback before Supabase setup
supabase/schema.sql      Database schema and access rules
.github/workflows/       GitHub Pages deployment workflow
.nojekyll                GitHub Pages static setting
```
