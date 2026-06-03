import type { BaseGame, BaseGameContext } from "./BaseGame.js";
import type { GameParams } from "../../../models/GameConfig.js";
import { BaseConversionGame } from "./BaseConversion/BaseConversionGame.js";
import { MatheopolisQuizGame } from "./MatheopolisQuiz/MatheopolisQuizGame.js";
import { PianoFractionsGame } from "./PianoFractions/PianoFractionsGame.js";
import { ThalesRatioGame } from "./ThalesRatio/ThalesRatioGame.js";

export type GameConstructor = new (
  container: HTMLElement,
  difficulty: number,
  params: GameParams,
  context: BaseGameContext
) => BaseGame;

const gamesRegistry: Record<string, GameConstructor> = {
  BaseConversion: BaseConversionGame,
  ThalesRatio: ThalesRatioGame,
  PianoFractions: PianoFractionsGame,
  MatheopolisQuiz: MatheopolisQuizGame
};

export function getGameConstructor(gameId: string): GameConstructor | null {
  return gamesRegistry[gameId] ?? null;
}
