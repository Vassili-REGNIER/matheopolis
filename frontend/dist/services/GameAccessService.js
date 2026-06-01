const defaultState = {
    999: true,
    0: true,
    1: true,
    2: true
};
export class GameAccessService {
    storageKey = "matheopolis.enabledGames";
    list() {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw === null) {
            return { ...defaultState };
        }
        try {
            return { ...defaultState, ...JSON.parse(raw) };
        }
        catch {
            window.localStorage.removeItem(this.storageKey);
            return { ...defaultState };
        }
    }
    isEnabled(riddleId) {
        return this.list()[riddleId] !== false;
    }
    setEnabled(riddleId, enabled) {
        const next = {
            ...this.list(),
            [riddleId]: enabled
        };
        window.localStorage.setItem(this.storageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("games:updated", { detail: next }));
    }
    toggle(riddleId) {
        const nextValue = !this.isEnabled(riddleId);
        this.setEnabled(riddleId, nextValue);
        return nextValue;
    }
}
