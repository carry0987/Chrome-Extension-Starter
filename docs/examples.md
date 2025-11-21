---
sidebar_position: 6
---

# Examples

Real-world examples demonstrating common Chrome extension patterns and features.

## Table of Contents

- [Basic Popup with Settings](#basic-popup-with-settings)
- [Content Script UI Injection](#content-script-ui-injection)
- [Background Task Scheduler](#background-task-scheduler)
- [Cross-Context Communication](#cross-context-communication)
- [Persistent Storage with Sync](#persistent-storage-with-sync)
- [Dynamic Content Script Injection](#dynamic-content-script-injection)
- [Context Menu Integration](#context-menu-integration)
- [Tab Management](#tab-management)

---

## Basic Popup with Settings

Create a popup that saves user preferences.

### Popup Component

```tsx showLineNumbers title="src/pages/popup/index.tsx"
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { kv } from '@/shared/lib/storage';
import { t } from '@/shared/lib/i18n';
import '@/shared/styles.css';

const Popup = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings on mount
    const loadSettings = async () => {
      const settings = await kv.get('sync', 'settings', { theme: 'light' });
      setTheme(settings.theme);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    const settings = await kv.get('sync', 'settings', {});
    await kv.set('sync', 'settings', { ...settings, theme: newTheme });
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="w-64 p-4">
      <h1 className="text-lg font-bold mb-4">{t('extName')}</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Theme</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`px-4 py-2 rounded ${
              theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
            Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`px-4 py-2 rounded ${
              theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
            Dark
          </button>
        </div>
      </div>

      <button
        onClick={() => chrome.runtime.openOptionsPage()}
        className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
        More Settings
      </button>
    </div>
  );
};

render(<Popup />, document.getElementById('root')!);
```

---

## Content Script UI Injection

Inject a floating widget into web pages.

```tsx showLineNumbers title="src/content/widget.tsx"
import { render } from 'preact';
import { useState } from 'preact/hooks';
import { mount } from '@/shared/lib/dom';
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

const FloatingWidget = () => {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      className="bg-white shadow-lg rounded-lg p-4 border border-gray-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Extension Widget</h3>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-600">Drag me around!</p>
    </div>
  );
};

// Mount widget
const container = mount('ces-widget');
render(<FloatingWidget />, container);
```

---

## Background Task Scheduler

Schedule periodic tasks using Chrome alarms.

```ts showLineNumbers title="src/background/alarms.ts"
import { logger } from '@/shared/lib/logger';
import { kv } from '@/shared/lib/storage';
import { ALARMS } from '@/shared/constants';

// Create alarms on installation
chrome.runtime.onInstalled.addListener(() => {
  // Poll every 5 minutes
  chrome.alarms.create(ALARMS.POLL, { periodInMinutes: 5 });
  
  // Daily cleanup at midnight
  chrome.alarms.create(ALARMS.DAILY_CLEANUP, {
    when: getNextMidnight(),
    periodInMinutes: 24 * 60
  });
  
  logger.info('Alarms created');
});

// Handle alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  logger.info('Alarm triggered', { name: alarm.name });

  switch (alarm.name) {
    case ALARMS.POLL:
      await pollData();
      break;
    case ALARMS.DAILY_CLEANUP:
      await dailyCleanup();
      break;
  }
});

// Poll external API
const pollData = async () => {
  try {
    const response = await fetch('https://api.example.com/updates');
    const data = await response.json();
    
    // Store latest data
    await kv.set('local', 'latestData', data);
    logger.info('Data polled successfully', data);
    
    // Notify user if needed
    if (data.hasUpdate) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'New Update Available',
        message: data.message
      });
    }
  } catch (err) {
    logger.error('Failed to poll data', err);
  }
};

// Clean up old data
const dailyCleanup = async () => {
  try {
    const allLocal = await kv.getAll('local');
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const cleaned = Object.entries(allLocal).reduce((acc, [key, value]) => {
      if (key.startsWith('cache_') && value.timestamp < cutoff) {
        // Skip old cache entries
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
    
    await kv.setAll('local', cleaned);
    logger.info('Daily cleanup completed');
  } catch (err) {
    logger.error('Failed to clean up data', err);
  }
};

// Helper to get next midnight timestamp
const getNextMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0
  );
  return midnight.getTime();
};
```

---

## Cross-Context Communication

Communicate between popup, content, and background scripts.

```ts showLineNumbers title="src/shared/constants.ts"
export enum MSG {
  CHANGE_BG = 'CHANGE_BG',
  GET_PAGE_INFO = 'GET_PAGE_INFO',
  NOTIFY_USER = 'NOTIFY_USER'
}

export const MESSAGE_SPEC = {
  [MSG.CHANGE_BG]: {
    req: {} as { color: string },
    res: {} as { ok: boolean }
  },
  [MSG.GET_PAGE_INFO]: {
    req: {} as {},
    res: {} as { title: string; url: string }
  },
  [MSG.NOTIFY_USER]: {
    req: {} as { message: string },
    res: {} as { shown: boolean }
  }
} as const;
```

```tsx showLineNumbers title="src/pages/popup/index.tsx"
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

const Popup = () => {
  const handleGetPageInfo = async () => {
    const info = await bus.sendToActive(MSG.GET_PAGE_INFO, {});
    if (info) {
      alert(`Page: ${info.title}\nURL: ${info.url}`);
    }
  };

  const handleChangeBackground = async () => {
    const result = await bus.sendToActive(MSG.CHANGE_BG, { color: '#0ea5e9' });
    if (result?.ok) {
      alert('Background changed!');
    }
  };

  return (
    <div className="p-4 space-y-2">
      <button onClick={handleGetPageInfo} className="btn-primary">
        Get Page Info
      </button>
      <button onClick={handleChangeBackground} className="btn-primary">
        Change Background
      </button>
    </div>
  );
};
```

```ts showLineNumbers title="src/content/index.tsx"
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

// Handle page info request
bus.on(MSG.GET_PAGE_INFO, () => {
  return {
    title: document.title,
    url: window.location.href
  };
});

// Handle background color change
bus.on(MSG.CHANGE_BG, (payload) => {
  document.body.style.backgroundColor = payload.color;
  return { ok: true };
});
```

```ts showLineNumbers title="src/background/runtime.ts"
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

// Handle notification request
bus.on(MSG.NOTIFY_USER, async (payload) => {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Extension Notification',
    message: payload.message
  });
  return { shown: true };
});
```

---

## Persistent Storage with Sync

Sync user preferences across Chrome instances.

```ts showLineNumbers title="src/shared/lib/settings.ts"
import { kv } from '@/shared/lib/storage';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ja' | 'zh_TW';
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  language: 'en',
  notifications: {
    enabled: true,
    sound: false
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  const stored = await kv.get('sync', 'settings');
  return { ...DEFAULT_SETTINGS, ...stored };
};

export const updateSettings = async (updates: Partial<AppSettings>): Promise<void> => {
  const current = await getSettings();
  const newSettings = { ...current, ...updates };
  await kv.set('sync', 'settings', newSettings);
};

// Listen for changes from other instances
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) {
    console.log('Settings synced from another device:', changes.settings.newValue);
    // Update UI or apply new settings
  }
});
```

**Usage**:
```tsx
const OptionsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    await updateSettings(settings);
    alert('Settings saved and synced!');
  };

  return (
    <div>
      <select
        value={settings.theme}
        onChange={(e) => setSettings({ ...settings, theme: e.target.value })}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
      </select>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

---

## Dynamic Content Script Injection

Inject content scripts programmatically into specific tabs.

```ts showLineNumbers title="src/background/injection.ts"
import { logger } from '@/shared/lib/logger';

// Inject content script into tab
export const injectContentScript = async (tabId: number): Promise<boolean> => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });

    logger.info('Content script injected', { tabId });
    return true;
  } catch (err) {
    logger.error('Failed to inject content script', err);
    return false;
  }
};

// Inject into all eligible tabs
export const injectAllTabs = async (): Promise<void> => {
  const tabs = await chrome.tabs.query({});
  
  for (const tab of tabs) {
    if (tab.id && tab.url && !isRestrictedUrl(tab.url)) {
      await injectContentScript(tab.id);
    }
  }
};

// Check if URL is restricted
const isRestrictedUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const restrictedSchemes = ['chrome', 'chrome-extension', 'edge', 'about'];
    return restrictedSchemes.includes(urlObj.protocol.replace(':', ''));
  } catch {
    return true;
  }
};

// Auto-inject on tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !isRestrictedUrl(tab.url)) {
    await injectContentScript(tabId);
  }
});
```

---

## Context Menu Integration

Add custom context menu items.

```ts showLineNumbers title="src/background/contextMenu.ts"
import { logger } from '@/shared/lib/logger';
import { bus } from '@/shared/lib/messaging';
import { MSG } from '@/shared/constants';

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'highlight-text',
    title: 'Highlight "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'change-bg-red',
    title: 'Change Background to Red',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'change-bg-blue',
    title: 'Change Background to Blue',
    contexts: ['page']
  });

  logger.info('Context menus created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case 'highlight-text':
      await bus.sendToTab(tab.id, MSG.HIGHLIGHT_TEXT, {
        text: info.selectionText || ''
      });
      break;

    case 'change-bg-red':
      await bus.sendToTab(tab.id, MSG.CHANGE_BG, { color: '#ef4444' });
      break;

    case 'change-bg-blue':
      await bus.sendToTab(tab.id, MSG.CHANGE_BG, { color: '#3b82f6' });
      break;
  }
});
```

---

## Tab Management

Manage tabs programmatically.

```ts showLineNumbers title="src/background/tabs.ts"
import { logger } from '@/shared/lib/logger';

// Get active tab
export const getActiveTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
};

// Open new tab
export const openTab = async (url: string): Promise<chrome.tabs.Tab> => {
  return chrome.tabs.create({ url });
};

// Close tabs matching pattern
export const closeTabsByUrl = async (pattern: string): Promise<void> => {
  const tabs = await chrome.tabs.query({});
  const toClose = tabs.filter(tab => tab.url?.includes(pattern));
  
  for (const tab of toClose) {
    if (tab.id) {
      await chrome.tabs.remove(tab.id);
    }
  }
  
  logger.info('Closed tabs', { count: toClose.length, pattern });
};

// Duplicate tab
export const duplicateTab = async (tabId: number): Promise<chrome.tabs.Tab> => {
  return chrome.tabs.duplicate(tabId);
};

// Move tab to new window
export const moveTabToNewWindow = async (tabId: number): Promise<void> => {
  await chrome.windows.create({ tabId });
};
```

---

## Next Steps

- Explore [Core Modules](./core-modules/messaging) for more utilities
- Check [API Reference](./api/types) for type definitions
- Read [Development Guide](./development/building) for workflow tips
