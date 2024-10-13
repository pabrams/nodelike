import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';

// Load color configuration
let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Error reading config file:', error);
    process.exit(1);
}

// Load map configuration
let mapConfig;
try {
    mapConfig = JSON.parse(fs.readFileSync('map.json', 'utf8'));
} catch (error) {
    console.error('Error reading map file:', error);
    process.exit(1);
}

// Get colors from the configuration
const playerColor = chalk[config.playerColor] || chalk.green;
const itemColor = chalk[config.itemColor] || chalk.yellow;
const exitColor = chalk[config.exitColor] || chalk.red;
const emptySpaceColor = chalk[config.emptySpaceColor] || chalk.white;

// Define the game map using map configuration
const mapWidth = mapConfig.mapWidth;
const mapHeight = mapConfig.mapHeight;
const player = { x: mapConfig.playerStart.x, y: mapConfig.playerStart.y, inventory: [] };
const exit = { x: mapConfig.exit.x, y: mapConfig.exit.y };
const items = mapConfig.items.map(item => ({ ...item }));

// Generate the game map
function generateMap() {
    const map = [];
    for (let y = 0; y < mapHeight; y++) {
        const row = [];
        for (let x = 0; x < mapWidth; x++) {
            if (x === player.x && y === player.y) {
                row.push(playerColor('@')); // Player position
            } else if (x === exit.x && y === exit.y) {
                row.push(exitColor('X')); // Exit position
            } else if (items.some(item => item.x === x && item.y === y)) {
                row.push(itemColor('I')); // Item position
            } else {
                row.push(emptySpaceColor('.')); // Empty space
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
    console.log('Press P to pick up an item. Press I to view inventory. Press Q to quit.');
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
}

// Explicitly pick up an item when the player presses "P"
function pickUpItem() {
    const itemIndex = items.findIndex(item => item.x === player.x && item.y === player.y);
    if (itemIndex !== -1) {
        const item = items.splice(itemIndex, 1)[0];
        player.inventory.push(item.name);
        console.log(chalk.blue(`You picked up a ${item.name}!`));
    } else {
        console.log(chalk.yellow('There is no item to pick up here.'));
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
        } else if (key.name === 'p') {
            pickUpItem();
        } else {
            movePlayer(key.name);
            const map = generateMap();
            displayMap(map);

            if (checkWin()) {
                console.log(chalk.green('You found the exit! You win!'));
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
