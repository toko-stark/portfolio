const terminalInput = document.querySelector('.terminal-input');
const recentCmds = [];
let historyIndex = -1;

function addNewAnswer(msg = 'Empty Message') {
  const terminalBody = document.querySelector('.terminal-body');
  const inputLine = document.querySelector('.input-line');
  const userCmd = terminalInput.value.trim();

  if (userCmd) {
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-line';
    cmdLine.innerHTML = `<span class="terminal-prompt">tokodev@portfolio:~$</span> <span class="terminal-command">${userCmd}</span>`;
    terminalBody.insertBefore(cmdLine, inputLine);
  }

  if (msg) {
    const outputLine = document.createElement('div');
    outputLine.className = 'terminal-line';
    outputLine.style.whiteSpace = 'pre-wrap';
    outputLine.textContent = msg;
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

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const userInput = terminalInput.value.trim();
    if (userInput) {
      recentCmds.push(userInput);
      historyIndex = recentCmds.length;
    }

    switch (userInput) {
      case 'help': {
        const availableCmds = {
          aboutme: 'Shows basic information about the website creator.',
          skills: 'Displays a list of my skills.',
          contact: 'Provides my contact information.',
          github: 'Opens or shows my GitHub profile.',
          sudo: '??? I dont know',
          clear: 'Clear the terminal.',
        };
        let msgData = '';
        for (const [name, description] of Object.entries(availableCmds)) {
          msgData += `'${name}' ➜ ${description}\n`;
        }
        addNewAnswer(msgData.trim());
        break;
      }
      case 'aboutme':
        addNewAnswer(
          "Hi! I'm TokoDev, a full-stack developer passionate about building modern web applications.\n" +
            'I love creating clean, responsive interfaces and solving complex problems.\n' +
            "Check out my projects and skills with using 'skills'!"
        );
        break;
      case 'skills':
        addNewAnswer(
          'Technical Skills:\n' +
            '• Frontend: HTML, CSS, JavaScript\n' +
            '• Backend: Node.js\n' +
            '• Tools: Git, VS Code, Linux\n' +
            '• Other: Responsive Design, Web APIs, Ai Programming'
        );
        break;
      case 'contact':
        addNewAnswer(
          'Contact Information:\n' +
            '• Email: toko.stark@icloud.com\n' +
            '• GitHub: github.com/toko-stark\n' +
            '• Portfolio: tokodev-portfolio.netlify.app'
        );
        break;
      case 'github':
        addNewAnswer('Opening GitHub profile...');
        setTimeout(() => {
          window.open('https://github.com/toko-stark', '_blank');
        }, 500);
        break;
      case 'sudo':
        addNewAnswer('Error: No Permission');
        break;
      case 'clear':
        addNewAnswer('');
        break;
      default:
        if (userInput) addNewAnswer(`${userInput}: command not found`);
        break;
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
