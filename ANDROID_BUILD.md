# Android App Build Notes

This project uses Capacitor to wrap the existing `netlify-public` static app into an Android app.

## What Works On Windows

Android development can be done on Windows with Android Studio.

After changing web app files, run:

```powershell
npm run check
npm run android:sync
```

This updates:

```text
android/app/src/main/assets/public
```

## Required Tools

Install:

- Node.js LTS
- Git
- Android Studio
- Android SDK, installed through Android Studio

Check:

```powershell
node -v
npm -v
git --version
```

## First Setup

```powershell
npm install
npm run check
npm run android:sync
```

## Supabase Config

The real Supabase config is not committed to GitHub.

On a fresh machine, create:

```powershell
Copy-Item shared\supabase-config.example.js shared\supabase-config.js
Copy-Item netlify-public\shared\supabase-config.example.js netlify-public\shared\supabase-config.js
```

Then fill in the real Supabase URL and anon key in:

```text
shared/supabase-config.js
netlify-public/shared/supabase-config.js
```

After editing config, run:

```powershell
npm run android:sync
```

## Open Android Studio

```powershell
npm run android:open
```

If this does not open automatically, manually open:

```text
android
```

in Android Studio.

## Run On Emulator

1. Open Android Studio.
2. Let Gradle sync finish.
3. Create or select an Android Emulator.
4. Press Run.
5. Test login with `mark`, `carey`, and `william`.

## Build APK For Manual Sharing

In Android Studio:

1. `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. Wait for build to finish.
3. Click `locate`.
4. Send the generated `.apk` file for manual install.

The teacher's phone may need:

```text
Allow install unknown apps
```

## Build AAB For Google Play

For Play Store release:

1. `Build > Generate Signed Bundle / APK`
2. Choose `Android App Bundle`
3. Create or select a signing key
4. Build release `.aab`
5. Upload to Google Play Console

## Every Update

After changing the web app:

```powershell
npm run check
npm run android:sync
```

Then rebuild from Android Studio.
