import { BaseConversionGame } from "./BaseConversion/BaseConversionGame.js";
import { MatheopolisQuizGame } from "./MatheopolisQuiz/MatheopolisQuizGame.js";
import { PianoFractionsGame } from "./PianoFractions/PianoFractionsGame.js";
import { ThalesRatioGame } from "./ThalesRatio/ThalesRatioGame.js";
const gamesRegistry = {
    BaseConversion: BaseConversionGame,
    ThalesRatio: ThalesRatioGame,
    PianoFractions: PianoFractionsGame,
    MatheopolisQuiz: MatheopolisQuizGame
};
export function getGameConstructor(gameId) {
    return gamesRegistry[gameId] ?? null;
}
