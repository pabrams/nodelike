// item.js
class Item {
    constructor({ name, type, description, weight, average_market_price, rarity }, x, y) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.weight = weight;
        this.averageMarketPrice = average_market_price;
        this.rarity = rarity;
        this.x = x;
        this.y = y;
        this.id = `${name}_${x}_${y}`
    }

    getInfo() {
        return `${this.name} (Type: ${this.type}) - ${this.description}`;
    }
}

class MeleeWeapon extends Item {
    constructor({ damage_range, damage_type, ...commonAttributes }, x, y) {
        super(commonAttributes, x, y);
        this.damageRange = damage_range;
        this.damageType = damage_type;
    }

    getInfo() {
        return `${super.getInfo()} | Damage: ${this.damageRange} (${this.damageType})`;
    }
}

class Armor extends Item {
    constructor({ armor_class, ...commonAttributes }, x, y) {
        super(commonAttributes, x, y);
        this.armorClass = armor_class;
    }

    getInfo() {
        return `${super.getInfo()} | Armor Class: ${this.armorClass}`;
    }
}

class Potion extends Item {
    constructor(commonAttributes, x, y) {
        super(commonAttributes, x, y);
    }

    getInfo() {
        return `${super.getInfo()} | Effect: Restores health`;
    }
}

class Grenade extends Item {
    constructor({ explosive_power, ...commonAttributes }, x, y) {
        super(commonAttributes, x, y);
        this.explosivePower = explosive_power;
    }

    getInfo() {
        return `${super.getInfo()} | Explosive Power: ${this.explosivePower}`;
    }
}

export { Item, MeleeWeapon, Armor, Potion, Grenade };
