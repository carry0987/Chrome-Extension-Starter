# Docusaurus-Test
This repository is an example of deploying a Docusaurus V3 website to GitHub Pages using GitHub Actions.
**Please note**: There are some difference between Docusaurus V2 and Docusaurus V3 on the "baseURL" setting.

## Configuring the GitHub repository
It uses the *new* GitHub Pages experience with GitHub Actions to deploy the website.

Enable this experience in *GitHub.com -> Repository -> Settings -> Pages -> Build and deployment -> Source* by selecting *GitHub Actions* instead of the legacy *Deploy from a branch* option.

## Configuring Docusaurus
Generate a Docusuarus website using the following command:
```bash
pnpm create docusaurus <folder-name> classic --typescript
```

Make the following changes to the `docusaurus.config.ts` configuration file:

1. Set the URL/base URL
```typescript
const config: Config = {
    // (...)
    url: `https://<github-organization-name>.github.io`,
    baseUrl = '/<repository-name>/`;
};
```

2. Set the `organizationName` and `projectName` options
```typescript
const config: Config = {
    // (...)
    organizationName: '<github-organization-name>',
    projectName: '<repository-name>',
};
```

3. Configure the blog and docs edit URLs
```typescript
const config: Config = {
    // (...)
    presets: [
    [
        '@docusaurus/preset-classic',
        {
            docs: {
                // (...)
                editUrl: `https://github.com/<github-organization-name>/<repository-name>/tree/main/`,
            },
            blog: {
                // (...)
                editUrl: `https://github.com/<github-organization-name>/<repository-name>/tree/main/`,
            },
        },
    ],
    ],
};
```

## Adding a GitHub Actions deployment workflow
Use a GitHub Actions workflow template for GitHub Pages from the [`actions/starter-workflows`](https://github.com/actions/starter-workflows) repository. Place it in `.github/workflows/<workflow-name>.yml`.

Add steps for building the website before the GitHub Pages actions are executed and specify the `path` to the `actions/upload-pages-artifact`:

```yaml
# (...)
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
      # 👇 Build steps
      - uses: pnpm/action-setup@v4
        with:
          version: latest
      - name: Set up Node.js
        uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - name: Install dependencies
        run: pnpm install --frozen-lockfile --non-interactive
      - name: Build
        run: pnpm build
      # 👆 Build steps
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          # 👇 Specify build output path
          path: build
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
