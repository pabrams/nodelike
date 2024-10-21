// item.ts
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

// Define specific item types
interface MeleeWeaponAttributes extends ItemAttributes {
    damage_range: string;
    damage_type: string;
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
    damageRange: string;
    damageType: string;

    constructor(attributes: MeleeWeaponAttributes) {
        super(attributes);
        this.damageRange = attributes.damage_range;
        this.damageType = attributes.damage_type;
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