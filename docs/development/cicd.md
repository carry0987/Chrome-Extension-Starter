---
sidebar_position: 5
---

# CI/CD

Automating builds, tests, and releases for Chrome Extension Starter using GitHub Actions.

## Goals

- Run linting, tests, and type checks on every push/PR
- Produce build artifacts for inspection
- Automate release packaging and tagging
- Optionally publish store-ready ZIPs as part of release workflow

## Recommended Workflow

1. **Pull Request Checks** — Fast feedback on branches
2. **Main Branch Pipeline** — Builds production artifacts after merge
3. **Release Workflow** — Tags release + uploads packaged ZIP

---

## 1. Continuous Integration (CI)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test

      - name: Build (production)
        run: pnpm build:prod

      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist
```

**Notes**
- `pnpm/action-setup` ensures the same package manager locally and in CI
- `actions/upload-artifact` keeps the compiled `dist` folder for download & debugging

---

## 2. Release Automation

Create `.github/workflows/release.yml` to package artifacts when a tag is pushed:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  package:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm build:prod

      - name: Create zip
        run: |
          cd dist
          zip -r ../chrome-extension-starter-${{ github.ref_name }}.zip .

      - name: Upload release asset
        uses: actions/upload-artifact@v4
        with:
          name: release-zip
          path: chrome-extension-starter-${{ github.ref_name }}.zip
```

Enhance with GitHub Releases:

```yaml
      - name: Create GitHub release
        uses: softprops/action-gh-release@v2
        with:
          files: chrome-extension-starter-${{ github.ref_name }}.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 3. Optional: Store Publishing Hooks

Automate Chrome Web Store uploads using community actions (requires API keys):

```yaml
      - name: Publish to Chrome Web Store
        uses: trmcnvn/chrome-extension-upload-action@v2
        with:
          file: chrome-extension-starter-${{ github.ref_name }}.zip
          extension-id: ${{ secrets.CHROME_EXTENSION_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
```

Similarly, Edge Add-ons can be automated via `LanikSJ/edge-addon` (requires separate credentials).

---

## 4. Environment Variables & Secrets

Store secrets in GitHub repository settings:

- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- (Optional) `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, etc.

Never commit secrets to the repository.

---

## 5. Branch Protection & Status Checks

- Enable required status checks (CI workflow) before merging to `master`
- Require pull requests for `master` with at least one approval
- Optionally enforce linear history or signed commits

---

## 6. Versioning Strategy

- Use semantic versioning (`major.minor.patch`)
- Update `package.json` before tagging
- Tag releases via `git tag vX.Y.Z && git push origin vX.Y.Z`
- Release workflow responds to tags to produce artifacts automatically

---

## 7. Monitoring & Reporting

- Integrate Codecov for coverage reporting by adding a step that uploads `coverage-final.json`
- Add Slack/Teams notifications using community actions if desired
- Use GitHub Projects or Issues for release tracking

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| `pnpm install` fails due to lock mismatch | Commit updated `pnpm-lock.yaml` or run with `--frozen-lockfile=false` intentionally |
| Build step cannot find `manifest.json` | Ensure workflow runs `pnpm build:prod` at repo root |
| Uploaded ZIP missing files | Confirm `zip` command runs inside `dist/` and include all contents |
| Chrome Web Store action rejects upload | Validate credentials, ensure version is greater than last published |

---

## Next Steps

- Combine CI & Release into a single workflow with conditional jobs
- Generate changelog automatically using `release-please` or `semantic-release`
- Add E2E tests (e.g., Playwright) for popup/options flows
