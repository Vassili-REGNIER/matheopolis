import type { GameConstructor } from "../../../models/game-engine/GameRegistry.js";
import { BaseConversionGame } from "./BaseConversion/BaseConversionGame.js";
import { PianoFractionsGame } from "./PianoFractions/PianoFractionsGame.js";
import { HexConversionGame } from "./BaseConversion/HexConversionGame.js";
import { FractalLuthierGame } from "./FractalLuthier/FractalLuthierGame.js";

const gamesRegistry: Record<string, GameConstructor> = {
  BaseConversion: BaseConversionGame,
  PianoFractions: PianoFractionsGame,
  HexConversion: HexConversionGame,
  FractalLuthier: FractalLuthierGame
};

export function getGameConstructor(gameId: string): GameConstructor | null {
  return gamesRegistry[gameId] ?? null;
}
