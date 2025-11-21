---
sidebar_position: 4
---

# Packaging

How to produce a distributable build and prepare it for submission to the Chrome Web Store (or other MV3-compatible stores).

## 1. Prepare the Production Build

Run the production build script to generate optimized assets in `dist/`.

```bash
pnpm build:prod
```

Production build characteristics:
- Minified JavaScript & CSS
- Deterministic filenames (no hashes) for manifest references
- Manifest version automatically injected from `package.json`
- Icons, locales, and assets copied to the output directory

Verify the build folder looks like:
```
dist/
├── manifest.json
├── popup.html
├── options.html
├── popup.{js,css}
├── options.{js,css}
├── content.{js,css}
├── static/js/background.js
├── icons/
└── _locales/
```

## 2. Validate the Build Locally

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory
4. Exercise key flows:
   - Popup interactions
   - Options page updates
   - Content script injection
   - Background alarms and messaging
5. Inspect the console for errors

## 3. Run Automated Checks

Before packaging, ensure the project passes formatting, tests, and type checks.

```bash
pnpm lint
pnpm test
```

(Optional) Run coverage:
```bash
pnpm test:cov
```

## 4. Update Version & Changelog

1. Bump `version` in `package.json` (semver)
2. The build pipeline copies this value into `dist/manifest.json`
3. Update `CHANGELOG.md` or release notes document (if applicable)

## 5. Create the ZIP Archive

Use the `dist/` folder contents to generate a ZIP file.

```bash
cd dist
zip -r ../chrome-extension-starter-v1.4.0.zip .
cd ..
```

Guidelines:
- Archive the files inside `dist/`, not the folder itself (Chrome expects files at root of zip)
- Avoid OS metadata files (e.g., `.DS_Store`)

## 6. Manual Manifest Review

Open `dist/manifest.json` and verify:
- `manifest_version` is `3`
- `version` matches `package.json`
- `name` and `description` point to localized strings (`__MSG_*__`)
- `background.service_worker` matches build output (`static/js/background.js`)
- Permissions list is minimal and justified

## 7. Prepare Store Assets

For Chrome Web Store submission you need:
- 16x16, 48x48, 128x128 icons (already under `public/icons/`)
- Screenshots (1280x800 recommended)
- Promotional tile (optional)
- Detailed description & feature list
- Privacy policy (if extension collects/stores personal data)

## 8. Submit to Chrome Web Store

1. Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Create a new item or update an existing one
3. Upload the `.zip` file created earlier
4. Fill in metadata (description, screenshots, category)
5. Specify languages supported (matching `_locales`)
6. Provide release notes
7. Submit for review

### Tips
- Keep permission descriptions clear during submission
- Highlight Manifest V3 compliance
- Mention key technologies (TypeScript, Preact)

## 9. Edge Add-ons (Optional)

Microsoft Edge supports MV3 packages.

1. Go to [Edge Add-ons portal](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)
2. Upload the same `dist` zip
3. Adjust descriptions/screenshots as needed
4. Submit for Edge review

## 10. Post-Release Checklist

- Tag the release in Git (`git tag v1.4.0 && git push origin v1.4.0`)
- Publish GitHub release notes
- Monitor store feedback and crash reports
- Schedule next iteration (bugfixes, minor updates)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Manifest is invalid" | Ensure `dist/manifest.json` is valid JSON and references existing files |
| "Could not load background script" | Confirm background path matches `static/js/background.js` |
| "Extension is corrupted" after loading | Rebuild, ensure no absolute paths or symlinks remain |
| Store rejection for permissions | Trim unused permissions and explain required ones in submission |

## Automation Ideas

- Add an npm script `pnpm package` that runs build + zip automatically
- Use GitHub Actions to attach the `dist.zip` artifact to releases
- Validate manifest via `chrome-extension-manifest-validator` (community tool) before submission
