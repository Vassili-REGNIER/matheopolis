export class BaseGame {
    container;
    difficulty;
    params;
    context;
    disposers = [];
    constructor(container, difficulty, params, context) {
        this.container = container;
        this.difficulty = difficulty;
        this.params = params;
        this.context = context;
    }
    destroy() {
        this.clearListeners();
        this.container.innerHTML = "";
    }
    clearListeners() {
        while (this.disposers.length > 0) {
            const dispose = this.disposers.pop();
            if (dispose !== undefined) {
                dispose();
            }
        }
    }
    listen(target, type, listener) {
        target.addEventListener(type, listener);
        this.disposers.push(() => target.removeEventListener(type, listener));
    }
    complete(score, answer) {
        this.container.dispatchEvent(new CustomEvent("gameWon", {
            bubbles: true,
            detail: { score, answer }
        }));
    }
}
