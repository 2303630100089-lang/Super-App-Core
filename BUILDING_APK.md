# 📱 Building the SuperApp Android APK

SuperApp uses **Capacitor** to wrap the Next.js web app into a native Android APK.

---

## Prerequisites

Before you begin, install the following on your machine:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net |
| Android Studio | Latest | https://developer.android.com/studio |
| Android SDK | API 34+ | Via Android Studio |

Set these environment variables after installing Android Studio:

```bash
export ANDROID_HOME=$HOME/Android/Sdk          # macOS/Linux
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

On Windows (PowerShell):
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
```

---

## Step-by-Step: Build the APK

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure the backend URL

Edit `frontend/.env.local` and set your API Gateway URL:

```env
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:5050/api
```

> ⚠️ The Android emulator cannot use `localhost`. Use your machine's IP address
> (e.g., `192.168.1.100`) or deploy the backend to a public URL.

### 3. Build and export the Next.js app

```bash
npm run build:export
```

This runs `CAPACITOR_BUILD=1 next build`, which creates a static export in the `out/` folder.

> **Windows users:** run `set CAPACITOR_BUILD=1 && next build` instead.

### 4. Add the Android platform (first time only)

```bash
npx cap add android
```

### 5. Sync web assets to Android

```bash
npm run cap:sync
# or: npx cap sync android
```

### 6. Open in Android Studio

```bash
npm run cap:open:android
# or: npx cap open android
```

### 7. Build the APK in Android Studio

1. In Android Studio, wait for Gradle sync to finish.
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. The APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Building a Release APK (for Google Play / distribution)

### Generate a signing keystore

```bash
keytool -genkey -v -keystore superapp-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias superapp-key
```

### Add signing config to `android/app/build.gradle`

```groovy
android {
    signingConfigs {
        release {
            storeFile file("superapp-release.jks")
            storePassword "YOUR_STORE_PASSWORD"
            keyAlias "superapp-key"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Build the signed APK

In Android Studio: **Build → Generate Signed Bundle / APK → APK → Next → Release**

Or via command line:
```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## Install the APK on your phone

### Method 1: USB (recommended for testing)

1. Enable "Developer Options" on your Android phone.
2. Enable "USB Debugging".
3. Connect via USB and run:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 2: Share the APK file directly

1. Copy `app-debug.apk` to your phone via USB, Google Drive, or WhatsApp.
2. Tap the file on your phone and allow "Install from unknown sources" when prompted.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ANDROID_HOME not set` | Set the environment variable as shown above |
| Gradle sync fails | File → Invalidate Caches → Restart |
| `localhost` not reachable | Use your machine's local IP address |
| White screen on launch | Check that `npm run build:export` completed successfully |
| SSL/HTTPS errors | Ensure `allowMixedContent: true` in `capacitor.config.ts` for dev |

---

## Quick Reference

```bash
# Full APK build pipeline (run from /frontend)
npm install
npm run build:export    # CAPACITOR_BUILD=1 next build → outputs to /out
npx cap sync android    # Sync to Android project
npx cap open android    # Open Android Studio to build APK
```
