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

## Mac 操作流程

### A. 在 Windows 先確認

目前已經完成：

```text
GitHub repo: https://github.com/chenlianghau-sketch/app-project
iOS project folder: ios/
Capacitor config: capacitor.config.json
```

如果 Windows 端之後又改了網頁功能，先跑：

```powershell
npm run check
npm run ios:sync
git add .
git commit -m "Update app before iOS build"
git push origin master
```

### B. 到 Mac 後安裝工具

1. 安裝 Xcode。
2. 打開 Xcode 一次，讓它完成初始設定。
3. 安裝 Node.js LTS。
4. 安裝 Git，如果 Mac 尚未安裝。

檢查：

```bash
node -v
npm -v
git --version
xcodebuild -version
```

### C. 在 Mac 下載專案

```bash
cd ~/Desktop
git clone https://github.com/chenlianghau-sketch/app-project.git
cd app-project
npm install
```

### D. 加回 Supabase 設定

因為真正的 Supabase key 不會 commit 到 GitHub，所以 Mac 端要手動建立：

```bash
cp shared/supabase-config.example.js shared/supabase-config.js
cp netlify-public/shared/supabase-config.example.js netlify-public/shared/supabase-config.js
```

然後打開這兩個檔案，把 Supabase URL 與 anon key 填成正式資料庫的值：

```text
shared/supabase-config.js
netlify-public/shared/supabase-config.js
```

### E. 同步到 iOS 專案

```bash
npm run check
npm run ios:sync
```

### F. 用 Xcode 開啟

```bash
npm run ios:open
```

如果 `ios:open` 沒反應，就手動打開：

```text
ios/App/App.xcodeproj
```

### G. Xcode 設定

在 Xcode 左側選 `App` project，然後選 `App` target：

1. `Signing & Capabilities`
2. 勾選 `Automatically manage signing`
3. `Team` 選你的 Apple Developer Team
4. 確認 Bundle Identifier：

```text
com.cramschool.management
```

如果 Bundle Identifier 被 Apple 佔用，可以改成：

```text
com.yourname.cramschool.management
```

### H. 先跑模擬器

1. Xcode 上方選一台 iPhone Simulator。
2. 按 Run。
3. 確認登入頁可開啟。
4. 用 `mark`、`carey`、`william` 測登入與同步。

### I. 給老師測試

最正式建議用 TestFlight：

1. Apple Developer 帳號登入 Xcode。
2. Xcode 選 `Any iOS Device`。
3. `Product > Archive`
4. Archive 完成後選 `Distribute App`
5. 上傳 App Store Connect
6. 在 TestFlight 加老師 email。

如果只是自己手機測試，也可以用 Xcode 直接接 iPhone Run，但老師的手機通常還是 TestFlight 最方便。

### J. 每次更新 APP

Windows 或 Mac 修改功能後：

```bash
npm run check
npm run ios:sync
```

然後在 Xcode 重新 Run 或重新 Archive。
