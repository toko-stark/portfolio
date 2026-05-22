/**
 * Project loader
 * - Fetches the top N most-recently-updated public repos from GitHub
 * - Merges them with a local list of private/curated projects (data/projects.json)
 * - Caches the API result in localStorage (1 hour) to stay under rate limits
 * - Falls back gracefully if either source fails
 */

const GITHUB_USER = 'toko-stark';
const PUBLIC_REPO_LIMIT = 6;
const CACHE_KEY = 'portfolio:gh-repos:v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Gradient palettes. Repo name is hashed to pick one deterministically,
// so the same repo always renders the same colors.
const PALETTES = [
  ['#a855f7', '#d946ef'], // purple → magenta
  ['#3b82f6', '#06b6d4'], // blue → cyan
  ['#f97316', '#facc15'], // orange → amber
  ['#10b981', '#84cc16'], // emerald → lime
  ['#ef4444', '#f97316'], // red → orange
  ['#8b5cf6', '#3b82f6'], // violet → blue
  ['#ec4899', '#f43f5e'], // pink → rose
  ['#14b8a6', '#22d3ee'], // teal → cyan
  ['#eab308', '#f59e0b'], // gold
  ['#6366f1', '#a855f7'], // indigo → purple
];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsFor(name) {
  const parts = name.replace(/[-_]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generatedImage(seed) {
  const h = hashString(seed);
  const [c1, c2] = PALETTES[h % PALETTES.length];
  const angle = h % 360;
  const initials = initialsFor(seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse">
        <circle cx="22" cy="22" r="1.3" fill="rgba(255,255,255,0.18)"/>
      </pattern>
    </defs>
    <rect width="600" height="400" fill="url(#g)"/>
    <rect width="600" height="400" fill="url(#p)"/>
    <rect width="600" height="400" fill="rgba(0,0,0,0.18)"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
      font-family="Segoe UI, Tahoma, sans-serif" font-weight="800" font-size="160"
      fill="rgba(255,255,255,0.95)" letter-spacing="-6">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
    .filter((r) => !r.fork && !r.archived && !r.private)
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
