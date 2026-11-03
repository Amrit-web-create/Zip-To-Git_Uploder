# Zip2Git

**Zip2Git** is a free, mobile-first web app (PWA) that lets you manage GitHub projects straight from your phone. No server, no account, no installation of Git.

**Zip2Git** एक मोबाइल-फ्रेंडली वेब ऐप (PWA) है जिससे तुम सीधे फ़ोन से GitHub प्रोजेक्ट संभाल सकते हो। कोई सर्वर नहीं, कोई अकाउंट नहीं, Git इंस्टॉल करने की ज़रूरत नहीं।

---

## What it does / क्या करता है

| Feature | Details |
|---|---|
| **ZIP → GitHub** | Pick a ZIP, files or a folder and push them to a new or existing repository in one tap. 1000+ files supported. |
| **Repo manager** | Browse your repo, read, edit, rename, delete and download files. Rename or delete folders. Add new files into any folder. All changes are collected and pushed together in one commit. |
| **Build APK + AAB** | Adds a ready-made GitHub Actions workflow that builds an Android APK and App Bundle (AAB) and publishes them as plain downloadable files. |
| **Website (GitHub Pages)** | Deploys your site to GitHub Pages with one workflow. |
| **Clear build errors** | If a build fails, the app shows the failed step, the error lines and the likely cause in English and Hindi. The same summary appears on the GitHub run page. |
| **Two languages** | English and हिंदी, switch anytime. |
| **Offline screen** | A friendly screen appears when there is no internet. |

---

## Security / सुरक्षा

Your GitHub token is the key to your account, so Zip2Git is built to protect it:

- **Memory only.** The token is kept in memory, never in cookies, and is never displayed again after you enter it.
- **Optional encrypted save.** If you choose to save it, it is encrypted with **your password** (AES-256-GCM, PBKDF2 with 600,000 rounds). Without the password it cannot be read. After 5 wrong passwords it is erased.
- **Locked by default.** The Repo and Build tabs stay locked until you unlock them with your password.
- **Auto-lock.** The app locks after 5 minutes idle, when it goes to the background, or when you leave the page.
- **Strict network rules.** A Content Security Policy blocks inline scripts and allows connections only to GitHub. Nothing is sent to any other server.
- **No backend.** There is no Zip2Git server, so there is nowhere for your token to be stored or leaked.
- **Safe display.** File names and paths are validated and shown as plain text.
- **Open source is fine.** The code is public, but the token never lives in the code. It exists only on your own device.

**Tip:** use a fine-grained token limited to a single repository for the best safety.

---

## Token permissions / टोकन परमिशन

- `repo` and `workflow` for pushing files and running builds.
- `delete_repo` only if you want to delete a whole repository from the app.

---

## Builds / बिल्ड

- **Android APK + AAB** works for a web app (via Capacitor) or a native Android project that contains `gradlew`. Results appear in the repo's **Releases** as plain files.
- APK and AAB are debug-signed, which is fine for testing. Publishing on Play Store needs your own release signing.
- **Website** deploys your `index.html` (or the `dist` / `build` / `out` folder of an npm project) to GitHub Pages. Pages must be enabled for the repo.

---

## Will adding this README redeploy the site? / क्या README जोड़ने से दोबारा डिप्लॉय होगा?

- The **Website workflow created by this app ignores `.md` files**, so adding or editing a README does **not** trigger a new deployment.
- The **APK/AAB workflow** only runs when you press Run, so a README never starts a build.
- If your repo uses an older workflow or classic "deploy from branch" Pages, any push (including a README) can redeploy. This is harmless: the site simply updates with the same content.

---

Copyright © Amrit Bharadwaj. All Rights Reserved.
