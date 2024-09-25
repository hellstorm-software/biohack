let db;
let firebaseAvailable = false;
let adminCommands = null;
let isElectron = false;

if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
  isElectron = true;
}


if (isElectron) {
  try {
    adminCommands = require('../adminFiles/adminConsole.js');
    console.log("Admin commands loaded successfully:", adminCommands);
  } catch (error) {
    console.warn("Admin commands are not available. Continuing without admin features.");
    console.error(error);
  }
} else {
  console.warn("Not running in Electron, skipping admin commands loading.");
}

const terminal = document.getElementById("terminal");
const input = document.getElementById("input");


// ##############################################################################################################################
//
//
//    Text/Styling
//
//
// ##############################################################################################################################

// Add styling for specific keywords in the input
function applyStylingToText(content) {
  return content.replace(/<\/?[^>]+>/g, match => match) // Ignore HTML tags
    .replace(/\b(help|user|username|create|script|scripts|room|rooms|code|matrix|lookup|whoami|redacted|clear|brainstem|hunt|kyphxr|console)\b/gi, 
      (match) => `<span class="${getTextColorClass(match)}">${match}</span>`);
}

function getTextColorClass(keyword) {
  const colors = {
    help: 'red-text',
    user: 'orange-text',
    username: 'username-text',
    create: 'create-text',
    script: 'script-text',
    scripts: 'script-text',
    room: 'room-text',
    rooms: 'room-text',
    code: 'code-green',
    console: 'code-green',
    matrix: 'matrix-textc',
    lookup: 'lYellow-text',
    whoami: 'green-text',
    redacted: 'red-text',
    clear: 'green-text',
    brainstem: 'anomevo-text',
    hunt: 'red-text2',
	kyphxr: 'ky-text',
  };
  return colors[keyword.toLowerCase()] || '';
}

// Update the input field style as the user types
function updateInputStyle() {
  const content = input.innerText;
  const styledContent = applyStylingToText(content);
  input.innerHTML = styledContent;

  // Move the cursor to the end of the content
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(input);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

let storedUsername = null;

// Sanitize input by removing extra whitespace
function sanitizeInput(input) {
  return input.replace(/\s+/g, ' ').trim();
}

// ##############################################################################################################################
//
//
//    Commands
//
//
// ##############################################################################################################################



// Process command and display in terminal
async function processCommand(command) {
  const response = await handleCommand(command);
  terminal.innerHTML += `> ${applyStylingToText(command)}<br/>${applyStylingToText(response)}<br/>`;
  terminal.scrollTop = terminal.scrollHeight;
}

// Event listeners for input
input.addEventListener("input", updateInputStyle);
input.addEventListener("keydown", async function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const command = input.innerText.trim();
    if (command) await processCommand(command);
    input.innerHTML = ""; // Clear input after processing
  }
});

async function handleAdminCommand(command) {
  if (process.env.ADMIN_MODE === 'true') {
    if (command === 'administration') {
      const adminCommand = adminCommands[command];
      if (adminCommand) {
        // Handle the promise returned by the administration command
        const initialResponse = await adminCommand();
        console.log(initialResponse); // Sends the first segment

        // Wait for the delay and then send the second segment
        const finalResponse = await adminCommand();
        console.log(finalResponse); // Sends the second segment
      } else {
        console.log("Unknown command");
      }
    } else {
      console.log(adminCommands[command]());
    }
  }
}

// Clear the terminal
function clearTerminal() {
  terminal.innerHTML = "";
}

const executeAdminCommand = async (command) => {
  if (adminCommands && adminCommands[command]) {
    return await adminCommands[command]();
  } else {
    return "Command not recognized.";
  }
};

const adminCommandHandler = async (input) => {
  const output = await executeAdminCommand(input);
  console.log(output);  // Log the result of the command
};



