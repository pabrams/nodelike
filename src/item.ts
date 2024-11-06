// item.ts
import {Dice} from './Dice';

interface ItemAttributes {
    name: string;
    type: 'melee_weapon' | 'armor' | 'potion' | 'grenade' | 'default'; 
    description: string;
    weight: number;
    average_market_price: number;
    rarity: string;
    x: number;
    y: number;
}

type MeleeDamageType = 'piercing' | 'blunt' | 'slashing';

// Define specific item types
interface MeleeWeaponAttributes extends ItemAttributes {
    damageDice: Dice;
    damageType: MeleeDamageType;
    finesse: boolean;
    thrown: boolean;
    heavy: boolean;
    light: boolean;
    reach: number; // units to add to personal reach when attacking
    two_handed: boolean;
    versatileDamage: number; // damage added when two hands are used
    
}

interface ArmorAttributes extends ItemAttributes {
    armor_class: number;
}

interface GrenadeAttributes extends ItemAttributes {
    explosive_power: number;
}

class Item {
    attributes: ItemAttributes;
    id: string; // Separate property for the item ID

    constructor(attributes: ItemAttributes) {
        this.attributes = attributes;
        this.id = `${attributes.name}_${attributes.x}_${attributes.y}`;
    }

    getInfo(): string {
        const { name, type, description } = this.attributes;
        return `${name} (Type: ${type}) - ${description}`;
    }
}

class MeleeWeapon extends Item {
    constructor(attributes: MeleeWeaponAttributes) {
        super(attributes); 
    }

    getInfo(): string {
        return `${super.getInfo()} | Damage: ${this.damageRange} (${this.damageType})`;
    }
}

class Armor extends Item {
    armorClass: number;

    constructor(attributes: ArmorAttributes) {
        super(attributes);
        this.armorClass = attributes.armor_class;
    }

    getInfo(): string {
        return `${super.getInfo()} | Armor Class: ${this.armorClass}`;
    }
}

class Potion extends Item {
    constructor(attributes: ItemAttributes) {
        super(attributes);
    }

    getInfo(): string {
        return `${super.getInfo()} | Effect: Restores health`;
    }
}

class Grenade extends Item {
    explosivePower: number;

    constructor(attributes: GrenadeAttributes) {
        super(attributes);
        this.explosivePower = attributes.explosive_power;
    }

    getInfo(): string {
        return `${super.getInfo()} | Explosive Power: ${this.explosivePower}`;
    }
}

export { Item, MeleeWeapon, Armor, Potion, Grenade, ItemAttributes, MeleeWeaponAttributes, ArmorAttributes, GrenadeAttributes };