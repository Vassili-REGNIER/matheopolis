export interface GameAccessState {
  [riddleId: number]: boolean;
}

const defaultState: GameAccessState = {
  999: true,
  0: true,
  1: true,
  2: true
};

export class GameAccessService {
  private readonly storageKey = "matheopolis.enabledGames";

  public list(): GameAccessState {
    const raw = window.localStorage.getItem(this.storageKey);
    if (raw === null) {
      return { ...defaultState };
    }

    try {
      return { ...defaultState, ...JSON.parse(raw) as GameAccessState };
    } catch {
      window.localStorage.removeItem(this.storageKey);
      return { ...defaultState };
    }
  }

  public isEnabled(riddleId: number): boolean {
    return this.list()[riddleId] !== false;
  }

  public setEnabled(riddleId: number, enabled: boolean): void {
    const next = {
      ...this.list(),
      [riddleId]: enabled
    };
    window.localStorage.setItem(this.storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("games:updated", { detail: next }));
  }

  public toggle(riddleId: number): boolean {
    const nextValue = !this.isEnabled(riddleId);
    this.setEnabled(riddleId, nextValue);
    return nextValue;
  }
}
