# ViralVault — GitHub Pages viral-video website

An original, dark-themed, WorldStar-inspired **manual video curation** website built with plain HTML, CSS, and JavaScript. No framework, build step, database, API key, or server needed for browsing.

## Features

- Responsive homepage with featured video cards and sidebar
- YouTube, TikTok, Reddit, and public Facebook video embeds
- Video detail pages, category filters, title search, latest / top picks
- Manual link submission, local management and downloadable JSON export
- Optional visitor-submission inbox via Formspree
- GitHub Pages deployment workflow already included

## Publish to GitHub Pages

1. Create a GitHub account at https://github.com/signup if needed.
2. Create a **new public repository** named `viralvault` (or any name).
3. Upload the contents of this folder to the **root** of the repository. Include the `.github` folder and `.nojekyll`. You can do this using **Add file → Upload files** on GitHub, or clone the repository and copy these files.
4. Go to **Settings → Pages** and select **Source: GitHub Actions**.
5. Push/commit to `main`; the included `.github/workflows/deploy.yml` publishes the site. Your site will be at `https://YOUR-USERNAME.github.io/viralvault/` (replace placeholders).

You can test locally by running `python -m http.server 8000` from the folder, then opening `http://localhost:8000`. Opening `index.html` directly as `file://` prevents the browser from loading `data/videos.json`.

## Publish videos (manual editorial workflow)

1. Open the live site and select **Submit Video**.
2. Paste a supported video permalink, enter an accurate title, and choose a category.
3. With the default configuration, the video is saved in **your current browser only** (localStorage). **Visitors cannot see it yet.**
4. Open **Manage videos** and click **Download videos.json**.
5. On GitHub, replace **`data/videos.json`** with the downloaded file and commit the change.
6. GitHub Actions redeploys the site. Now everyone sees the new video.

**Important:** `/manage` is NOT an authenticated admin area. It is a local convenience editor. Published content is controlled by GitHub write access; don't store secrets in this repository.

To remove a previously published video, delete its object from `data/videos.json` on GitHub (or edit and upload a corrected JSON file). To feature videos, set `"featured": true` on the desired objects.

## Accept submissions from other site visitors (optional)

A static GitHub Pages site cannot securely collect submissions from visitors on its own. You can use a third-party form inbox:

1. Create a form at https://formspree.io/ (service pricing/limits may change).
2. In `assets/config.js`, set:

```js
window.VIRALVAULT_CONFIG = { formspreeEndpoint: 'https://formspree.io/f/YOUR_FORM_ID' };
```

3. Commit. Visitors' submissions will go to the configured Formspree form inbox **for your review**, instead of appearing live on the site. You then add approved submissions to `data/videos.json` (or use the owner-side form with Formspree disabled). No automatic publishing is included. Test the form after setup.

## Accepted video URLs

- YouTube: `youtube.com/watch?v=ID`, `youtube.com/shorts/ID`, `youtu.be/ID`
- TikTok: full `tiktok.com/@username/video/VIDEO_ID` URL (short redirect URLs must be expanded first)
- Reddit: `reddit.com/r/subreddit/comments/POST_ID/...` permalink (or `redd.it/POST_ID`)
- Facebook: public `facebook.com/.../videos/VIDEO_ID`, `facebook.com/reel/VIDEO_ID`, or `facebook.com/watch/?v=VIDEO_ID`. Use full URLs, not `fb.watch` redirects.

**Playback caveats:** Content must be public and embeddable. YouTube may disable embedding; Facebook videos may require public-page access; Reddit embed presentation can vary and some posts may refuse iframe playback; TikTok embeds may be blocked by creators, region, or browsers. Every detail page includes **Open original** so viewers can still visit the platform when the player fails. This website does not download, rehost, or strip attribution from any videos.

## Customize

- Site title / brand: `index.html`
- Colors, layout, responsiveness: `assets/style.css`
- Categories / sorting / URL parsing: `assets/app.js`
- Curated video entries: `data/videos.json`

Suggested starter content is sample video data. Replace it before sharing the site publicly. The "Top Picks" ranking is editorial (featured entries first), not live view counts or platform engagement statistics.

## Security and moderation

- Video URL parser accepts only secure HTTPS video links from allowlisted domains.
- Titles/descriptions are HTML-escaped. No raw user-supplied iframe markup is injected.
- Public visitor submissions should be manually moderated for copyright, privacy, harassment, sensitive imagery, and platform rules.
- Do not copy WorldStarHipHop branding, logos, or proprietary assets.
- Never commit API keys or passwords into GitHub Pages: all frontend source is public.

## Limitations

- No real-time trending analytics, view counts, account system, full moderation backend, or automatic discovery.
- No global visitor submissions without configuring Formspree or another backend.
- Locally added entries are device/browser-specific until exported and committed.
- Search covers your curated entries, not entire YouTube / Reddit / TikTok / Facebook catalogs.

MIT-style permission for original scaffold code: use and modify freely; third-party platform content and trademarks remain owned by their respective owners.
