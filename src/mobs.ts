
export interface Mob {
    "name": string,
    "description": string,
    "race": string,
    "class": string,
    "level": number,
    "hp": number,
    "alignment": string,
    "attributes": Attributes
}

export interface Attributes {
    str: number
    dex: number
    agl: number
    spd: number
    con: number
    int: number
    wis: number
    cha: number
}

export interface MobGroup {
    ID: string
    
    intentions: string
    description: string
    longDescription: string
    members: Mob[]
}
  
export class GroupOfMobsPositioned {
    ID: string;
    intentions: string;
    description: string;
    longDescription: string;
    members: Mob[];
    x: number;
    y: number;
    
    constructor(group: MobGroup, x: number, y: number) {
        this.ID = group.ID;
        this.intentions = group.intentions;
        this.description = group.description;
        this.longDescription = group.longDescription;
        this.members = group.members;
        this.x = x;
        this.y = y;
    }
}