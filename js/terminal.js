const terminalInput = document.querySelector('.terminal-input');
const recentCmds = [];
let historyIndex = -1;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function addNewAnswer(msg = '', isHtml = false) {
  const terminalBody = document.querySelector('.terminal-body');
  const inputLine = document.querySelector('.input-line');
  const userCmd = terminalInput.value.trim();

  if (userCmd) {
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-line';
    cmdLine.innerHTML = `<span class="terminal-prompt">tokodev@portfolio:~$</span> <span class="terminal-command">${escapeHtml(userCmd)}</span>`;
    terminalBody.insertBefore(cmdLine, inputLine);
  }

  if (msg) {
    const outputLine = document.createElement('div');
    outputLine.className = 'terminal-line terminal-output';
    outputLine.style.whiteSpace = 'pre-wrap';
    if (isHtml) {
      outputLine.innerHTML = msg;
    } else {
      outputLine.textContent = msg;
    }
    terminalBody.insertBefore(outputLine, inputLine);
  }

  if (userCmd === 'clear') {
    const allLines = terminalBody.querySelectorAll(
      '.terminal-line:not(.input-line)'
    );
    allLines.forEach((line) => line.remove());
  }

  terminalBody.scrollTop = terminalBody.scrollHeight;
}

const commands = {
  help: () => {
    const cmds = [
      ['help',      'Show available commands'],
      ['whoami',    'Info about the developer'],
      ['aboutme',   'A short bio'],
      ['skills',    'List technical skills'],
      ['projects',  'List all projects'],
      ['contact',   'Show contact information'],
      ['github',    'Open GitHub profile'],
      ['neofetch',  'System info (portfolio edition)'],
      ['sudo',      '???'],
      ['clear',     'Clear the terminal'],
    ];
    const maxLen = Math.max(...cmds.map(([n]) => n.length));
    const lines = cmds.map(([name, desc]) =>
      `  ${name.padEnd(maxLen + 2)}${desc}`
    );
    addNewAnswer('Available commands:\n\n' + lines.join('\n'));
  },

  whoami: () => {
    addNewAnswer(
      'toko_stark\n' +
      '──────────────────────────────\n' +
      'Full-Stack Developer · Germany\n' +
      'Age: 16 | Started: 2024\n' +
      'Focus: Web Development, Bots, AI Tooling'
    );
  },

  aboutme: () => {
    addNewAnswer(
      "Hi! I'm TokoDev — a self-taught full-stack developer from Germany.\n" +
      'I started with Minecraft scripting in JavaScript, then expanded into\n' +
      'web development, Discord bots, and AI-powered tools.\n\n' +
      "Run 'skills' to see my tech stack or 'projects' to see my work."
    );
  },

  skills: () => {
    addNewAnswer(
      'Technical Skills\n' +
      '──────────────────────────────\n' +
      '  Frontend   HTML · CSS · JavaScript\n' +
      '  Backend    Node.js\n' +
      '  AI / APIs  Gemini API · Web APIs\n' +
      '  Tools      Git · GitHub · VS Code · Linux\n' +
      '  Design     Figma · Canva · Responsive Design'
    );
  },

  projects: () => {
    addNewAnswer(
      'Projects\n' +
      '──────────────────────────────\n' +
      '  [1] Omnifood              — Responsive food landing page\n' +
      '  [2] NutriVision AI        — AI nutrition analysis tool\n' +
      '  [3] Portfolio             — This website\n' +
      '  [4] 100 Days of Projects  — Daily frontend challenge\n' +
      '  [5] ReadMe Generator      — AI-powered README builder\n' +
      '  [6] AI Macros Tracking    — Gemini-powered calorie tracker\n' +
      '  [7] Mineflayer Donut Bot  — Minecraft server bot\n' +
      '  [8] Bedrock Commandline Bot — Discord/Minecraft bot\n\n' +
      "  More at: github.com/toko-stark"
    );
  },

  contact: () => {
    addNewAnswer(
      'Contact\n' +
      '──────────────────────────────\n' +
      '  Email     toko.stark@icloud.com\n' +
      '  GitHub    github.com/toko-stark\n' +
      '  Discord   discord.com/users/789894696176058368\n' +
      '  Portfolio tokodev-portfolio.netlify.app'
    );
  },

  github: () => {
    addNewAnswer('Opening GitHub profile...');
    setTimeout(() => {
      window.open('https://github.com/toko-stark', '_blank');
    }, 500);
  },

  neofetch: () => {
    addNewAnswer(
      '  ████████╗ ██████╗ ██╗  ██╗ ██████╗ \n' +
      '     ██╔══╝██╔═══██╗██║ ██╔╝██╔═══██╗\n' +
      '     ██║   ██║   ██║█████╔╝ ██║   ██║\n' +
      '     ██║   ██║   ██║██╔═██╗ ██║   ██║\n' +
      '     ██║   ╚██████╔╝██║  ██╗╚██████╔╝\n' +
      '     ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ \n' +
      '\n' +
      '  toko_stark@portfolio\n' +
      '  ─────────────────────────────\n' +
      '  OS       Portfolio OS v1.0\n' +
      '  Host     tokodev-portfolio.netlify.app\n' +
      '  Role     Full-Stack Developer\n' +
      '  Origin   Germany 🇩🇪\n' +
      '  Stack    HTML · CSS · JavaScript · Node.js\n' +
      '  Projects 10+\n' +
      '  GitHub   github.com/toko-stark'
    );
  },

  sudo: () => {
    addNewAnswer('Error: Permission denied. Nice try though.');
  },

  clear: () => {
    addNewAnswer('');
  },
};

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const userInput = terminalInput.value.trim();

    if (userInput) {
      recentCmds.push(userInput);
      historyIndex = recentCmds.length;
    }

    const handler = commands[userInput];
    if (handler) {
      handler();
    } else if (userInput) {
      addNewAnswer(`${userInput}: command not found. Type 'help' for a list of commands.`);
    } else {
      addNewAnswer('');
    }

    terminalInput.value = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIndex === -1 && recentCmds.length) {
      historyIndex = recentCmds.length - 1;
    } else if (historyIndex > 0) {
      historyIndex--;
    }
    if (historyIndex >= 0) {
      terminalInput.value = recentCmds[historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex >= 0 && historyIndex < recentCmds.length - 1) {
      historyIndex++;
      terminalInput.value = recentCmds[historyIndex];
    } else {
      historyIndex = -1;
      terminalInput.value = '';
    }
  }
});
