async function loadProjects() {
  const res = await fetch('./data/projects.json');
  const projects = await res.json();
  renderProjects(projects);
}

function renderProjects(projects) {
  const grid = document.querySelector('.projects-grid');
  if (!grid) return;

  grid.innerHTML = projects
    .map((p) => {
      const liveDemoBtn = p.liveDemo
        ? `<a href="${p.liveDemo}" class="btn btn--primary project-link" target="_blank">Live Demo</a>`
        : `<a href="#" class="btn btn--primary project-link --disabled">Live Demo</a>`;

      const githubBtn =
        !p.private && p.github
          ? `<a href="${p.github}" class="btn btn--primary github-link" target="_blank">View Code</a>`
          : `<a href="#" class="btn btn--primary github-link --disabled">View Code</a>`;

      const techTags = p.techStack
        .map(
          (t) =>
            `<span class="techstack-item"><span class="techstack-text">${t}</span></span>`
        )
        .join('');

      return `
        <div class="project-card">
          <img src="${p.image}" alt="${p.title}" class="project-image" loading="lazy"/>
          <h3 class="project-title">${p.title}</h3>
          <p class="project-description">${p.description}</p>
          <div class="buttons-projects">
            ${liveDemoBtn}
            ${githubBtn}
          </div>
          <div class="techstack-project">
            ${techTags}
          </div>
        </div>`;
    })
    .join('');

  // Re-attach hover effect after cards are rendered
  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mouse-x', '0%');
      card.style.setProperty('--mouse-y', '0%');
    });
  });
}

loadProjects();
