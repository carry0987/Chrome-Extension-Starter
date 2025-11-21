---
sidebar_position: 1
---

# Introduction

Welcome to the **Chrome Extension Starter** documentation! This is a modern Chrome Extension template built with **TypeScript**, **Preact**, **TailwindCSS**, **RSBuild**, and **Vitest** — fully compatible with **Manifest V3**.

## Overview

Chrome Extension Starter is designed for fast development, clean architecture, and strongly typed communication between extension modules. It provides a solid foundation for building modern, production-ready Chrome extensions with best practices baked in.

## Key Features

- 🎯 **TypeScript ESNext** — Strong typing & modern syntax
- ⚡ **RSBuild** — High-performance bundler optimized for modern web extensions
- 🎨 **TailwindCSS v4** — Utility-first CSS framework for responsive design
- ⚛️ **Preact** — Lightweight React-compatible UI framework
- 🧪 **Vitest** — Fast unit testing powered by Vite
- 🔒 **Manifest V3** — Full compliance with Chrome's latest extension manifest

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS or Current)
- [pnpm](https://pnpm.io/) — Recommended package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/carry0987/Chrome-Extension-Starter.git

# Navigate to the project directory
cd Chrome-Extension-Starter

# Install dependencies
pnpm install

# Build the extension
pnpm build

# Or build and watch for changes
pnpm build:watch
```

### Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from your project

## Project Structure

```
Chrome-Extension-Starter/
├── public/              # Static assets & manifest
│   ├── manifest.json    # Extension manifest
│   ├── popup.html       # Popup page template
│   ├── options.html     # Options page template
│   ├── icons/           # Extension icons
│   └── _locales/        # i18n translations
├── src/
│   ├── background/      # Background service worker
│   ├── content/         # Content scripts
│   ├── pages/           # UI pages (popup, options)
│   └── shared/          # Shared utilities & types
├── __tests__/           # Test files
└── docs/                # Documentation
```

## What's Next?

- Learn about the [Architecture](./architecture) of the extension
- Explore [Core Modules](./core-modules/messaging) like messaging and storage
- Check out [Development Guide](./development/building) for building and testing
- See [API Reference](./api/types) for detailed type definitions

## License

MIT License - see [LICENSE](https://github.com/carry0987/Chrome-Extension-Starter/blob/master/LICENSE) for details.
