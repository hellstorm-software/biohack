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
