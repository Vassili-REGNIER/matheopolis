# Frontend Technical Specification

## 1. Technology and architecture choices

- Single Page Application (SPA)
- Vanilla TypeScript only (no UI framework)
- Object-oriented component model
- Clean separation between:
  - models (typing/contracts),
  - services (business/API orchestration),
  - components (rendering and interactions)
- Clean hierarchy between master views (router-owned) and nested views (parent-owned)

## 2. Component engine contract

All UI elements inherit from `BaseComponent`.

Mandatory lifecycle:

1. `constructor(container, id)`
2. `init()`
3. `render(htmlTemplate, cssStyle)`
4. `bindEvents()`

Rules:

- Components do not call `fetch()` directly.
- Components do not hardcode backend URLs.
- Components consume service-layer methods only.
- Component styling is injected per component (scoped behavior), not via one global monolithic stylesheet.
- Complex components must expose/use `destroy()` when they allocate listeners/resources.

## 3. Application shell and orchestration

- `App` is the unique startup orchestrator.
- `HeaderComponent` and `FooterComponent` are persistent shell components.
- The router controls only the central master content area.
- `setupRoutes()` declares top-level navigation boundaries.

## 4. Routing model

- Hash routing (`#/route`) for in-browser SPA navigation.
- Router listens to `hashchange`.
- Router clears current mounted view before creating the next one.
- Router mounts only master views (login, game-home, panel root, game container).

This avoids full-page reload and server-side route complexity for frontend pages.

## 5. Nested view delegation

Parent containers own their local sub-navigation and sub-view lifecycle:

- `MatheoPanelComponent` mounts its own `NavigationComponent` and internal views.
- Game engine containers mount/unmount step blocks internally.
- Root router is intentionally unaware of these local transitions.

## 6. Data flow and API communication

### API client layer (`ApiClient`)

- Only authorized place for HTTP requests.
- Handles PHP session-cookie credentials and CSRF token propagation.
- Centralizes base URL, HTTP verbs, and global auth/network behavior.
- JWT bearer-token authentication is not part of the current frontend contract.

### Service layer

- Encapsulates business actions.
- Calls API client.
- Unwraps API response envelopes before returning data.
- Must return typed DTOs/contracts (no `any`).

### Component layer

- Requests domain data via services in `init()`.
- Updates DOM based on typed data outcomes.

## 7. Service boundaries by domain

- Core:
  - `AuthService`
  - `UserService`
  - `RiddleService`
- Core:
  - quiz consumer flow (play, submit answers, correction)
- Teacher domain (`services/teacher/`):
  - class management and class progression operations
  - quiz authoring, per-class access overrides, and publication requests
- Admin domain (`services/admin/`):
  - global management operations
  - quiz administration and publication (no rejection workflow)

## 8. Security and role-aware frontend behavior

- Route guards validate identity/role before sensitive views.
- Route guards can also block guest-mode sessions from private account views such as MatheoPanel.
- App shell navigation is dynamically filtered by role.
- Frontend hiding improves UX but backend authorization remains authoritative.
- Authentication relies on backend session cookie + CSRF, not JWT bearer tokens.

## 9. Typing requirements

- Keep models synchronized with API/OpenAPI contracts.
- Use dedicated DTO interfaces for requests/responses.
- Avoid `any` in service and model layers.

## 10. Game engine integration contract

Game engine modules are autonomous and follow open/closed extension:

- `GameContainerComponent` orchestrates scenario execution and block lifecycle.
- `SequenceManager` advances through `GameStep[]`.
- `RiddleBlockComponent` owns the shared riddle shell: mode banner, title, progress counters (challenge only),
  instruction and questions on the left, interactive mini-game on the right, and the shared step action bar
  (`Indice`, `Valider`, `Suivant`).
- Practice steps (`RiddleStep.mode: "practice"`) reuse the same shell and mini-game with scoring disabled,
  distinct visual indicators (turquoise tutoriel banner), and optional `introText`.
- New games are introduced through registries, not by branching logic in orchestrators.
- Mini-games must implement `BaseGame` contract methods:
  - `start()`
  - `showHint()`
  - `submitAnswer()` when the shell `Valider` button is used
  - `destroy()` (mandatory memory/event cleanup)
- Mini-games signal completion through custom events; the shell shows `completionMessage` and waits for the
  player to click `Suivant` before advancing (no auto-advance).

## 11. Game step data contracts

The game engine scenarios are typed as a discriminated union of step contracts. These interfaces are the
canonical shape of every `GameStep` consumed by `SequenceManager` and rendered by the engine blocks.

```ts
interface DialogueLine {
  speakerId: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'thinking' | 'angry';
  image?: string;
  position?: 'left' | 'right';
}

interface DialogueStep {
  type: 'dialogue';
  backgroundImg?: string;
  lines: DialogueLine[];
}

interface RiddleStep {
  type: 'riddle';
  gameId: string;                    // e.g. 'PianoFractions'
  mode?: 'practice' | 'challenge';   // default: challenge
  title: string;
  introText?: string;                // pedagogical intro shown in practice mode
  instruction: string;
  completionMessage: string;         // banner shown when the mini-game is finished
  questions: RiddleQuestion[];       // step questions rendered by the shell and passed to the mini-game
  gameParams?: Record<string, unknown>; // optional per-game options, empty by default
}

interface RiddleQuestion {
  question: string;
  answer: string;
  hint: string;
  difficulty: number;
  metadata?: Record<string, unknown>;
}

interface InfoStep {
  type: 'info';
  title: string;
  text: string;
  buttonText?: string;
  theme?: 'default' | 'endChapter' | 'startChapter' | 'sign';
}

type GameStep = DialogueStep | RiddleStep | InfoStep;
```

Notes:

- The `type` field is the discriminant used by the engine to mount the matching block.
- `TutorialStep` no longer exists. Training content is a `RiddleStep` with `mode: "practice"`.
- `RiddleStep.mode: "practice"` runs the same mini-game as a challenge step with scoring and mistake
  tracking disabled (`QuestionSequence` options `scoring: false`, `trackMistakes: false`). Practice steps
  do not contribute score or `submitAttempt` calls to the chapter session. One or more questions may be
  used to build a short training melody or exercise before the challenge step.
- `RiddleStep.mode: "challenge"` (default) shows score and mistake counters and records progression.
- `completionMessage` is authored in the scenario JSON and displayed in the shell completion banner when the
  mini-game finishes; the player must click `Suivant` to advance.
- Riddle content should live in `RiddleStep.questions` so mini-games can stay reusable and avoid hard-coded
  question/answer/hint data. `gameParams` is optional and only carries per-game options.
- `GameContainerComponent` filters `RiddleStep.questions` by question difficulty before the mini-game
  receives the step. The current implementation keeps only difficulty 1 questions.
- Avoid `any` in optional `gameParams`; prefer `Record<string, unknown>` or a per-game typed interface.

### Step interaction chrome

Shared module: `blocks/shared/stepInteractionChrome.ts`.

- Rendered by `RiddleBlockComponent` below the mini-game host.
- Buttons: `Indice` (always visible during play), `Valider` (games that validate through the shell),
  `Suivant` (shown after completion).
- When completion is shown, `Indice` and `Valider` are hidden; only `Suivant` remains.
- Mini-games emit `gameValidate`, `gameProgress`, `gameCompleted`, and `gameWon` custom events consumed by
  the shell.

### Question progression helper

Shared module: `games/shared/QuestionSequence.ts`.

- Tracks current question index, score, and mistakes for multi-question mini-games.
- `recordCorrect(points)` always advances; points and mistakes are optional via constructor flags.
- Used by `BaseConversionGame` and `PianoFractionsGame`.

## 12. App shell pattern

- `MatheoPanel` acts as persistent shell.
- Only central content view changes during navigation.
- Navigation and global actions remain stable across section transitions.

## 13. Mandatory implementation rules

1. No frontend framework usage.
2. No network call outside `ApiClient`.
3. No new game-type handling via `if/else` inside game orchestrators.
4. All visual components extend `BaseComponent`.
5. All mini-games extend `BaseGame`.
6. Always clean listeners/resources on teardown in complex components and games.

## 14. Reference frontend module layout (target architecture)

This directory map defines the target architecture for the frontend codebase.
Current implementation can be a subset while migration is in progress, but all new work should align with this structure.

```text
frontend/
├── index.html
├── global.css
├── package.json
├── tsconfig.json
├── public/
│   └── assets/
│       ├── backgrounds/
│       ├── characters/
│       └── audio/
└── src/
    ├── app.ts
    ├── router/
    │   └── Router.ts
    ├── models/
    │   ├── User.ts
    │   ├── Class.ts
    │   ├── LoginRequest.ts
    │   ├── CreateUserRequests.ts
    │   ├── ApiEnvelopes.ts
    │   ├── GameConfig.ts
    │   ├── Progress.ts
    │   └── Quiz.ts
    ├── services/
    │   ├── ApiClient.ts
    │   ├── AuthService.ts
    │   ├── UserService.ts
    │   ├── RiddleService.ts
    │   ├── QuizService.ts
    │   ├── teacher/
    │   │   ├── TeacherClassService.ts
    │   │   └── TeacherQuizService.ts
    │   └── admin/
    │       ├── AdminManagementService.ts
    │       └── AdminQuizService.ts
    ├── components/
    │   ├── BaseComponent.ts
    │   ├── Layout/
    │   │   ├── Header/
    │   │   └── Footer/
    │   ├── Public/
    │   │   ├── Home/
    │   │   └── Auth/
    │   │       ├── Login/
    │   │       ├── Register/
    │   │       └── ResetPassword/
    │   ├── MatheoPanel/
    │   │   ├── Navigation/
    │   │   └── Views/
    │   │       ├── Profile/
    │   │       ├── Progress/
    │   │       ├── ClassManagement/
    │   │       ├── StudentContentManagement/
    │   │       └── AdminPanel/
    │   └── GameHome/
    └── features/
        └── GameEngine/
            ├── core/
            │   └── SequenceManager.ts
            ├── configs/
            │   ├── index.ts
            │   └── scenarios/
            │       ├── baseConversion.ts
            │       ├── pianoFractions.ts
            │       ├── thales.ts
            │       └── quiz.ts
            ├── blocks/
            │   ├── DialogueBlockComponent.ts
            │   ├── RiddleBlockComponent.ts
            │   ├── InfoBlockComponent.ts
            │   └── shared/
            │       └── stepInteractionChrome.ts
            └── games/
                ├── index.ts
                ├── BaseGame.ts
                ├── shared/
                │   └── QuestionSequence.ts
                ├── BaseConversion/
                ├── PianoFractions/
                ├── ThalesRatio/
                └── MatheopolisQuiz/
```

### Layout conventions

- Component directories may include `template.html` and `style.css` files colocated with the TypeScript class.
- `app.ts` is the architecture-level entrypoint name; if the runtime bootstrap remains `main.ts`, it should delegate to `App` and preserve the same responsibilities.
- `public/assets/` stores game-facing static resources (backgrounds, character states, SFX/music) consumed by UI and game modules.
