let db;
let adminCommands = null;


const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let rooms;
if (isElectron) {
  rooms = require('./rooms');
} else {
  console.warn("Not running in Electron, skipping rooms module loading.");
}

// ##############################################################################################################################
//
//
//    Text/Styling
//
//
// ##############################################################################################################################

// Add styling for specific keywords
function applyStylingToText(content) {
  return content.replace(/<\/?[^>]+>/g, match => match) // Ignore HTML tags
    .replace(/\b(help|user|username|create|script|scripts|room|rooms|code|matrix|lookup|whoami|redacted|clear|brainstem|hunt)\b/gi, 
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
    matrix: 'matrix-text',
    lookup: 'lYellow-text',
    whoami: 'green-text',
    redacted: 'red-text',
    clear: 'green-text',
    brainstem: 'anomevo-text',
    hunt: 'red-text2',
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

async function handleCommand(command) {
  const sanitizedCommand = sanitizeInput(command);
  const [cmd, ...args] = sanitizedCommand.split(' ');

	
  if (adminCommands && adminCommands[cmd]) {
    return adminCommands[cmd](...args);
  }
  
  
  if (cmd.toLowerCase() === "fight") {
    return await combat(args.join(' '));
  }

  
  switch (cmd.toLowerCase()) {
    case "hello":
      return "hello, hacker!";
    case "status":
      return "All systems operational.";
    case "room":
      const roomNumber = parseInt(args, 10);
      return rooms && rooms[roomNumber] ? `Room ${roomNumber}: ${rooms[roomNumber]}` : `Room ${roomNumber} does not exist.`;
    case "hackmud":
      return `
        Hackmud is a hacking themed multi-user dungeon, and is the primary inspiration to this game. 
        Hackmud is a more PVP focused MMO, allowing real-time hacking between players. 
        Check out Hackmud <a style="color: green;" href="https://store.steampowered.com/app/469920/hackmud/" target="_blank">on steam!</a>
      `;
    case "register":
      return "Create a new user by typing user.Create [username] and replace '[username]' with your desired username.";
    case "matrix.tut":
      return tutorialMatrix;
    case "hoard":
      return `you have 1 Brainstem. Use hunt.brainstem to search for <i>Anomevos</i> to fight;`
    case "user-lookup.kyphxr":
      return userLookupResponse;
    case "help":
      return "<u>Commands:</u> <br> - login <br> - bank <br> - discord <br> - user-lookup.[username] <br> - clear <br> - whoami <br> - status <br> - hackmud <br> - register <br>";
    case "discord":
      return '<a class="discord-text" href="https://discord.gg/ykmdtZhSN3" target="_blank">https://discord.gg/ykmdtZhSN3</a>';
    case "user.create":
      storedUsername = args.join(' ');
      return `User created with username: ${storedUsername}. Type 'login' to begin. Type 'help' for assistance.`;
    case "whoami":
      return storedUsername ? `Current username: ${storedUsername}` : "No user is currently created.";
    case "login":
      return storedUsername ? `Logged in as: ${storedUsername}<br>Server status: operational.<br>Multiplayer status: OFFLINE.<br>${devMessage}` : "No user is currently created.";
    case "clear":
      clearTerminal();
      return "";
    default:
      return "Unknown command.";
  }
}

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
        
        const initialResponse = await adminCommand();
        console.log(initialResponse); 

        
        const finalResponse = await adminCommand();
        console.log(finalResponse);
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

// ##############################################################################################################################
//
//
//    Combat System
//
//
// ##############################################################################################################################

const brainStem = {
  health: 100,
  moves: {
    "Neural Shock": { damage: 20, description: "A powerful electric attack" },
    "Data Drain": { damage: 15, description: "Drains data to heal" },
    "Code Burst": { damage: 25, description: "Releases a burst of code" },
    "Firewall": { damage: 10, description: "Creates a protective barrier" }
  }
};

const dataNull = {
  health: 120,
  moves: {
    "Nullify": { damage: 18, description: "Nullifies attacks" },
    "Data Corruption": { damage: 22, description: "Corrupts data to deal damage" },
    "System Crash": { damage: 30, description: "Causes a critical system crash" },
    "Debug": { damage: 5, description: "Repairs some damage" }
  }
};

let playerTurn = true;

function attack(attacker, defender, moveName) {
  const move = attacker.moves[moveName];
  if (!move) return "Invalid move!";
  
  const damage = move.damage;
  defender.health -= damage;
  return `${attacker.name} used ${moveName} and dealt ${damage} damage. ${defender.name} has ${defender.health} health remaining.`;
}

function nextTurn() {
  playerTurn = !playerTurn;
}

function combat(command) {
  const [action, moveName] = command.split(' ');
  
  if (playerTurn) {
    if (!brainStem.moves[moveName]) {
      return "Invalid move for Brain Stem!";
    }
    const result = attack(brainStem, dataNull, moveName);
    if (dataNull.health <= 0) {
      return "Brain Stem defeated Data(null)!";
    }
    nextTurn();
    return result;
  } else {
    // Enemy turn logic
    const enemyMove = getRandomMove(dataNull);
    const result = attack(dataNull, brainStem, enemyMove);
    if (brainStem.health <= 0) {
      return "Data(null) defeated Brain Stem!";
    }
    nextTurn();
    return result;
  }
}

function getRandomMove(creature) {
  const moves = Object.keys(creature.moves);
  return moves[Math.floor(Math.random() * moves.length)];
}


// ##############################################################################################################################
//
//
//    Variables
//
//
// ##############################################################################################################################

const userLookupResponse = `
	######################################################################################################################################################################################################<br>
	######################################################################################################################################################################################################<br>
	<span style="font-size: 20px; margin-left: 43%;"><u>user.Kyphxr:</u></span><br>
	<div style="font-size: 8px; margin-left: 5%;">
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;+++xXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX+++:;XXXXXXXXXXXXXXXXXXXXXXX:.+xx+;XXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXX;++++..;+XXXXXXXXXXXXXXXXXXXX+..:xxx++XXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXx+xxx+...++XXXXXXXXXXXXXXXXXX+:.::xxx+;;XXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXX++xxx+::.:+X$XXXXXXXXXXXXXXX+;.:::xxxx+.XXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXX:+xxx+::::.$&$$XXXX+::;xXX+;+:::::;xxxx..XXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXX.+xxx+.::::X&&+;+++;;;+++:++.::::.:xxxx:.:XXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXX+.:++++x:::::...;++;;+xxxx;;;+:.:.XX+x++:..xXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXX...:++;XXX.....:++;;.:;+++++;....;XXX.:;....XXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXx;:.....XXX....:++;:;.....:;;;:...:.XXX:....:XXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXX....;XX....:;;:;;+......::::....:xXXX+....XXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXX;...XX:...:;;:;++x::::::::::....::XXXXXx:.XXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:.XX...:;+:+xX$&$x++;:::::.....:+XXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx:..::+;+xx$&&&;::::;::::....::XXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;.::;+++XX&&&&&&::..&&:::::...:.XXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX+:::;+x;x$&&&&&&&&:::&&&::::...::xXXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX::.++x:;X&&&xx&&&&&$;x&&&::::...::XXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX;:...+X+::+++$$&&&&&&$x;;X:::;:...:+XXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXX+....X;+&:+&&&&&&&&&&&&&&&$+:x;.:....XXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXX.......:;&xX&&&&&&&&&&&&&&&:X;:.......XXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXX.......;+:::;&&&&&&&&&&&&&&&+::........+XXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXX+..........::;X&&&&&&&&&&&&&:::..........XXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXX...........;::x;X&&&&&&&&&::.:..........:XXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXX:..............:;+$&&&$x;..............XXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.......:.......:+++++:.....:.......:XXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:....:::::.;;::....::::::;:.....:XXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:....:::::+XX$XXXXxXx:.........:XXXXXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX+;;::....:.:::+&&&&$&&$::...;;;+++++;+XXXXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXXX:;+:.;+;;+&$::....+&&&&:....:+$&+++;..::;:XXXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXXX;;;;..;;;;;&$xx.:::::X+.:;;::;xX&;;;;.:::;::XXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXX;:.::..;;;;x&xX+::;;&&&&&+++;:;x+&x;;;:.:::::xXXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXXx.:..:..:;;;&&;x;::;&&&&&&&++;::x;&$:;;:.:::...XXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXXx:::...:.::::&X;+:::;$&&&&&X+;;;:x;$&::::....::.xXXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXXX::::::...:::+&+;+:;;:;:x&$:;;;;;:++X&::::....:..:XXXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXXX::::::.:..:::x&:+;;+;x;::.:;+:;+:;;+X&::::...:::..+XXXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXXX:::::::.:..:::$&:+:;+;+++:;;;;++;:::++x;:::.....:..:;XXXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXX+:::::::....:::;::;:;::;++;;;;;;;::::;;::::......:...:+XXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXXx::::::.::...::.:.:;;::;;;+xXX+++++;;::+:.::.........:::XXXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXXX:;;;:..:::...::.:::;;:;;+;xxx;+;;;;;;::;:..:..........::.XXXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXX:;;:;;:...:..::..:::;;::;;++;;;;;;;++:::::..............:::XXXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXX...:::........::...:;::::::;;;;;;;++;;;::::..................XXXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXX.....::::....::...:;::::::::::::;;;;::..:............:......:XXXXXXXXXXXX<br>
		XXXXXXXXXXXXXXXXXXX+......::....::...:::::::::::::::::::...:.................::::XXXXXXXXXXX<br>
	</div>
	<div style="margin-left: 37%; margin-top: -30%; margin-bottom: 30%;">
		Username: <i>redacted</i><br>
		DOB: <i>redacted</i><br>
		Clearance: <span style="color: green;"><i>root access</i></span><br>
		<span style="color: #3b4eff;">-------------------------------</span><br>
		Main Channel :<a href="https://www.youtube.com/@kyphxr" target="_blank" style="color: #00d478;">[link]</a><br>
		Streaming Channel :<a href="https://www.youtube.com/@kyphxrtv" target="_blank" style="color: #00d478;">[link]</a><br>
		<span style="color: #3b4eff;">-------------------------------</span><br>
		user accounts: 27<br>
		scripts written: 267<br>
	</div>
	######################################################################################################################################################################################################<br>
	######################################################################################################################################################################################################
`;

const devMessage = `
	<div style="font-size: 18px;">
		<span style="color: red;">
			##################################################################################################################################### <br>
			##################################################################################################################################### <br>
			##################################################################################################################################### <br>
			######################################################
		</span> 
		<span style="color: #5e4dff;">MSG From the Developer</span> 
		<span style="color: red;">#######################################################</span> <br>
		<span style="color: #5e4dff;">ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤthis is the only not-in-universe msg you will recieve from me.</span> <br>
		<span style="color: red;">
			##################################################################################################################################### <br>
		</span>
	</div>
	<div style="font-size: 16px;">
		<span style="color: green;">
			This is a hacking game. Lying, stealing, social engineering, and subterfuge are highly encouraged. <br>
			You all have a single enemy, but that does not make you all allies. <br>
			Trust no one. <br>
		</span>
	</div>
	<div style="font-size: 18px;">
			<span style="color: red;">#####################################################################################################################################</span> <br>
	</div>
	<div style="font-size: 24px;">
		We have a ZERO TOLERANCE POLICY for hate speech, discrimination, abuse, and irl attacks <br>
		We can and will ban you. This is a game and a place for fun. Please allow others to enjoy it <br>
	</div>
	<div style="font-size: 18px;">
			<span style="color: red;">#####################################################################################################################################</span> <br>
	</div>
	use matrix.tut to get started
`;

const tutorialMatrix = `
	<div style="margin-left: 5%; font-size: 18px;">
		| 3743ㅤㅤㅤ9236ㅤㅤㅤ2845 |<br>
		<br><br>
		| 4951ㅤㅤㅤ8227ㅤㅤㅤ1483 |<br>
		<br><br>
		| 1926ㅤㅤㅤ1603ㅤㅤㅤ6717 |<br>
		<br>
	</div>
	use room [code] to view a rooms contents
`;
