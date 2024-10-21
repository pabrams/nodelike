import blessed from 'blessed';
import { Item, MeleeWeapon, Armor, Potion, Grenade, ItemAttributes, MeleeWeaponAttributes, ArmorAttributes, GrenadeAttributes } from './item.js';

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

const terrainTypes: Record<string, TerrainType> = Object.fromEntries(
    Object.entries(terrainConfig).map(([key, value]) => [
        key,
        {
            visual: `{${value.fg}-fg}${key}{/${value.fg}-fg}`,
            description: `{${value.fg}-fg}${value.description}{/${value.fg}-fg}`,
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
    .filter((item): item is Item => item !== null);

const screen = blessed.screen({
    smartCSR: true
});

// Create a box perfectly centered horizontally and vertically.
const mapPanel = blessed.box({
    top: '0',           
    left: '0',          
    width: '100%',      
    height: '80%',     
    content: '',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        border: {
            fg: 'cyan',
        },
        bg: 'black',
        fg: 'magenta',
    },
});

screen.append(mapPanel);

const infoPanel  = blessed.box({
    top: '80%',
    left: '0',
    width: '100%',
    height: '20%',
    content: '',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        border: {
            fg: 'cyan',
        },
        bg: 'black',
        fg: 'magenta',
    },
});

function renderInfo(info: string) {
    infoPanel.setContent(info);
    screen.render();
}

function renderMap(mapString: string) {
    mapPanel.setContent(mapString);
    screen.render();
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
            
            const playercolor = `${config.colors.player.fg}-fg`;
            const itemcolor = `${config.colors.items.fg}-fg`;
            if (x === player.x && y === player.y) {
                row.push(`{${playercolor}}@{/${playercolor}}`); // Player position
            } else if (items.some(item => item.attributes?.x === x && item.attributes?.y === y)) {
                row.push(`{${itemcolor}}I{/${itemcolor}}`); // Item positionafffff
            } else {
                const terrainType = terrain[y][x];
                if (terrainType && terrainTypes[terrainType].visual) {
                    row.push(terrainTypes[terrainType].visual); // Terrain representation
                }
            }
        }
        map.push(row.join(''));
    }
    return map.join('\n');
}

// Display the generated map
function displayMap() {
    const mapString = drawMap();
    renderMap(mapString);
}

function gameLoop() {
    console.log('Welcome to the Nodelike Game!');
    displayMap();
    setupInput();
}

function showInfo(extraInfo: string){
    
    const infoText = 
        showTerrainUnderPlayer() + '\n' + 
        checkForItemUnderPlayer() + '\n' + 
        extraInfo;
    
    renderInfo(infoText);
}


function showTerrainUnderPlayer() {
    const infoText = `{cyan-fg}You are standing on {/cyan-fg} + 
        terrainTypes[mapConfig.terrain[player.y][player.x]].description`;
    return infoText;
}

// Check if the player is on an item and display a message
function checkForItemUnderPlayer() {
    const item = items.find(item => item?.attributes.x === player.x && item.attributes.y === player.y);
    let itemText = '';
    if (item) {
        itemText += `You see a ${item.attributes.name} here: ${item.attributes.description}`;
    }
    return itemText
}

// Explicitly pick up an item when the player presses "P"
function pickUpItem() {
    const itemIndex = items.findIndex(item => item.attributes.x === player.x && item.attributes.y === player.y);
    let statusText;

    if (itemIndex !== -1) {
        const item = items.splice(itemIndex, 1)[0] as Item; // Assert item as Item
        player.inventory.push(item);

        statusText = `{yellow-fg}You picked up a {white-fg}${item.attributes.name}{/white-fg}!{/yellow-fg}`;

        // Refresh the map to reflect the item removal
        displayMap();
    } else {
        statusText = '{red-fg}There is no item to pick up here.{/red-fg}';
    }
    showInfo(statusText);
}

function setupInput() {
    screen.key(['escape', 'q', 'C-c'], () => {
        process.exit(0);
    });

    screen.key('h', () => displayHelp());
    screen.key('i', () => displayInventory());
    screen.key('p', () => pickUpItem());
    screen.key(['w', 'a', 's', 'd'], (ch, key) => {
        movePlayer(key.name);
        displayMap(); // Draw the map after moving
    });
}

function displayHelp() {
    const textColor = config.colors.text.fg;
    const headingColor = config.colors.heading.fg;
    const colonFg = `${config.colors.punctuation1.fg}-fg`;
    const commandFg = `${config.colors.pertinent.fg}-fg`;
    const helpText = [
        `${textColor}Help Screen`,
        `{${headingColor}-fg}Use the following keys to control the game:{/${headingColor}-fg}`,
        `{${commandFg}}WASD{/${commandFg}}` + `{${colonFg}} : {/${colonFg}}` + `Move up, left, down, right.`,
        `{${commandFg}}I   {/${commandFg}}` + `{${colonFg}} : {/${colonFg}}` + `View inventory.`,
        `{${commandFg}}P   {/${commandFg}}` + `{${colonFg}} : {/${colonFg}}` + `Pick up items.`,
        `{${commandFg}}H   {/${commandFg}}` + `{${colonFg}} : {/${colonFg}}` + `Show this help screen.`,
        `{${commandFg}}Q   {/${commandFg}}` + `{${colonFg}} : {/${colonFg}}` + `Quit the game.{/${textColor}}`,
    ].join('\n');
    showPopupBox(helpText);
}

function showPopupBox(content: string){

    const popupBox = blessed.box({
        top: 'center',
        left: 'center',
        width: '50%',
        height: '50%',
        content: content,
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'white',
            },
            bg: 'black',
            fg: 'white',
        },
    });

    screen.append(popupBox);
    screen.render();

    popupBox.on('keypress', (ch, key) => {
        if (key.name === 'escape' || key.name === 'q') {
            popupBox.destroy();
            setupInput();
            displayMap(); // Return to the game
        }
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
        // Show an error message on the map
        const message = '{red-fg}The terrain is impassable in that direction.{/red-fg}';
        displayMap(); // Refresh the map display
        renderMap(message);
    }

    displayMap();
}


function displayInventory() {
    const textColor = `${config.colors.text.fg}-fg`;
    const headingColor = `${config.colors.heading.fg}-fg`;
    let inventoryLines = [
        `{${headingColor}}Inventory{/${headingColor}}`
    ];
    if (player.inventory.length === 0) {
        inventoryLines.push(`{${textColor}}Your inventory is empty.{/${textColor}}`)
    } else {
        player.inventory.forEach((item, index) => {
            inventoryLines.push(`{blue-fg}${index + 1}{/blue-fg}. {${textColor}${item.getInfo()}{/${textColor}}`);
        });
    }
    const inventoryText = inventoryLines.join('\n');
    showPopupBox(inventoryText);
}

gameLoop();
