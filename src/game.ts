import readline from 'readline';
import { Item, MeleeWeapon, Armor, Potion, Grenade, ItemAttributes, MeleeWeaponAttributes, ArmorAttributes, GrenadeAttributes } from './item';
import chalk from 'chalk';

import config from '../config/general.json' assert {type: 'json'};
import mapj from '../config/map.json' assert {type: 'json'};
import itemConfigJson from '../config/items.json' assert { type: 'json' };
import terrainConfig from '../config/terrainTypes.json' assert {type: 'json'};

// Define a type for terrain visual configurations
interface TerrainType {
    visual: string;
    description: string;
    isPassable: boolean;
}

// Utility function to safely get a Chalk color function
function getChalkColorFunction(color: string): (text: string) => string {
    const chalkFunction = (chalk as any)[color];
    if (typeof chalkFunction === 'function') {
        return chalkFunction;
    }
    return chalk.white; // Fallback to white if the color function is not found
}

// Transform the terrain configuration to include dynamic chalk colors
const terrainTypes: Record<string, TerrainType> = Object.fromEntries(
    Object.entries(terrainConfig).map(([key, value]) => [
        key,
        {
            visual: getChalkColorFunction(value.colour)(key),
            description: getChalkColorFunction(value.colour)(value.description),
            isPassable: value.isPassable,
        }
    ])
);

const viewportWidth = 20;
const viewportHeight = 12;

const mapConfig = {
    mapWidth: mapj.terrainRows[0].length,
    mapHeight: mapj.terrainRows.length,
    playerStart: {"x": 1, "y": 1},
    terrain: mapj.terrainRows,
    items: mapj.items
};


const { mapWidth, mapHeight, playerStart, terrain } = mapConfig;

interface Player {
    x: number;
    y: number;
    inventory: Item[]; // Ensure inventory is defined as an array of Item
}

// Initialize game state based on the parsed configuration
const player: Player= {
    x: playerStart.x,
    y: playerStart.y,
    inventory: []
};

// Get colors from the configuration
const playerColor = getChalkColorFunction(config.playerColor);
const itemColor = getChalkColorFunction(config.itemColor);


// Define a type for the complete item config
type ItemConfig = {
    [key: string]: ItemAttributes | MeleeWeaponAttributes | ArmorAttributes | GrenadeAttributes;
};

// Cast the imported JSON to the defined type
const itemConfig: ItemConfig = itemConfigJson as ItemConfig;

function createItemInstance(itemKey: string, x: number, y: number): Item | null {
    const itemDetail = itemConfig[itemKey];
    if (!itemDetail) {
        console.error(`Item not found: ${itemKey}`);
        return null;
    }

    const commonAttributes = { ...itemDetail, x, y };

    // Handle different item types
    switch (itemDetail.type) {
        case 'melee_weapon':
            return new MeleeWeapon(commonAttributes as MeleeWeaponAttributes);
        case 'armor':
            return new Armor(commonAttributes as ArmorAttributes);
        case 'potion':
            return new Potion(commonAttributes as ItemAttributes);
        case 'grenade':
            return new Grenade(commonAttributes as GrenadeAttributes);
        default:
            return new Item(commonAttributes as ItemAttributes);
    }
}

// Initialize items from map configuration with their locations
let items: Item[] = mapConfig.items
    .map(({ key, x, y }) => createItemInstance(key, x, y))
    .filter((item): item is Item => item !== null); // This ensures only Item instances remain


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
            } else if (items.some(item => item.attributes?.x === x && item.attributes?.y === y)) {
                row.push(itemColor('I')); // Item position
            } else {
                const terrainType = terrain[y][x];
                if (terrainType && terrainTypes[terrainType].visual) {
                    row.push(terrainTypes[terrainType].visual); // Terrain representation
                }
            }
        }
        map.push(row);
    }
    return map;
}

// Display the generated map
function displayMap(map: any[]) {
    console.clear();
    map.forEach((row: any[]) => {
        console.log(row.join(''));
    });
    console.log(chalk.green('Use h for help.'));
    showTerrainUnderPlayer();
}

function showTerrainUnderPlayer() {
    console.log (
        chalk.blue('You are standing on ') + 
        chalk.yellowBright(terrainTypes[mapConfig.terrain[player.y][player.x]].description)
    )
}

// Check if the player is on an item and display a message
function checkForItemUnderPlayer() {
    const item = items.find(item => item?.attributes.x === player.x && item.attributes.y === player.y);
    if (item) {
        console.log(itemColor(`You see a ${item.attributes.name} here: ${item.attributes.description}`));
    }
}

// Explicitly pick up an item when the player presses "P"
function pickUpItem() {
    const itemIndex = items.findIndex(item => item.attributes.x === player.x && item.attributes.y === player.y);
    if (itemIndex !== -1) {
        const item = items.splice(itemIndex, 1)[0] as Item; // Assert item as Item
        player.inventory.push(item);
        console.log(chalk.blue(`You picked up a ${item.attributes.name}!`)); // Access name via attributes

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
function isPassable(x: number, y: number) {
    const terrainType = mapConfig.terrain[y][x];
    return terrainTypes[terrainType].isPassable;
}

// Movement logic for player
function movePlayer(direction: string) {
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
