export class SequenceManager {
    steps;
    currentIndex = 0;
    constructor(steps) {
        this.steps = steps;
    }
    getCurrentStep() {
        return this.steps[this.currentIndex] ?? null;
    }
    advanceToNextStep() {
        if (!this.hasNextStep()) {
            return false;
        }
        this.currentIndex += 1;
        return this.getCurrentStep() !== null;
    }
    hasNextStep() {
        return this.currentIndex < this.steps.length - 1;
    }
}
