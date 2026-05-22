# Portfolio Website

A modern, responsive portfolio for **toko_stark** — auto-syncs with GitHub so new repos appear on the site without redeploying.

## Live Site

[https://tokodev.xyz](https://tokodev.xyz)

## Highlights

- **Auto-loading projects** — fetches the 6 most recently updated public repos from the GitHub API on every page load (cached 1 h in localStorage). New public repo on GitHub → it appears on the site within an hour.
- **Generated project artwork** — each repo gets a unique gradient cover with soft glow blobs and the repo's initials, derived deterministically from the repo name. No image assets to maintain.
- **Mixed sources** — public GitHub repos are merged with curated private projects defined in `data/projects.json`.
- **Interactive terminal** — Linux-style webshell with `help`, `whoami`, `aboutme`, `skills`, `projects`, `neofetch`, etc.
- **Responsive** — mobile-first breakpoints (1100 / 900 / 830 / 720 / 540 / 400 px), real mobile hamburger menu with focus trap and outside-click close.
- **Discoverable** — Open Graph + Twitter Card meta for rich embeds in Discord / WhatsApp / Slack / iMessage, JSON-LD `Person` schema for Google, plus `robots.txt` and `sitemap.xml`.
- **Animated hero** with rotating role text, glassmorphic navbar, IntersectionObserver-driven reveals, prefers-reduced-motion support.

## Tech

- HTML5, CSS3 (custom properties, Grid, Flexbox), vanilla JavaScript (ES2020+)
- GitHub REST API (public, unauthenticated, with localStorage cache)
- Ionicons for UI glyphs
- Hosted on GitHub Pages with a custom domain (`tokodev.xyz`)

## Project Structure

```
portfolio/
├── css/
│   ├── general.css      # Design tokens, body, utility classes
│   ├── header.css       # Glass navbar + mobile menu
│   ├── hero.css         # Hero section + code block animation
│   ├── terminal.css     # Terminal/webshell styling
│   ├── aboutme.css      # About section layout
│   ├── skills.css       # Tech stack cards
│   ├── projects.css     # Project cards + skeleton/error states
│   ├── contact.css      # Contact card + form
│   ├── footer.css       # Footer
│   └── queries.css      # Mobile-first breakpoints
├── js/
│   ├── projects.js      # GitHub API loader + SVG generator
│   ├── terminal.js      # Terminal command handlers
│   ├── scrollEffect.js  # Scroll reveal + active nav link
│   └── navMenu.js       # Mobile menu toggle + dynamic year
├── data/
│   └── projects.json    # Curated/private projects (merged into the GitHub list)
├── assets/
│   ├── icons/           # Tech stack icons (HTML, CSS, JS, …)
│   ├── profile.webp     # Profile picture
│   └── favicon.ico
├── CNAME                # Custom domain (tokodev.xyz)
├── robots.txt
├── sitemap.xml
└── index.html
```

## Adding a project

**Public:** just create a new repo on GitHub. Set the repo's **Website** field to your live demo URL (or enable GitHub Pages — the site auto-detects `has_pages` and builds the URL). To label the tech stack, add repo **topics** like `javascript`, `html`, `node`, etc.

**Private / curated:** add an entry to `data/projects.json`:

```json
{
  "id": "my-secret-project",
  "title": "My Secret Project",
  "description": "Short pitch.",
  "private": true,
  "liveDemo": null,
  "github": null,
  "techStack": ["JavaScript"],
  "updatedAt": "2026-05-22"
}
```

**Hide a public repo** (e.g. profile README): add its lowercase name to `REPO_BLACKLIST` in `js/projects.js`.

## Local development

No build step. Just open `index.html` through a local server (e.g. `npx serve .` or VS Code's Live Server) so the `fetch` calls to `data/projects.json` and the GitHub API work. Opening it via `file://` will break the local JSON fetch.

## License

Personal project — code is open for reference, please don't ship it as your own portfolio.
