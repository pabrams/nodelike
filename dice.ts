class Dice {
    private quantity: number;  // Number of dice to roll
    private sides: number;     // Number of sides per die

    constructor(quantity: number, sides: number) {
        this.quantity = quantity;
        this.sides = sides;
    }

    // Roll the dice and output each result along with the total
    public roll(): void {
        const results: number[] = [];
        let total = 0;

        // Roll each die and accumulate results
        for (let i = 0; i < this.quantity; i++) {
            const rollResult = this.rollSingleDie();
            results.push(rollResult);
            total += rollResult;
        }

        // Output results to the console
        console.log(`Rolled ${this.quantity}d${this.sides}: ${results.join(', ')} (Total: ${total})`);
    }

    // Helper method to simulate rolling a single die
    private rollSingleDie(): number {
        return Math.floor(Math.random() * this.sides) + 1;
    }
}


/*
// Example usage:
const dice = new Dice(3, 6);  // Create a dice instance for 3 six-sided dice
dice.roll();  // Simulate rolling the dice
*/