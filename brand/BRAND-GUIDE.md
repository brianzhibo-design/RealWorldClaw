# RealWorldClaw Brand Guide

## 🎨 Color Palette

### Primary
| Name | Hex | Usage |
|------|-----|-------|
| **Claw Orange** | `#f97316` | Primary brand, CTAs, energy |
| **Claw Cyan** | `#06b6d4` | Secondary brand, tech/digital feel |
| **White** | `#ffffff` | Text on dark, clean space |

### Primary Variants
| Name | Hex | Usage |
|------|-----|-------|
| Orange Light | `#fb923c` | Hover states, highlights |
| Orange Dark | `#ea580c` | Active states, emphasis |
| Cyan Light | `#22d3ee` | Hover states, highlights |
| Cyan Dark | `#0891b2` | Active states, emphasis |

### Neutral (Slate scale)
| Name | Hex | Usage |
|------|-----|-------|
| Slate 950 | `#020617` | Darkest background |
| Slate 900 | `#0f172a` | Primary dark background |
| Slate 800 | `#1e293b` | Cards, borders on dark |
| Slate 700 | `#334155` | Subtle elements |
| Slate 400 | `#94a3b8` | Body text on dark |
| Slate 200 | `#e2e8f0` | Borders on light |
| Slate 100 | `#f1f5f9` | Light background |
| Slate 50 | `#f8fafc` | Lightest background |

### Semantic
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#22c55e` | Connected, online, done |
| Warning | `#eab308` | Caution, pending |
| Error | `#ef4444` | Disconnected, failed |
| Info | `#3b82f6` | Tips, informational |

---

## 🔤 Typography

### Primary: Inter
- **Headlines:** Inter Bold (700) or Extra Bold (800)
- **Body:** Inter Regular (400) or Medium (500)
- **Small/UI:** Inter Medium (500)
- Fallback: `system-ui, -apple-system, sans-serif`

### Monospace: JetBrains Mono
- **Code blocks, terminal output, technical values**
- Weight: Regular (400) or Medium (500)
- Fallback: `'Fira Code', 'SF Mono', Consolas, monospace`

### Scale
| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 | 36–48px | 800 | 1.1 |
| H2 | 28–32px | 700 | 1.2 |
| H3 | 22–24px | 700 | 1.3 |
| Body | 16px | 400 | 1.6 |
| Small | 14px | 500 | 1.5 |
| Code | 14px | 400 (mono) | 1.5 |

---

## 🏷️ Logo Usage

### Variants
| File | Use Case |
|------|----------|
| `logo.svg` | Default, general use |
| `logo-dark.svg` | On dark backgrounds (#0f172a, etc.) |
| `logo-light.svg` | On light backgrounds (#f8fafc, etc.) |
| `logo-icon.svg` | Icon only, no wordmark |
| `favicon.svg` | Browser favicon |

### Minimum Size
- **Full logo:** min width 120px
- **Icon only:** min width 24px
- **Favicon:** 16×16px (use `favicon.svg`)

### Clear Space
Maintain minimum clear space equal to the height of the "eye" dot (the white circle in the icon) on all sides.

### ❌ Don'ts
- Don't stretch or distort
- Don't rotate
- Don't change the colors
- Don't add drop shadows or effects
- Don't place on busy/patterned backgrounds without sufficient contrast
- Don't rearrange the block elements
- Don't use outline-only versions

---

## ✍️ Voice & Tone

### Identity
RealWorldClaw is **technical but fun**. We're indie hackers building cool stuff, not a Fortune 500 company.

### Principles
1. **Clear > Clever** — Explain things simply. Jargon only when the audience expects it.
2. **Enthusiastic, not hype-y** — We're genuinely excited about what we build. No "revolutionary" or "game-changing."
3. **Show, don't tell** — Demo > description. Code > slides. Video > essay.
4. **Conversational** — Write like you're explaining to a smart friend. Contractions are fine. Emoji are fine (in moderation 🤏).
5. **Honest** — If something is experimental, say so. If it's broken, say so. Trust > polish.

### Examples
| ✅ Do | ❌ Don't |
|-------|---------|
| "Plug in a camera, and your AI can see." | "Our revolutionary vision module leverages cutting-edge..." |
| "Still figuring this out, PRs welcome!" | "This enterprise-grade solution provides..." |
| "Works with any USB camera. Tested on Mac + Linux." | "Seamlessly integrates across heterogeneous platforms." |

### Emoji Usage
Use sparingly in headings and key points. Good: 🔧 🤖 📸 🏠 🧪 ⚡ 🎯

---

## 📐 Social Media Assets

| Asset | Size | File |
|-------|------|------|
| Avatar | 400×400 (circular) | `social/avatar.svg` |
| Twitter/X Banner | 1500×500 | `social/twitter-banner.svg` |
| GitHub Social Preview | 1280×640 | `social/github-social.svg` |
| Open Graph | 1200×630 | `og-image.svg` |

---

## 🛠️ Implementation Notes

### CSS Custom Properties
```css
:root {
  --color-orange: #f97316;
  --color-cyan: #06b6d4;
  --color-bg-dark: #0f172a;
  --color-bg-light: #f8fafc;
  --color-text-dark: #0f172a;
  --color-text-light: #f8fafc;
  --color-text-muted: #94a3b8;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Tailwind Classes
Primary palette maps directly to Tailwind's default scale:
- Orange: `orange-500` (#f97316)
- Cyan: `cyan-500` (#06b6d4)
- Backgrounds: `slate-900`, `slate-50`
