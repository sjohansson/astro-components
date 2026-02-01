# Theme System Examples

This document provides examples of using the enhanced theme system.

## Example 1: Basic Theme Controller

```astro
---
import { ThemeController } from '@sjohansson/astro-theme-toggle';
---

<header>
  <nav>
    <a href="/">Home</a>
    <ThemeController />
  </nav>
</header>
```

## Example 2: Inline Theme Selector with Labels

```astro
---
import { ThemeController } from '@sjohansson/astro-theme-toggle';
---

<div class="theme-selector">
  <span>Choose your theme:</span>
  <ThemeController 
    position="inline"
    showLabels={true}
  />
</div>
```

## Example 3: Using CSS Custom Properties

```astro
---
import { ThemeController } from '@sjohansson/astro-theme-toggle';
---

<ThemeController />

<div class="card">
  <h2>Themed Card</h2>
  <p>This card uses theme CSS custom properties</p>
  <button class="btn-primary">Click me</button>
</div>

<style>
  .card {
    background: var(--theme-bg-primary);
    color: var(--theme-fg-primary);
    border: 1px solid var(--theme-border-default);
    border-radius: 0.5rem;
    padding: 1.5rem;
  }
  
  .card h2 {
    color: var(--theme-fg-primary);
    margin-bottom: 0.5rem;
  }
  
  .card p {
    color: var(--theme-fg-secondary);
  }
  
  .btn-primary {
    background: var(--theme-interactive-default);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary:hover {
    background: var(--theme-interactive-hover);
  }
  
  .btn-primary:active {
    background: var(--theme-interactive-active);
  }
</style>
```

## Example 4: Theme Preview Documentation

```astro
---
import { ThemeController, ThemePreview } from '@sjohansson/astro-theme-toggle';
---

<div class="documentation">
  <ThemeController />
  
  <h1>Theme Documentation</h1>
  <p>Below you can see all available color tokens for each theme:</p>
  
  <ThemePreview />
</div>
```

## Example 5: Custom Theme Configuration

```astro
---
import { ThemeController, type ThemeConfig } from '@sjohansson/astro-theme-toggle';

const brandThemes: ThemeConfig[] = [
  {
    mode: "light",
    label: "Brand Light",
    description: "Our branded light theme",
    colors: {
      background: {
        primary: "#ffffff",
        secondary: "#f8f8ff",
        tertiary: "#e8e8f5",
      },
      foreground: {
        primary: "#1a1a2e",
        secondary: "#2e2e4e",
        tertiary: "#5e5e7e",
      },
      border: {
        default: "#d0d0e0",
        hover: "#a0a0c0",
        focus: "#6366f1",
      },
      interactive: {
        default: "#6366f1",
        hover: "#4f46e5",
        active: "#4338ca",
        disabled: "#9ca3af",
      },
      semantic: {
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
    },
  },
  {
    mode: "dark",
    label: "Brand Dark",
    description: "Our branded dark theme",
    colors: {
      background: {
        primary: "#1a1a2e",
        secondary: "#25253e",
        tertiary: "#30304e",
      },
      foreground: {
        primary: "#f8f8ff",
        secondary: "#d8d8e8",
        tertiary: "#a8a8c8",
      },
      border: {
        default: "#40405e",
        hover: "#60607e",
        focus: "#818cf8",
      },
      interactive: {
        default: "#818cf8",
        hover: "#a5b4fc",
        active: "#c7d2fe",
        disabled: "#4b5563",
      },
      semantic: {
        success: "#34d399",
        warning: "#fbbf24",
        error: "#f87171",
        info: "#60a5fa",
      },
    },
  },
  {
    mode: "high-contrast-light",
    label: "Accessible Light",
    description: "High contrast for accessibility",
    colors: {
      background: {
        primary: "#ffffff",
        secondary: "#f0f0f0",
        tertiary: "#e0e0e0",
      },
      foreground: {
        primary: "#000000",
        secondary: "#1a1a1a",
        tertiary: "#333333",
      },
      border: {
        default: "#000000",
        hover: "#333333",
        focus: "#0000ff",
      },
      interactive: {
        default: "#0000ff",
        hover: "#0000cc",
        active: "#000099",
        disabled: "#666666",
      },
      semantic: {
        success: "#006600",
        warning: "#ff8800",
        error: "#cc0000",
        info: "#0066cc",
      },
    },
  },
  {
    mode: "high-contrast-dark",
    label: "Accessible Dark",
    description: "High contrast dark for accessibility",
    colors: {
      background: {
        primary: "#000000",
        secondary: "#1a1a1a",
        tertiary: "#2a2a2a",
      },
      foreground: {
        primary: "#ffffff",
        secondary: "#f0f0f0",
        tertiary: "#d0d0d0",
      },
      border: {
        default: "#ffffff",
        hover: "#d0d0d0",
        focus: "#ffff00",
      },
      interactive: {
        default: "#ffff00",
        hover: "#ffff66",
        active: "#ffff99",
        disabled: "#666666",
      },
      semantic: {
        success: "#00ff00",
        warning: "#ffaa00",
        error: "#ff0000",
        info: "#00ffff",
      },
    },
  },
];
---

<ThemeController themes={brandThemes} />

<div class="content">
  <h1>Custom Branded Themes</h1>
  <p>This site uses custom theme configurations that match our brand.</p>
</div>
```

## Example 6: Semantic Color Usage

```astro
---
import { ThemeController } from '@sjohansson/astro-theme-toggle';
---

<ThemeController />

<div class="notifications">
  <div class="notification success">
    <span class="icon">✓</span>
    <span>Operation completed successfully!</span>
  </div>
  
  <div class="notification warning">
    <span class="icon">⚠</span>
    <span>Please review your changes before proceeding.</span>
  </div>
  
  <div class="notification error">
    <span class="icon">✕</span>
    <span>An error occurred. Please try again.</span>
  </div>
  
  <div class="notification info">
    <span class="icon">ℹ</span>
    <span>Did you know? You can customize your theme!</span>
  </div>
</div>

<style>
  .notification {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
    border: 1px solid var(--theme-border-default);
  }
  
  .notification.success {
    background: color-mix(in srgb, var(--theme-success) 10%, var(--theme-bg-primary));
    color: var(--theme-success);
    border-color: var(--theme-success);
  }
  
  .notification.warning {
    background: color-mix(in srgb, var(--theme-warning) 10%, var(--theme-bg-primary));
    color: var(--theme-warning);
    border-color: var(--theme-warning);
  }
  
  .notification.error {
    background: color-mix(in srgb, var(--theme-error) 10%, var(--theme-bg-primary));
    color: var(--theme-error);
    border-color: var(--theme-error);
  }
  
  .notification.info {
    background: color-mix(in srgb, var(--theme-info) 10%, var(--theme-bg-primary));
    color: var(--theme-info);
    border-color: var(--theme-info);
  }
  
  .notification .icon {
    font-size: 1.25rem;
    font-weight: bold;
  }
</style>
```

## Example 7: Responsive Layout with Themes

```astro
---
import { ThemeController } from '@sjohansson/astro-theme-toggle';
---

<div class="layout">
  <header class="header">
    <h1>My Application</h1>
    <ThemeController class="header-theme-controller" />
  </header>
  
  <aside class="sidebar">
    <nav>
      <a href="/dashboard">Dashboard</a>
      <a href="/settings">Settings</a>
      <a href="/profile">Profile</a>
    </nav>
  </aside>
  
  <main class="main">
    <article class="card">
      <h2>Welcome</h2>
      <p>This layout automatically adapts to your chosen theme.</p>
    </article>
  </main>
  
  <footer class="footer">
    <p>&copy; 2026 My Application</p>
  </footer>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: grid;
    grid-template-areas:
      "header header"
      "sidebar main"
      "footer footer";
    grid-template-columns: 250px 1fr;
    grid-template-rows: auto 1fr auto;
    background: var(--theme-bg-secondary);
  }
  
  .header {
    grid-area: header;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--theme-bg-primary);
    border-bottom: 1px solid var(--theme-border-default);
  }
  
  .header h1 {
    margin: 0;
    color: var(--theme-fg-primary);
  }
  
  .sidebar {
    grid-area: sidebar;
    padding: 1.5rem;
    background: var(--theme-bg-primary);
    border-right: 1px solid var(--theme-border-default);
  }
  
  .sidebar nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .sidebar a {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    color: var(--theme-fg-primary);
    text-decoration: none;
    transition: background-color 0.2s;
  }
  
  .sidebar a:hover {
    background: var(--theme-bg-secondary);
  }
  
  .main {
    grid-area: main;
    padding: 2rem;
  }
  
  .card {
    background: var(--theme-bg-primary);
    border: 1px solid var(--theme-border-default);
    border-radius: 0.5rem;
    padding: 2rem;
  }
  
  .card h2 {
    margin-top: 0;
    color: var(--theme-fg-primary);
  }
  
  .card p {
    color: var(--theme-fg-secondary);
  }
  
  .footer {
    grid-area: footer;
    padding: 1.5rem 2rem;
    background: var(--theme-bg-primary);
    border-top: 1px solid var(--theme-border-default);
    text-align: center;
    color: var(--theme-fg-tertiary);
  }
  
  @media (max-width: 768px) {
    .layout {
      grid-template-areas:
        "header"
        "main"
        "footer";
      grid-template-columns: 1fr;
    }
    
    .sidebar {
      display: none;
    }
  }
</style>
```

## TypeScript Integration

```typescript
// theme-utils.ts
import type { ThemeMode, ThemeConfig } from '@sjohansson/astro-theme-toggle';

export function getThemePreference(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';
  
  const stored = localStorage.getItem('theme-mode');
  if (stored && isValidThemeMode(stored)) {
    return stored as ThemeMode;
  }
  
  return 'system';
}

export function isValidThemeMode(mode: string): boolean {
  const validModes: ThemeMode[] = [
    'system',
    'light',
    'dark',
    'high-contrast-light',
    'high-contrast-dark',
  ];
  return validModes.includes(mode as ThemeMode);
}

export function createCustomTheme(
  mode: Exclude<ThemeMode, 'system'>,
  colors: ThemeConfig['colors']
): ThemeConfig {
  return {
    mode,
    label: mode.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    colors,
  };
}
```
