# Forsprang Android app (native WebView)

The Android app for Forsprang (Min side on www.arbeidmatch.no). Package
`no.arbeidmatch.forsprang`. Since 1.0.1 (13 Nov 2026) it is a native app with
its own WebView instead of a Trusted Web Activity: in a TWA the window belongs
to Chrome, and the owner's rule is that the app refuses screenshots.

What the app does, all in `MainActivity.java`:

- **No screenshots or screen recording** (`FLAG_SECURE`), blank recent-apps preview.
- **No agent reading the screen**: on Android 14+ the WebView is marked
  accessibility-data-sensitive (only real tools for blind users, `isAccessibilityTool`,
  can read it); on Android 12+ an enabled accessibility service that is not such a
  tool hides the projects until it is switched off.
- **No control from a computer**: with USB or wireless debugging on, the projects
  are hidden ("Slå av USB-feilsøking").
- **Nothing copied off the phone**: no backup or device transfer, no WebView
  debugging, no file access from the page, cleartext refused, user-installed
  certificate authorities not trusted (a proxy cannot read the traffic).
- Only `www.arbeidmatch.no` (and `arbeidmatch.no`) opens inside; everything else
  goes to the phone's own apps. App links: `/min-side` and `/prosjekter/inn` only.
- Passkeys inside the app via `androidx.webkit` WebAuthentication support; needs
  the `get_login_creds` relation in `public/.well-known/assetlinks.json`.
- The user agent ends with `ForsprangApp/<version>`; Min side uses it to never
  offer the install prompt inside the app.

## Build (any machine with JDK 17 x64 and the Android SDK)

```bash
cd forsprang-android
export JAVA_HOME=<jdk 17 x64> ANDROID_HOME=<android sdk>
./gradlew --no-daemon bundleRelease      # app/build/outputs/bundle/release/app-release.aab, unsigned
```

Before each release raise `versionCode`/`versionName` in `app/build.gradle` and
`BuildConfigVersion.NAME`.

## Signing

The upload key lives only on the office desktop (am-01):
`C:\Users\post\.forsprang-signing\upload.keystore`, alias `upload`, passwords sealed
with DPAPI LocalMachine in `signing.env.dpapi` (`unseal-signing.ps1` prints them;
never save or echo them). Sign there with jarsigner (SHA256withRSA). Play App Signing
holds the app signing key; this is only the upload key (SHA-256
`D5:EF:29:F5:...:9B:43`), and Play Console can reset it if lost.

## Digital Asset Links

`https://www.arbeidmatch.no/.well-known/assetlinks.json` must list the package with the
SHA-256 of both the upload key and the Play App Signing key (Play Console, App
integrity), or the login links open in the browser instead of the app.
