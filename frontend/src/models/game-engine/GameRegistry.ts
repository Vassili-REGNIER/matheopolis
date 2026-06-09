import type { BaseGame } from "../../features/GameEngine/games/BaseGame.js";
import type { BaseGameContext, BaseGameParams } from "./BaseGame.js";

export type GameConstructor = new (
  container: HTMLElement,
  params: BaseGameParams,
  context: BaseGameContext
) => BaseGame;
