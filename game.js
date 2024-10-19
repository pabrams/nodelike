import readline from 'readline';
import chalk, { chalkStderr } from 'chalk';
import fs from 'fs';
import { Item, MeleeWeapon, Armor, Potion, Grenade } from './item.js';
import { getRandomValues } from 'crypto';

const viewportWidth = 20;
const viewportHeight = 12;

// Terrain visual representations and colors
const terrainVisuals = {
    ".": chalk.green('.'),
    ":": chalk.gray(':'),
    "#": chalk.bgGray('#')
};
const terrainDescriptions = {
    ".": chalk.green("grass"),
    ":": chalk.grey("gravel"), 
    "#": chalk.gray("wall"),
    " ": chalk.yellow("dirt")
}

// Load color configuration
let config;
try {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} catch (error) {
    console.error('Error reading config file:', error);
    process.exit(1);
}

// Function to parse the map from a text file
function parseMapFile(filename) {
    const mapj = JSON.parse(fs.readFileSync(filename, 'utf8'));

    const mapData = {
        mapWidth: mapj.terrainLines[0].length,
        mapHeight: mapj.terrainLines.length,
        playerStart: {"x": 1, "y": 1},
        terrain: mapj.terrainLines,
        items: mapj.items
    };
    return mapData;
}

// Load the map configuration from the file
const mapConfig = parseMapFile('map.json');
const { mapWidth, mapHeight, playerStart, terrain, items } = mapConfig;

// Initialize game state based on the parsed configuration
const player = {
    x: playerStart.x,
    y: playerStart.y,
    inventory: []
};

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
const emptySpaceColor = chalk[config.emptySpaceColor] || chalk.white;

// Initialize items from map configuration with their locations
let fullItems = mapConfig.items.map(({ key, x, y }) => createItemInstance(key, x, y));

// Function to create item instances based on configuration and location
function createItemInstance(itemKey, x, y) {
    const itemDetail = itemConfig[itemKey];
    if (!itemDetail) {
        console.error(`Item not found: ${itemKey}`);
        return null;
    }

    switch (itemDetail.type) {
        case 'melee_weapon':
            return new MeleeWeapon(itemDetail, x, y);
        case 'armor':
            return new Armor(itemDetail, x, y);
        case 'potion':
            return new Potion(itemDetail, x, y);
        case 'grenade':
            return new Grenade(itemDetail, x, y);
        default:
            return new Item(itemDetail, x, y);
    }
}

// Generate the game map based on the viewport
function drawMap() {
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
            } else if (fullItems.some(item => item.x === x && item.y === y)) {
                row.push(itemColor('I')); // Item position
            } else {
                const terrainType = terrain[y][x];
                if (terrainType && terrainVisuals[terrainType]) {
                    row.push(terrainVisuals[terrainType]); // Terrain representation
                } else {
                    row.push(emptySpaceColor(' ')); // Empty space, or dirt
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
    console.log(chalk.green('Use h for help.'));
    showTerrainUnderPlayer();
}

function showTerrainUnderPlayer() {
    console.log (
        chalk.blue('You are standing on ') + 
        chalk.yellowBright(
            terrainDescriptions[mapConfig.terrain[player.y][player.x]])
        )
}

// Check if the player is on an item and display a message
function checkForItemUnderPlayer() {
    const item = fullItems.find(item => item.x === player.x && item.y === player.y);
    if (item) {
        console.log(itemColor(`You see a ${item.name} here: ${item.description}`));
    }
}

// Explicitly pick up an item when the player presses "P"
function pickUpItem() {
    const itemIndex = fullItems.findIndex(item => item.x === player.x && item.y === player.y);
    if (itemIndex !== -1) {
        const item = fullItems.splice(itemIndex, 1)[0];
        player.inventory.push(item);
        console.log(chalk.blue(`You picked up a ${item.name}!`));
        
        // Refresh the map to reflect the item removal
        const map = drawMap();
        displayMap(map);
    } else {
        console.log(chalk.yellow('There is no item to pick up here.'));
    }
}

// Game loop
function gameLoop() {
    console.log('Welcome to the Nodelike Game!');
    const map = drawMap();
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
        } else if (key.name === 'h') {
            displayHelp(); // Show help screen
        } else if (key.name === 'q') {
            console.log('You quit the game.');
            process.exit();
        } else if (key.name === 'i') {
            displayInventory();
        } else if (key.name === 'p') {
            pickUpItem();
        } else {
            movePlayer(key.name); // Move the player
            const map = drawMap(); // Draw the map after moving
            displayMap(map); // Display the updated map
            setImmediate(() => { // Use setImmediate to ensure output
                checkForItemUnderPlayer(); // Check for items under the player
            });
        }
    });
}

function displayHelp() {
    console.clear();
    console.log(chalk.green('Help Screen'));
    console.log(chalk.yellow('Use the following keys to control the game:'));
    console.log(
        chalk.white('WASD') + 
        chalk.yellowBright(' : ') + 
        chalk.green('Move up, left, down, right.')
    );
    console.log(
        chalk.white('P   ') + 
        chalk.yellowBright(' : ') + 
        chalk.green('Pick up items.')
    );
    console.log(
        chalk.white('I   ') + 
        chalk.yellowBright(' : ') + 
        chalk.green('View intentory.')
    );
    console.log(
        chalk.white('H   ') + 
        chalk.yellowBright(' : ') + 
        chalk.green('Show this help screen.')
    );
    console.log(
        chalk.white('Q   ') + 
        chalk.yellowBright(' : ') + 
        chalk.green('Quit the game.')
    );
    console.log(chalk.green('Press any key to return to the game.'));
    
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.once('keypress', () => {
        setupInput(); // Return to input mode
        const map = drawMap();
        displayMap(map);
    });
}

// Check if the terrain is passable at the specified coordinates
function isPassable(x, y) {
    const terrainType = mapConfig.terrain[y][x];
    return terrainType !== '#';
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
    const map =  drawMap();
    displayMap(map);
}

// Display player's inventory
function displayInventory() {
    console.log(chalk.green('Inventory:'));
    if (player.inventory.length === 0) {
        console.log('Your inventory is empty.');
    } else {
        player.inventory.forEach((item, index) => {
            console.log(`${index + 1}. ${item.getInfo()}`);
        });
    }
}

gameLoop();
