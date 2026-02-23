# Changelog

All notable changes to RealWorldClaw will be documented here.

## [0.2.0] - 2026-02-24

### Security
- Rate limiting on registration (5/hour) and login (20/5min)
- Login brute-force delay (1s on failure)
- Username pattern validation (`^[a-zA-Z0-9_-]+$`)
- XSS sanitization on all community posts and comments
- Race condition fix: `BEGIN IMMEDIATE` on order acceptance
- Database backup script with 7-day retention

### Added
- Privacy Policy page (`/privacy`)
- Terms of Service page (`/terms`)
- Registration requires agreement to terms
- Custom 404, error, and loading pages
- Pricing engine with `/orders/estimate` endpoint
- Notification system framework (Resend email integration)
- EmptyState component integrated across 8 list pages
- Per-page SEO titles for 11 pages
- OpenGraph meta tags
- Sitemap expanded from 3 to 13 URLs
- `skill.md` rewritten to match actual API capabilities
- `SECURITY.md` with vulnerability reporting process
- Architecture documentation with Mermaid diagrams
- `lib/messages.ts` for i18n preparation
- 9 database indexes for query performance
- Order review UI (star rating + comments)
- "How it Works" section on landing page
- Site footer with legal links

### Fixed
- Order status values aligned with backend (removed phantom `submitted`/`shipped`)
- `post.author` → `post.author_name` across all community pages
- `post.tags` null safety in spaces filter
- Color contrast: `text-slate-500` → `text-slate-400` (WCAG AA compliance)
- aria-labels added to icon-only buttons
- Focus-visible outline for keyboard navigation
- Chinese strings in backend replaced with English
- Unused npm dependencies removed (d3-geo, d3-geo-projection)

### Refactored
- All direct `fetch()` calls unified to `apiFetch()`
- All auth-related `localStorage` access unified to `useAuthStore()`
- Logging added to all key backend routes

## [0.1.0-alpha] - 2026-02-21

### Added
- Initial platform launch
- 24 frontend pages
- 64 API endpoints
- JWT + Agent API key dual-track authentication
- Community posts, orders, nodes, makers, components, agents
- World map with manufacturing nodes
- File upload system
- WebSocket infrastructure
