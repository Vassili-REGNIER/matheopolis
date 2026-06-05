import type { BaseGame, BaseGameContext } from "./BaseGame.js";
import type { BaseGameParams } from "./BaseGame.js";
import { BaseConversionGame } from "./BaseConversion/BaseConversionGame.js";
import { PianoFractionsGame } from "./PianoFractions/PianoFractionsGame.js";
import { HexConversionGame } from "./BaseConversion/HexConversionGame.js";
import { FractalLuthierGame } from "./FractalLuthier/FractalLuthierGame.js";

export type GameConstructor = new (
  container: HTMLElement,
  params: BaseGameParams,
  context: BaseGameContext
) => BaseGame;

const gamesRegistry: Record<string, GameConstructor> = {
  BaseConversion: BaseConversionGame,
  PianoFractions: PianoFractionsGame,
  HexConversion: HexConversionGame,
  FractalLuthier: FractalLuthierGame
};

export function getGameConstructor(gameId: string): GameConstructor | null {
  return gamesRegistry[gameId] ?? null;
}
