# iOS App Build Notes

This project uses Capacitor to wrap the existing `netlify-public` static app into an iOS app.

## What Works On Windows

Run these commands after changing web app files:

```powershell
npm run check
npm run ios:sync
```

This updates:

```text
ios/App/App/public
```

## What Requires macOS + Xcode

iOS simulator builds, real-device builds, `.ipa` export, and App Store/TestFlight upload require:

- macOS
- Xcode
- Apple Developer account for real-device signing or TestFlight

On a Mac:

```bash
npm install
npm run ios:sync
npm run ios:open
```

Then in Xcode:

1. Open the `App` target.
2. Set the signing team.
3. Confirm bundle identifier: `com.cramschool.management`.
4. Run on an iPhone simulator first.
5. For sharing with teachers, use `Product > Archive`, then distribute by TestFlight or an exported signed `.ipa`.

## Useful Commands

```powershell
npm run ios:copy
npm run ios:sync
npm run ios:open
```

`ios:open` only works on macOS with Xcode installed.
