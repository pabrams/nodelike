const readline = require('readline');

// Define the game map
const mapWidth = 10;
const mapHeight = 10;
const player = { x: 0, y: 0, inventory: [] };
const exit = { x: mapWidth - 1, y: mapHeight - 1 };
const items = [
    { x: 3, y: 3, name: 'Sword' },
    { x: 5, y: 6, name: 'Shield' },
    { x: 8, y: 2, name: 'Health Potion' }
];

// Generate the game map
function generateMap() {
    const map = [];
    for (let y = 0; y < mapHeight; y++) {
        const row = [];
        for (let x = 0; x < mapWidth; x++) {
            if (x === player.x && y === player.y) {
                row.push('@'); // Player position
            } else if (x === exit.x && y === exit.y) {
                row.push('X'); // Exit position
            } else if (items.some(item => item.x === x && item.y === y)) {
                row.push('I'); // Item position
            } else {
                row.push('.'); // Empty space
            }
        }
        map.push(row);
    }
    return map;
}

// Display the game map
function displayMap(map) {
    console.clear();
    map.forEach(row => {
        console.log(row.join(' '));
    });
    console.log('Use W (up), A (left), S (down), D (right) to move.');
    console.log('Press I to view inventory. Press Q to quit.');
}

// Move the player based on input
function movePlayer(direction) {
    switch (direction.toLowerCase()) {
        case 'w': // up
            if (player.y > 0) player.y--;
            break;
        case 's': // down
            if (player.y < mapHeight - 1) player.y++;
            break;
        case 'a': // left
            if (player.x > 0) player.x--;
            break;
        case 'd': // right
            if (player.x < mapWidth - 1) player.x++;
            break;
    }
    checkForItemPickup();
}

// Check if the player is on an item and pick it up
function checkForItemPickup() {
    const itemIndex = items.findIndex(item => item.x === player.x && item.y === player.y);
    if (itemIndex !== -1) {
        const item = items.splice(itemIndex, 1)[0];
        player.inventory.push(item.name);
        console.log(`You picked up a ${item.name}!`);
    }
}

// Check if the player has reached the exit
function checkWin() {
    return player.x === exit.x && player.y === exit.y;
}

// Display the player's inventory
function displayInventory() {
    console.clear();
    console.log('Inventory:');
    if (player.inventory.length === 0) {
        console.log('Your inventory is empty.');
    } else {
        player.inventory.forEach((item, index) => {
            console.log(`${index + 1}. ${item}`);
        });
    }
    console.log('Press any key to return to the game.');
}

// Setup to read single keypress without pressing Enter
function setupInput() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit(); // Allow Ctrl+C to exit
        } else if (key.name === 'q') {
            console.log('You quit the game.');
            process.exit();
        } else if (key.name === 'i') {
            displayInventory();
        } else {
            movePlayer(key.name);
            const map = generateMap();
            displayMap(map);

            if (checkWin()) {
                console.log('You found the exit! You win!');
                process.exit();
            }
        }
    });
}

// Game loop
function gameLoop() {
    console.log('Welcome to the Roguelike Game!');
    const map = generateMap();
    displayMap(map);
    setupInput();
}

// Start the game
gameLoop();
