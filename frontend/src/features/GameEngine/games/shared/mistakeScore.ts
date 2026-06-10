export function computeMistakeScore(completedUnits: number, mistakes: number): number {
  if (mistakes === 0) {
    return 100;
  }

  if (completedUnits === 0) {
    return 0;
  }

  return Math.round((completedUnits / (completedUnits + mistakes)) * 100);
}
