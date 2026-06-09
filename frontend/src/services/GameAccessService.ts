import type { GameAccessState } from "../models/services/GameAccess.js";

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

  public isEnabled(chapterId: number): boolean {
    return this.list()[chapterId] !== false;
  }

  public setEnabled(chapterId: number, enabled: boolean): void {
    const next = {
      ...this.list(),
      [chapterId]: enabled
    };
    window.localStorage.setItem(this.storageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("games:updated", { detail: next }));
  }

  public toggle(chapterId: number): boolean {
    const nextValue = !this.isEnabled(chapterId);
    this.setEnabled(chapterId, nextValue);
    return nextValue;
  }
}
