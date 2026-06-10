# Frontend Game Engine

The level execution engine of Matheopolis. An autonomous system designed as a State Machine + Iterator.
It reads the hydrated chapter scenario returned by `GET /api/chapters/{id}` and plays UI blocks sequentially (dialogues, riddles, end screens)
until the level is resolved. It is fully agnostic of mini-game rules, so new games can be added without
modifying the engine.

## Fundamental building blocks

### 1. GameContainerComponent (the orchestrator)

- Folder: `src/features/GameEngine/`
- Parent component mounted by the router; frames the whole student run.
- Responsibilities:
  - Session: starts chapter/riddle progression via API services when the user is authenticated,
  - Orchestration: instantiates `SequenceManager` and listens to `stepComplete` events,
  - Dynamic rendering: mounts/unmounts blocks on the fly based on the current step,
  - Closing: completes chapter progression via the API and asks the router to redirect.

Reference signature:

```ts
class GameContainerComponent extends BaseComponent {
  private brain: SequenceManager;
  private riddleId: string;
  private router: Router;
  private chapterId: number;
  constructor(container: HTMLElement, router: Router);
  init(riddleId: string): void;
  private loadCurrentStep(): void;
  private endGame(): void;
}
```

### 2. SequenceManager (the iterator / brain)

- Folder: `src/features/GameEngine/core/`
- Drives scenario progression safely and "blindly".
- Encapsulates the step array (`GameStep[]`) and current index. `advanceToNextStep()` increments the index
  and returns a boolean (`true` if steps remain, `false` if finished), so the container never manipulates arrays directly.

Reference signature:

```ts
class SequenceManager {
  private steps: GameStep[];
  private currentIndex: number;
  constructor(steps: GameStep[], initialIndex?: number);
  getCurrentStep(): GameStep;
  getCurrentIndex(): number;
  advanceToNextStep(): boolean;
  private hasNextStep(): boolean;
}
```

### 3. Models & registries (`configs/` and `games/`)

- Registries enforce the Open/Closed Principle; the engine never imports a game directly.
  - `GamesRegistry` (`games/index.ts`): maps a mini-game ID to its TypeScript class.
  - `configs/` may still host local seed/mock scenarios, but runtime chapter scenarios come from the backend API.
- Interfaces (`GameStep` and friends) provide strict typing for what each block expects.
  See the canonical data contracts in `docs/frontend-technical-spec.md` (Game step contracts).

### 4. UI blocks (`blocks/`)

Transition components, all extending `BaseComponent`:

- `DialogueBlockComponent`: renders the story line by line.
- `InfoBlockComponent`: static screens (title, victory) and structured course pages. It still supports the
  legacy `title`/`text` fields, and can render `InfoStep.content` through a JSON content tree with allowlisted
  semantic nodes (`titre`, `paragraph`) and generic `element` nodes for richer HTML/CSS course layouts.
  Structured info steps may expose a secondary action targeting another info content id, used for flows such as
  returning from a course page to its rules page.
- `RiddleBlockComponent`: the UI shell of a riddle. It owns the shared riddle layout:
  - title and progress counters (challenge only; replaced by a practice indicator panel in tutoriel mode),
  - optional `introText`, challenge scoring notice, a merged active instruction/question prompt, course return
    button when available, hint button, and yellow shared hint display on the left,
  - interactive mini-game host and shared validation/next action bar on the right.
  The left instruction panel CSS is centralized in `blocks/shared/riddleInstructionPanelStyles.ts` so spacing,
  buttons, score notices, prompts, and hints stay consistent across chapters.
  A `practice` step reuses the same shell and mini-game with scoring disabled via `QuestionSequence`.
  `TutorialBlockComponent` was removed; training is always a `RiddleStep` with `mode: "practice"`.

### 4b. Shared step chrome (`blocks/shared/stepInteractionChrome.ts`)

- Renders the completion banner and the action bar: `Valider`, `Suivant`.
- The `Indice` button and shared yellow hint display belong to `RiddleBlockComponent`'s left instruction panel.
- Used by `RiddleBlockComponent`.
- On completion: shows `completionMessage`, hides `Indice` and `Valider`, shows `Suivant` only.
- Mini-games must not auto-advance; the player clicks `Suivant`, which calls `BaseGame.proceedToNextStep()`.

### 5. Mini-game logic (`games/`)

- Where the math rules and per-riddle interactions live (e.g. `PianoFractions`).
- Mini-games render only their interactive surface; title, instruction, score, mistakes, mode banner, and
  step action buttons belong to `RiddleBlockComponent`.
- Mini-games should read question content from the runtime params assembled by `RiddleBlockComponent`.
  Scenario authors put questions in `RiddleStep.questions`; optional `RiddleStep.gameParams` only carries
  per-game options.
- API play payloads expose authored question hints but still omit answers. `RiddleBlockComponent` displays
  those hints from the current question when the player clicks `Indice`.
- Shared mini-game surface styles live in `games/shared/chapterGameStyles.ts`. Mini-games should reuse the
  shared classes for cards, forms, messages, actions, and footers, then keep only game-specific selectors
  for domain elements such as a piano keyboard, secret code display, or fractal canvas.
- `QuestionSequence` (`games/shared/QuestionSequence.ts`) centralises multi-question progression, score, and
  mistake tracking. Pass `scoring: false` and `trackMistakes: false` when the runtime params mode is `practice`
  (handled via `BaseGame.isPracticeMode()` in games that use the helper).
- Riddle questions carry their own difficulty. `GameContainerComponent` filters questions by
  the current question difficulty before starting the `SequenceManager`; for now, this is difficulty 1.
- `BaseGame` contract: every mini-game must extend the abstract class and implement:
  - `start()`: boot the internal loop,
  - `destroy()`: clean up memory/event listeners (mandatory),
  - `showHint()`: react to hint requests without breaking logic.
- Optional shell integration:
  - `submitAnswer()`: called when the shell `Valider` button is clicked,
  - `markCompleted(score, answer)`: emits `gameCompleted` with `params.completionMessage`; stores pending win,
  - `proceedToNextStep()`: emits `gameWon` when the player clicks `Suivant`.
- Custom events emitted upward: `gameProgress`, `gameValidate`, `gameCompleted`, `gameWon`.

Reference signature:

```ts
abstract class BaseGame {
  protected container: HTMLElement;
  constructor(container: HTMLElement, params: BaseGameParams, context: BaseGameContext);
  start(): void;
  destroy(): void;
  abstract showHint(): void;
  submitAnswer(): void;
  proceedToNextStep(): void;
  protected isPracticeMode(): boolean;
  protected markCompleted(score: number, answer: string): void;
}
```

## Engine relationships

```mermaid
flowchart TD
  GameContainerComponent -->|composes| SequenceManager
  SequenceManager -->|reads| GameStep
  GameContainerComponent -.->|mounts| DialogueBlockComponent
  GameContainerComponent -.->|mounts| RiddleBlockComponent
  GameContainerComponent -.->|mounts| InfoBlockComponent
  GameContainerComponent -->|uses| ChapterService
  RiddleBlockComponent -->|uses| ContentService
  RiddleBlockComponent -->|manages| BaseGame
  RiddleBlockComponent -->|uses| stepInteractionChrome
  RiddleBlockComponent -->|consults| GamesRegistry
  BaseGame --> PianoFractions
  GamesRegistry -.->|references| PianoFractions
```

## Execution flow

1. The router mounts `GameContainerComponent` with a level ID (e.g. `"piano"`).
2. The container queries `ChapterService.getChapter()` for the full API-hydrated scenario.
3. It starts chapter progression via the API, then instantiates `SequenceManager` with the returned
   `currentStepIndex` when it is valid.
4. Event loop: the container reads the current step, checks its type, and mounts the matching block.
5. When the player finishes a block, the block emits `stepComplete`; the container destroys the block and
   calls `advanceToNextStep()`. For riddles, completion requires clicking `Suivant` after the completion banner.
6. For a `riddle` step, the container delegates to `RiddleBlockComponent`, which queries `GamesRegistry`
   to instantiate the pure game class (e.g. `PianoFractions`) and passes `mode`, `instruction`, and
   `completionMessage` through `gameParams`.
7. Practice and challenge riddle steps start riddle progression and submit answers through `ChapterService`;
   practice completion does not count toward chapter auto-completion.
8. The container completes the chapter through `POST /api/chapters/{id}/complete` when all challenge riddles are done.

## Progression

- Authenticated users: chapter state is represented through chapter progression contracts; the engine persists
  the next step through `POST /api/chapters/{id}/steps` after each successful step advance.
- Chapter progress bars derive their percentage from `currentStepIndex / stepCount`; `stepCount` is provided by
  the chapter API and counts every visible scenario step so the UI reflects the actual resume position.
- Practice riddle steps use durable riddle progression endpoints, but their completion does not count toward
  chapter auto-completion.
- Guests: no server-side progression; scenario may still be loaded from `GET /api/chapters/{id}`.
- Challenge completion is submitted through chapter progression service methods.

## Event-driven communication

- Blocks and mini-games communicate upward via custom events (e.g. `stepComplete`, `gameWon`).
- Children broadcast; the parent (`GameContainerComponent` or `RiddleBlockComponent`) listens.
- A child never calls its parent directly, keeping blocks reusable and decoupled.

## Development rules

1. Orchestrator isolation: never add `if/else` targeting a specific mini-game or level ID inside `GameContainerComponent`.
2. New mini-game: create the class in `games/` extending `BaseGame`, register it in `games/index.ts`, and seed
   chapter/riddle API content with its `gameId`. The rest of the app adapts automatically.
3. Hint responsibility: the `Indice` button and visual hint display belong to `RiddleBlockComponent`'s left
   instruction panel. Mini-games may still implement `showHint()` for game-specific reactions, but scenario
   hints are displayed by the shell with the shared yellow hint style.
4. Memory cleanup: mini-games often use complex listeners (keyboard, drag & drop). `BaseGame.destroy()` must
   remove them to avoid memory leaks when moving to the next step.
