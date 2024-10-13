import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import { Item, MeleeWeapon, Armor, Potion, Grenade } from './item.js';

const viewportWidth = 20;
const viewportHeight = 16;

// Terrain visual representations and colors
const terrainVisuals = {
    grass: chalk.green('"'),
    gravel: chalk.gray(':'),
    wall: chalk.bgGray('#')
};

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

// Load item configurations
let itemConfig;
try {
    itemConfig = JSON.parse(fs.readFileSync('items.json', 'utf8'));
} catch (error) {
    console.error('Error reading items configuration file:', error);
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

// Initialize items from map configuration with their locations
let items = mapConfig.items.map(({ key, x, y }) => createItemInstance(key, x, y));

// Function to create item instances based on configuration and location
function createItemInstance(itemKey, x, y) {
    const itemData = itemConfig[itemKey];
    if (!itemData) {
        console.error(`Item not found: ${itemKey}`);
        return null;
    }

    switch (itemData.type) {
        case 'melee_weapon':
            return new MeleeWeapon(itemData, x, y);
        case 'armor':
            return new Armor(itemData, x, y);
        case 'potion':
            return new Potion(itemData, x, y);
        case 'grenade':
            return new Grenade(itemData, x, y);
        default:
            return new Item(itemData, x, y);
    }
}

// Generate the game map based on the viewport
function generateMap() {
    const map = [];

    // Calculate the top-left corner of the viewport
    const startX = Math.max(0, player.x - Math.floor(viewportWidth / 2));
    const startY = Math.max(0, player.y - Math.floor(viewportHeight / 2));
    const endX = Math.min(mapWidth, startX + viewportWidth);
    const endY = Math.min(mapHeight, startY + viewportHeight);

    for (let y = startY; y < endY; y++) {
        const row = [];
        for (let x = startX; x < endX; x++) {
            if (x === player.x && y === player.y) {
                row.push(playerColor('@')); // Player position
            } else if (x === exit.x && y === exit.y) {
                row.push(exitColor('X')); // Exit position
            } else if (items.some(item => item.x === x && item.y === y)) {
                row.push(itemColor('I')); // Item position
            } else {
                const terrainType = mapConfig.terrain.find(t => t.x === x && t.y === y)?.type;
                if (terrainType && terrainVisuals[terrainType]) {
                    row.push(terrainVisuals[terrainType]); // Terrain representation
                } else {
                    row.push(emptySpaceColor('.')); // Empty space
                }
            }
        }
        map.push(row);
    }
    return map;
}

// Display the generated map
function displayMap(map) {
    console.clear();
    map.forEach(row => {
        console.log(row.join(''));
    });
    console.log(chalk.green('Use WASD to move. Press P to pick up items.'));
    displayInventory();
}

// Check if the player is on an item and display a message
function checkForItemUnderPlayer() {
    const item = items.find(item => item.x === player.x && item.y === player.y);
    if (item) {
        console.log(itemColor(`You see a ${item.name} here: ${item.description}`));
    }
}

// Explicitly pick up an item when the player presses "P"
function pickUpItem() {
    const itemIndex = items.findIndex(item => item.x === player.x && item.y === player.y);
    if (itemIndex !== -1) {
        const item = items.splice(itemIndex, 1)[0];
        player.inventory.push(item);
        console.log(chalk.blue(`You picked up a ${item.name}!`));
        
        // Refresh the map to reflect the item removal
        const map = generateMap();
        displayMap(map);
    } else {
        console.log(chalk.yellow('There is no item to pick up here.'));
    }
}

// Game loop
function gameLoop() {
    console.log('Welcome to the Roguelike Game!');
    const map = generateMap();
    displayMap(map);
    setupInput();
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
            checkForItemUnderPlayer(); // Check for items after updating the map

            if (checkWin()) {
                console.log('You found the exit! You win!');
                process.exit();
            }
        }
    });
}
// Check if the terrain is passable at the specified coordinates
function isPassable(x, y) {
    const terrainType = mapConfig.terrain.find(t => t.x === x && t.y === y)?.type;
    return terrainType !== 'wall';
}

// Movement logic for player
function movePlayer(direction) {
    let newX = player.x;
    let newY = player.y;

    if (direction === 'w' && player.y > 0) {
        newY--;
    } else if (direction === 'a' && player.x > 0) {
        newX--;
    } else if (direction === 's' && player.y < mapHeight - 1) {
        newY++;
    } else if (direction === 'd' && player.x < mapWidth - 1) {
        newX++;
    }

    // Check if the new position is passable
    if (isPassable(newX, newY)) {
        player.x = newX;
        player.y = newY;
    } else {
        console.log(chalk.red('You cannot move there. It is impassable!'));
    }

    // Refresh the map display after moving
    const map = generateMap();
    displayMap(map);
}

// Check if the player has reached the exit
function checkWin() {
    return player.x === exit.x && player.y === exit.y;
}

// Display player's inventory
function displayInventory() {
    console.log(chalk.magenta('Inventory:'));
    if (player.inventory.length === 0) {
        console.log('Your inventory is empty.');
    } else {
        player.inventory.forEach((item, index) => {
            console.log(`${index + 1}. ${item.getInfo()}`);
        });
    }
}

gameLoop();
