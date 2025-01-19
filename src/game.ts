
import blessed from 'blessed';
import { Item, MeleeWeapon, Armor, Potion, Grenade, ItemAttributes, MeleeWeaponAttributes, ArmorAttributes, GrenadeAttributes } from './item.js';

import config from '../config/general.json' assert {type: 'json'};
import mapj from '../config/map.json' assert {type: 'json'};
import itemConfigJson from '../config/items.json' assert { type: 'json' };
import mobsConfig from '../config/mobs.json' assert { type: 'json'}
import terrainConfig from '../config/terrainTypes.json' assert {type: 'json'};

import { MobGroup, Mob, GroupOfMobsPositioned } from './mobs.js';

import {keyMappings as input} from './controls.js'

// Define a type for terrain visual configurations
interface TerrainType {
    coloredVisual: string; 
    sameSquareInteraction: string;
    coloredDescription: string;
    isPassable: boolean;
}

const terrainTypes: Record<string, TerrainType> = Object.fromEntries(
    Object.entries(terrainConfig).map(([key, value]) => [
        key,
        {
            coloredVisual: `{${value.fg}-fg}{${value.bg}-bg}${key}{/${value.fg}-fg}{/${value.bg}-bg}`,
            sameSquareInteraction: `${value.sameSquareInteraction}`,
            coloredDescription: `{${value.fg}-fg}{${value.bg}-bg}${value.description}{/${value.fg}-fg}{/${value.bg}-bg}`,
            isPassable: value.isPassable,
        }
    ])
);

const viewportWidth = config.viewPort.map.width;
const viewportHeight = config.viewPort.map.height;

const mapConfig = {
    mapWidth: mapj.terrainRows[0].length,
    mapHeight: mapj.terrainRows.length,
    playerStart: {"x": 1, "y": 1},
    terrain: mapj.terrainRows,
    items: mapj.items,
    mobs: mapj.mobs
};


const { mapWidth, mapHeight, playerStart, terrain } = mapConfig;

interface Player {
    partyMembers: MobGroup;
    x: number;
    y: number;
    inventory: Item[]; // Ensure inventory is defined as an array of Item
}

// Initialize game state based on the parsed configuration
const player: Player= {
    partyMembers: mobsConfig.mobGroups[0],
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

function createMobgroupInstance(mobKey: string, x: number, y: number): MobGroup | null {
    const mobDetail = mobsConfig.mobGroups.find((mobGroup) => mobGroup.ID === mobKey);
    if (!mobDetail) {
        console.error(`Mobgroup not found: ${mobKey}`);
        return null;
    }
    return new GroupOfMobsPositioned(mobDetail, x, y);  
}

function combat(mobGroup1: MobGroup, mobGroup2: GroupOfMobsPositioned) : void {
    const combatBox = blessed.box({
        top: config.viewPort.box.top,
        left: config.viewPort.box.left,
        width: config.viewPort.map.width,
        height: config.viewPort.map.height,
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: '#880088',
            },
            focus: {
                border: {
                    fg: '#ff00ff',
                },
            },
            bg: config.viewPort.box.bg,
            fg: config.viewPort.box.fg,
        },
    });
    
    // Create a box for the top content
    const topBox = blessed.box({
        top: 0,
        left: 0,
        width: '100%',
        height: '50%', // Adjust as needed
        content: mobGroup1.description,
        tags: true,
        style: {
            bg: config.viewPort.box.bg,
            fg: config.viewPort.box.fg,
        },
    });
    
    // Create a box for the bottom content
    const bottomBox = blessed.box({
        bottom: 0, // Position at the bottom of the parent
        left: 0,
        width: '100%',
        height: '50%', // Adjust as needed
        content: mobGroup2.description,
        tags: true,
        style: {
            bg: config.viewPort.box.bg,
            fg: config.viewPort.box.fg,
        },
    });
    
    // Append the sub-boxes to the combatBox
    combatBox.append(topBox);
    combatBox.append(bottomBox);
       
    // combatBox.setContent('{top}${mobGroup1.description}{/top}{bottom}${mobGroup2.description}{/bottom}');


    // Append the combatBox to the screen
    screen.append(combatBox);
    screen.render();
 
    // Update the combat panel with the current state of the game
    // place the two mobGroups onscreen in generated starting position for each mob according to  default formations that you will need to make up as you go. 
    // display the names and descriptions of the mob groups in the combat panel.
    // allow the player to choose a mob group to attack and display their available actions (e.g., attack, use a potion, etc.)
    // provide feedback to the player on their chosen action and the outcome (e.g., damage dealt, healing received, etc.)
    // update the combat panel with the new state of the game after the player's chosen action has been performed
    // continue the combat loop until one of the mob groups is defeated or the player runs out of health.
    // display a congratulatory message to the player and the winner, and exit the combat loop.
    // handle any potential errors or exceptions that may occur during the combat process and provide appropriate feedback to the player.
    // continue the game loop until the player chooses to exit the game.

}

// Initialize items from map configuration with their locations
let items: Item[] = mapConfig.items
    .map(({ key, x, y }) => createItemInstance(key, x, y))
    .filter((item): item is Item => item !== null);

let mapMobs = mapConfig.mobs
    .map(({key, x, y}) => createMobgroupInstance(key, x, y))
    .filter((mobGroupPositioned): mobGroupPositioned is GroupOfMobsPositioned => mobGroupPositioned !== null);

const screen = blessed.screen({
    smartCSR: true
});

// Create a box perfectly centered horizontally and vertically.
const mapPanel = blessed.box({
    top: config.viewPort.box.top,            
    left: config.viewPort.box.left,          
    width: config.viewPort.map.width + 2,      
    height: config.viewPort.map.height + 2,     
    content: '',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        border: {
            fg: '#880088',
        },
        focus: {
            border: {
                fg: '#ff00ff',
            }, 
        },
        bg: config.viewPort.box.bg,
        fg: config.viewPort.box.fg,
    },
});

screen.append(mapPanel);

const infoPanel = blessed.box({
    top: config.infoPanel.top,
    left: config.infoPanel.left,
    width: config.infoPanel.width,
    height: config.infoPanel.height,
    content: '',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        border: {
            fg: '#cccc00',
        },
        focus: {
            border: {
                fg: '#ffff00',
            }, 
        },
        bg: 'black',
        fg: 'magenta',
    },
});
screen.append(infoPanel);

function renderInfo(info: string) {
    infoPanel.setContent(info);
    screen.render();
}

function renderMap(mapString: string) {
    mapPanel.setContent(mapString);
    screen.render();
}

const debugPanel = blessed.box({
    top: config.debugPanel.top,
    left: config.debugPanel.left,
    width: config.debugPanel.width * 1.50,
    height: config.debugPanel.height,
    content: '',
    tags: true,
    border: {
        type: 'line',
    },
});

let debugContent: string[] = [];
    
if (config.debug){
    screen.append(debugPanel);
}

// Generate the game map based on the viewport
function drawMap() {
    const map = [];
    debugContent = [];
    // Calculate the top-left corner of the viewport
    const halfX = Math.floor(viewportWidth / 2);
    const halfY = Math.floor(viewportHeight / 2);
    const startX = Math.min(Math.max(0, player.x - halfX), mapWidth - viewportWidth);
    const startY = Math.min(Math.max(0, player.y - halfY), mapHeight - viewportHeight);
    const endX = Math.min(mapWidth, startX + viewportWidth);
    const endY = Math.min(mapHeight, startY + viewportHeight);

    if (config.debug){
        debugContent.push(`view size:{|}${viewportWidth},${viewportHeight}`);
        debugContent.push(`start offset: {|}${startX},${startY}`);
        debugContent.push(`end offset: {|}${endX},${endY}`);
        debugContent.push(`map size: {|}${mapWidth},${mapHeight}`);
        debugContent.push(`player pos: {|}${player.x},${player.y}`);
        debugContent.push(`relative pos: {|}${viewportWidth - player.x},${viewportHeight - player.y}`);
        debugContent.push(`halfView: {|}${halfX},${halfY}`);
        debugContent.push(` `);
        debugContent.push(`viewportWidth: {|} ${viewportWidth}`);   
        debugContent.push(`player.x: {|} ${player.x}`);
        debugContent.push(`halfX: {|} ${halfX}`);
        debugContent.push(`player.x - halfX: {|} ${player.x - halfX}`);
        debugContent.push(`startX (Math.max(0, player.x - halfX)): {|} ${startX}`);
        debugContent.push(`startX (Math.max(0, ${player.x - halfX})): {|} ${startX}`);
        debugContent.push(`endX (Math.min(mapWidth, startX + viewportWidth)): {|} ${endX}`);
        debugContent.push(`endX (Math.min(${mapWidth}, ${startX + viewportWidth})): {|} ${endX}`);
        
        debugPanel.setContent(debugContent.join('\n'));
        screen.render();
    }

    for (let y = startY; y < endY; y++) {
        const row = [];
        for (let x = startX; x < endX; x++) {
            if (x === player.x && y === player.y) {
                row.push(config.chars.player); // Player position
            } else if (mapMobs.some((mobGroup) => mobGroup.x === x && mobGroup.y === y)) {
                row.push(config.chars.mob);
            }
            else if (items.some(item => item.attributes?.x === x && item.attributes?.y === y)) {
                row.push(config.chars.item);
            } else {
                const terrainType = terrain[y][x];
                if (terrainType && terrainTypes[terrainType].coloredVisual) {
                    row.push(terrainTypes[terrainType].coloredVisual); // Terrain representation
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

function startGame() {
    displayMap();
    showInfo("");
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

    const terrainType = terrainTypes[mapConfig.terrain[player.y][player.x]];
    const infoText = `You are ${terrainType.sameSquareInteraction} ${terrainType.coloredDescription}`;
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
    screen.key([input.quit], () => {
        process.exit(0);
    });

    screen.key(input.displayHelp, () => displayHelp());
    screen.key(input.displayInventory, () => displayInventory());
    screen.key(input.pickupItem, () => pickUpItem());
    console.error(input);
    screen.key(
        [
            input.west, 
            input.south, 
            input.east, 
            input.north,
            input.ne,
            input.nw,
            input.sw,
            input.se
        ], (ch, key) => {
            movePlayer(key.name);
            displayMap(); // Draw the map after moving
        }
    );
}

function displayHelp() {
    const textFg = `${config.colors.text.fg}-fg`;
    const headingFg = `${config.colors.heading.fg}-fg`;
    const colonFg = `${config.colors.punctuation1.fg}-fg`;
    const colon = `{${colonFg}} : {/${colonFg}}`
    const commandFg = `${config.colors.pertinent.fg}-fg`;
    const helpText = [
        `{${headingFg}}Help Screen{/${headingFg}}`,
        `{${textFg}}Use the following keys to control the game:`,
        `{${commandFg}}WASD{/${commandFg}}${colon}Move up, left, down, right.`,
        `{${commandFg}}I   {/${commandFg}}${colon}View inventory.`,
        `{${commandFg}}P   {/${commandFg}}${colon}Pick up items.`,
        `{${commandFg}}H   {/${commandFg}}${colon}Show this help screen.`,
        `{${commandFg}}Q   {/${commandFg}}${colon}Quit the game.{/${textFg}}`,
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
        tags: true,
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'white',
            },
            focus: {
                border: {
                    fg: '#ffff00',
                }, 
            },
            bg: 'black',
            fg: 'white',
        },
    });

    screen.append(popupBox);
    popupBox.focus();
    screen.render();

    popupBox.on('keypress', (ch, key) => {
        popupBox.destroy();
        displayMap();
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

    if (direction === input.north && player.y > 0) {
        newY--;
    } else if (direction === input.west && player.x > 0) {
        newX--;
    } else if (direction === input.south && player.y < mapHeight - 1) {
        newY++;
    } else if (direction === input.east  && player.x < mapWidth - 1) {
        newX++;
    }    
    else if (direction === input.ne && player.y > 0 && player.x < mapWidth - 1 ) {
        newY--;
        newX++
    } else if (direction === input.nw && player.y > 0 && player.x > 0) {
        newY--;
        newX--;
    } else if (direction === input.se && player.y < mapHeight - 1 && player.x < mapWidth - 1) {
        newY++;
        newX++;
    } else if (direction === input.sw  && player.y < mapHeight - 1 && player.x > 0) {
        newY++;
        newX--;

    }

    // Check if the new position is passable
    if (isPassable(newX, newY)) {
        player.x = newX;
        player.y = newY;

        if (mapMobs.some(mob => mob.x === player.x && mob.y === player.y)) {
            const mobGroup = mapMobs.find(mob => mob.x === player.x && mob.y === player.y);
            mobGroup && combat(player.partyMembers, mobGroup);
        }
    } else {
        // Show an error message on the map
        const message = '{red-fg}The terrain is impassable in that direction.{/red-fg}';
        displayMap(); // Refresh the map display
        renderMap(message);
    }
    displayMap();
    showInfo("");
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
            inventoryLines.push(`{blue-fg}${index + 1}{/blue-fg}. {${textColor}}${item.getInfo()}{/${textColor}}`);
        });
    }
    const inventoryText = inventoryLines.join('\n');
    showPopupBox(inventoryText);
}

startGame();
