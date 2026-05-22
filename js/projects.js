/**
 * Project loader
 * - Fetches the top N most-recently-updated public repos from GitHub
 * - Merges them with a local list of private/curated projects (data/projects.json)
 * - Caches the API result in localStorage (1 hour) to stay under rate limits
 * - Falls back gracefully if either source fails
 */

const GITHUB_USER = 'toko-stark';
const PUBLIC_REPO_LIMIT = 6;
const CACHE_KEY = 'portfolio:gh-repos:v3';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Repo names to hide from the portfolio (lowercase)
const REPO_BLACKLIST = new Set([
  'toko-stark', // GitHub profile README
]);

// Each entry: [base, accent, glow] used for layered gradient art.
// Tuned to feel like the rest of the portfolio (saturated, deep, with bloom).
const PALETTES = [
  ['#7c3aed', '#ec4899', '#c084fc'], // violet → pink
  ['#2563eb', '#0ea5e9', '#67e8f9'], // royal blue → sky
  ['#0f766e', '#10b981', '#5eead4'], // teal → emerald
  ['#dc2626', '#f97316', '#fcd34d'], // red → amber
  ['#6d28d9', '#3b82f6', '#a5b4fc'], // indigo → blue
  ['#be185d', '#f43f5e', '#fda4af'], // berry → rose
  ['#b45309', '#eab308', '#fde68a'], // bronze → gold
  ['#0c4a6e', '#0891b2', '#67e8f9'], // deep cyan
  ['#4c1d95', '#a855f7', '#e9d5ff'], // deep purple
  ['#065f46', '#84cc16', '#d9f99d'], // forest → lime
];

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

function initialsFor(name) {
  const parts = name.replace(/[-_]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generatedImage(seed) {
  const h = hashString(seed);
  const [c1, c2, glow] = PALETTES[h % PALETTES.length];
  const initials = initialsFor(seed);

  // Deterministic but varied placement of the two glow blobs
  const blob1X = 80 + (h % 180);
  const blob1Y = 60 + ((h >> 3) % 140);
  const blob2X = 360 + ((h >> 5) % 180);
  const blob2Y = 200 + ((h >> 7) % 160);
  const angle = h % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="bg" gradientTransform="rotate(${angle} 0.5 0.5)">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="#0b0b14"/>
      </linearGradient>
      <radialGradient id="glow1">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow2">
        <stop offset="0%" stop-color="${c2}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0 H0 V32" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      </pattern>
      <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="48"/></filter>
    </defs>

    <rect width="600" height="400" fill="url(#bg)"/>

    <g filter="url(#blur)">
      <circle cx="${blob1X}" cy="${blob1Y}" r="160" fill="url(#glow1)"/>
      <circle cx="${blob2X}" cy="${blob2Y}" r="180" fill="url(#glow2)"/>
    </g>

    <rect width="600" height="400" fill="url(#grid)"/>
    <rect width="600" height="400" fill="url(#vignette)"/>

    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-family="'Segoe UI', system-ui, sans-serif"
      font-weight="800" font-size="180" letter-spacing="-8"
      fill="rgba(255,255,255,0.95)"
      style="paint-order:stroke;stroke:rgba(0,0,0,0.18);stroke-width:2">${initials}</text>

    <text x="28" y="34" font-family="'Courier New', monospace"
      font-size="18" fill="rgba(255,255,255,0.55)" font-weight="600">&lt;/&gt;</text>

    <text x="572" y="376" text-anchor="end"
      font-family="'Courier New', monospace" font-size="14"
      fill="rgba(255,255,255,0.45)" letter-spacing="2">${escapeSvgText(seed).toUpperCase().slice(0, 18)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setGridState(html) {
  const grid = document.querySelector('.projects-grid');
  if (grid) grid.innerHTML = html;
}

function showLoading() {
  setGridState(
    Array.from({ length: 3 })
      .map(() => '<div class="project-card project-skeleton" aria-hidden="true"></div>')
      .join('')
  );
}

function showError(msg) {
  setGridState(
    `<div class="projects-error">
       <p>${msg}</p>
       <a class="btn btn--secondary" href="https://github.com/${GITHUB_USER}" target="_blank" rel="noreferrer">
         View on GitHub
       </a>
     </div>`
  );
}

async function fetchGitHubRepos() {
  const cached = readCache();
  if (cached) return cached;

  const url = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();

  const mapped = data
    .filter(
      (r) =>
        !r.fork &&
        !r.archived &&
        !r.private &&
        !REPO_BLACKLIST.has(r.name.toLowerCase())
    )
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, PUBLIC_REPO_LIMIT)
    .map((r) => ({
      id: r.name,
      title: prettifyName(r.name),
      description: r.description || 'No description provided.',
      image: generatedImage(r.name),
      private: false,
      liveDemo: deriveLiveDemo(r),
      github: r.html_url,
      techStack: deriveTechStack(r),
      updatedAt: r.pushed_at,
    }));

  writeCache(mapped);
  return mapped;
}

function deriveLiveDemo(repo) {
  if (repo.homepage && repo.homepage.trim()) return repo.homepage.trim();
  if (repo.has_pages) {
    return `https://${repo.owner.login}.github.io/${repo.name}/`;
  }
  return null;
}

function deriveTechStack(repo) {
  const topics = Array.isArray(repo.topics) ? repo.topics : [];
  const allowed = new Set([
    'html', 'css', 'javascript', 'typescript', 'node', 'nodejs',
    'react', 'java', 'python', 'tailwind', 'vite',
  ]);
  const topicTags = topics
    .filter((t) => allowed.has(t.toLowerCase()))
    .map(prettifyTech);

  if (topicTags.length) return topicTags;
  if (repo.language) return [prettifyTech(repo.language)];
  return [];
}

function prettifyTech(t) {
  const map = {
    html: 'HTML', css: 'CSS', javascript: 'JavaScript', typescript: 'TypeScript',
    node: 'Node.js', nodejs: 'Node.js', react: 'React', java: 'Java',
    python: 'Python', tailwind: 'Tailwind', vite: 'Vite',
  };
  return map[t.toLowerCase()] || t;
}

function prettifyName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bApi\b/g, 'API');
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* ignore quota / private mode */
  }
}

async function fetchLocalProjects() {
  try {
    const res = await fetch('./data/projects.json');
    if (!res.ok) throw new Error(`Local JSON ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Local projects.json failed:', err);
    return [];
  }
}

function mergeProjects(local, remote) {
  // Dedupe by github URL (case-insensitive). Local entries win.
  const seen = new Set(
    local.filter((p) => p.github).map((p) => p.github.toLowerCase())
  );
  const remoteFiltered = remote.filter(
    (r) => !seen.has((r.github || '').toLowerCase())
  );
  const all = [...local, ...remoteFiltered];
  // Sort: most-recent first, fall back to title
  return all.sort((a, b) => {
    const da = new Date(a.updatedAt || 0).getTime();
    const db = new Date(b.updatedAt || 0).getTime();
    if (db !== da) return db - da;
    return (a.title || '').localeCompare(b.title || '');
  });
}

function renderProjects(projects) {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  if (!projects.length) {
    showError('No projects to show yet — check back soon.');
    return;
  }

  grid.innerHTML = projects.map(cardHtml).join('');

  grid.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  });
}

function cardHtml(p) {
  const liveDemoBtn = p.liveDemo
    ? `<a href="${p.liveDemo}" class="project-link" target="_blank" rel="noreferrer">Live Demo</a>`
    : `<span class="project-link --disabled">Live Demo</span>`;

  const githubBtn =
    !p.private && p.github
      ? `<a href="${p.github}" class="github-link" target="_blank" rel="noreferrer">View Code</a>`
      : `<span class="github-link --disabled">${p.private ? 'Private' : 'No Repo'}</span>`;

  const techTags = (p.techStack || [])
    .map(
      (t) =>
        `<span class="techstack-item"><span class="techstack-text">${escapeHtml(
          t
        )}</span></span>`
    )
    .join('');

  return `
    <article class="project-card">
      <img src="${escapeHtml(p.image || generatedImage(p.id || p.title))}"
           alt="${escapeHtml(p.title)} preview"
           class="project-image"
           loading="lazy"
           onerror="this.onerror=null;this.src='${generatedImage(p.id || p.title)}'"/>
      <h3 class="project-title">${escapeHtml(p.title)}</h3>
      <p class="project-description">${escapeHtml(p.description)}</p>
      <div class="techstack-project">${techTags}</div>
      <div class="buttons-projects">
        ${liveDemoBtn}
        ${githubBtn}
      </div>
    </article>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function init() {
  showLoading();

  const [localProjects, remoteResult] = await Promise.all([
    fetchLocalProjects(),
    fetchGitHubRepos().catch((err) => {
      console.warn('GitHub fetch failed:', err);
      return null;
    }),
  ]);

  if (!remoteResult && !localProjects.length) {
    showError('Could not load projects. Please try again later.');
    return;
  }

  renderProjects(mergeProjects(localProjects, remoteResult || []));
}

init();
