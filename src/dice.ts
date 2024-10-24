import { resourceLimits } from "worker_threads";

class Dice {
    private quantity: number;       // Number of dice to roll
    private sides: number;          // Number of sides per die
    private advantage: boolean = false;   // If advantaged, roll two dice for each one, and choose the highest of two numbers rolled.
    private disadvantage: boolean = false;          // If disadvantaged, do the same thing but choose the lowest.
    private results: number[];    
    private singleRolls: number[]; 

    constructor(quantity: number, sides: number, advantage: boolean = false, disadvantage: boolean = false) {
        this.quantity = quantity;
        this.sides = sides;
        this.advantage = advantage;
        this.disadvantage = disadvantage;
        this.results = [];
        this.singleRolls = [];
    }
    
    // Roll the dice and output each result along with the total
    public roll(): void {
        let total = 0;

        for (let i = 0; i < this.quantity; i++) {
            if (this.advantage){
                const result = this.rollWithAdvantage();
                this.results.push(result);
                total += result;
            }else if (this.disadvantage){
                const result = this.rollWithDisadvantage();
                this.results.push(result);
                total += result;
            }else {
                const result = this.rollSingleDie();
                this.results.push(result);
                total += result;
            }
        }

        // Output results to the console
        console.log(`Rolled ${this.quantity}d${this.sides}: ${this.results.join(', ')} (Total: ${total})`);
    }

    public result(): number {
        return this.results.reduce((runningTotal: number, value: number) => {
            return runningTotal + value;
        }, 0);
    }

    // Helper method to simulate rolling a single die
    private rollSingleDie(): number {
        const roll = Math.floor(Math.random() * this.sides) + 1;
        this.singleRolls.push(roll);
        console.log(`rolled ${roll}`);
        return roll;
    }

    private rollWithAdvantage(): number {
        const rollResult = Math.max(this.rollSingleDie(), this.rollSingleDie());
        console.log(`roll with Advantage: ${rollResult}`)
        return rollResult;
    }

    private rollWithDisadvantage(): number {
        const rollResult =  Math.min(this.rollSingleDie(), this.rollSingleDie());
        console.log(`roll with disadvantage: ${rollResult}`);
        return rollResult;
    }
}


/*
// Example usage:
const dice = new Dice(3, 6);  // Create a dice instance for 3 six-sided dice
dice.roll();  // Simulate rolling the dice
*/