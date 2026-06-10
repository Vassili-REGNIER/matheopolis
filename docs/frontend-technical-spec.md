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
- Simple confirmation dialogs use `components/Shared/ConfirmationModal/ConfirmationModalComponent.ts`, with
  public contracts in `models/components/ConfirmationModal.ts`; parent components keep domain state/service calls
  and react to the modal's emitted action events.

## 3. Application shell and orchestration

- `App` is the unique startup orchestrator.
- `HeaderComponent` and `FooterComponent` are persistent shell components.
- The router controls only the central master content area.
- `setupRoutes()` declares top-level navigation boundaries.

## 4. Routing model

- Hash routing (`#/route`) for in-browser SPA navigation.
- Router listens to `hashchange`.
- Router clears current mounted view before creating the next one.
- Router mounts only master views (login, game-home, panel root, game container, quiz player).

Master quiz routes:

- `/quiz/:quizId` — play or resume attempt (`QuizPlayComponent`)
- `/quiz/:quizId/results` — correction view (`QuizPlayComponent` with `showResults=true`)

This avoids full-page reload and server-side route complexity for frontend pages.

## 5. Nested view delegation

Parent containers own their local sub-navigation and sub-view lifecycle:

- `MatheoPanelComponent` mounts its own `NavigationComponent` and internal views.
- `StudentClassComponent` currently renders a styled "feature coming soon" placeholder for the student
  "My class" entry; no class dashboard data flow is active in that view yet.
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
  - `AuthService`, `UserService`, `ChapterService`, `ContentService`, `GameAccessService`,
    `ProgressMetricsService`, `QuizService`
- Teacher domain (`services/teacher/`):
  - `TeacherClassService` — class CRUD, student progress, CSV export, CSV student import with credential download
  - `TeacherQuizService` — quiz authoring, target-class access, publication requests
  - `StudentContentAccessService` — per-class student content access UI (quizzes via API)
- Admin domain (`services/admin/`):
  - `AdminManagementService`, `AdminQuizService` — publication workflow, unpublish, quiz CRUD

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
- `GameContainerComponent` loads chapter scenarios through `ChapterService.getChapter()` (`GET /api/chapters/{id}`);
  local `configs/` files are seed/mock content, not the runtime source of truth.
- `SequenceManager` advances through `GameStep[]` and can resume from a valid chapter `currentStepIndex`;
  invalid, missing, or out-of-range indexes fall back to `0`.
- `RiddleBlockComponent` owns the shared riddle shell: title, progress counters (challenge only),
  a merged active instruction/question prompt on the left, the in-game course return button and hint button
  in the left instruction panel, a yellow shared hint display, interactive mini-game on the right, a scoring
  notice during challenge steps, and the shared step action bar (`Valider`, `Suivant`).
- The left instruction panel styles are centralized in `blocks/shared/riddleInstructionPanelStyles.ts`
  to keep spacing, buttons, prompts, score notices, and hint display coherent across chapters.
- Practice steps (`RiddleStep.mode: "practice"`) reuse the same shell and mini-game with scoring disabled,
  distinct visual indicators (turquoise tutoriel banner), and optional `introText`.
- New games are introduced through registries, not by branching logic in orchestrators.
- Mini-games reuse `games/shared/chapterGameStyles.ts` for common cards, forms, messages, actions, and
  footers. Game-specific CSS should only cover domain surfaces such as the piano keyboard, code display,
  or fractal canvas.
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
  riddleId?: number;                 // present for database-backed API riddles
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
  id?: number;                       // database question id when exposed by the API
  question: string;
  answer?: string;                   // local seed/practice data only; API play payloads omit answers
  hint?: string;                     // optional; API play payloads include it when authored
  difficulty: number;
  metadata?: Record<string, unknown>;
}

interface InfoStep {
  type: 'info';
  title?: string;                    // legacy simple title
  text?: string;                     // legacy simple body
  content?: InfoContentDocument | InfoContentNode[]; // structured course/page content
  contentCss?: string;               // optional scoped CSS for structured content
  secondaryAction?: InfoSecondaryAction; // optional button opening another info content by id
  buttonText?: string;
  theme?: 'default' | 'endChapter' | 'startChapter' | 'sign';
}

interface InfoSecondaryAction {
  text: string;
  targetContentId: string | number;
}

interface InfoContentDocument {
  id?: string | number;
  titre?: string;                    // rendered as h1
  paragraph?: InfoParagraphContent | InfoParagraphContent[]; // rendered as div > h2 + p
  nodes?: InfoContentNode[];         // ordered rich content tree
  styles?: string;                   // optional scoped CSS injected with the block
}

type InfoContentNode =
  | string
  | { type: 'text'; text: string }
  | { type: 'titre'; text: string }
  | InfoParagraphContent
  | {
      type: 'element';
      tag: 'div' | 'section' | 'article' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'em' | 'strong' | 'small' | 'ul' | 'ol' | 'li' | 'input' | 'label';
      className?: string;
      attributes?: Partial<Record<'id' | 'type' | 'name' | 'checked' | 'for' | 'aria-label', string | number | boolean>>;
      text?: string;
      children?: InfoContentNode[];
    };

interface InfoParagraphContent {
  type: 'paragraph';
  className?: string;
  'sous-titre'?: string;
  text?: string;
  children?: InfoContentNode[];
}

type GameStep = DialogueStep | RiddleStep | InfoStep;
```

Notes:

- The `type` field is the discriminant used by the engine to mount the matching block.
- `InfoStep.content` is interpreted by `InfoBlockComponent` through an allowlisted renderer. Semantic keys
  such as `titre` and `paragraph` map to `h1` and `div > h2 + p`; richer layouts can use `element` nodes.
- `TutorialStep` no longer exists. Training content is a `RiddleStep` with `mode: "practice"`.
- `RiddleStep.mode: "practice"` runs the same mini-game as a challenge step with scoring and mistake
  tracking disabled (`QuestionSequence` options `scoring: false`, `trackMistakes: false`). Practice steps
  submit answers to `/api/riddles/{riddleId}/responses` for authoritative validation but do not create durable
  riddle progression. One or more questions may be used to build a short training melody or exercise before
  the challenge step.
- `RiddleStep.mode: "challenge"` (default) shows score and mistake counters, starts
  `/api/riddles/{riddleId}/start`, and submits answers one question at a time through
  `/api/riddles/{riddleId}/responses`.
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
- Buttons: `Valider` (games that validate through the shell), `Suivant` (shown after completion).
- The `Indice` button is rendered by `RiddleBlockComponent` in the left instruction panel and displays the
  current question hint there with the shared yellow hint style.
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

## 14. Reference frontend module layout

This directory map reflects the current frontend organization. Components that have enough rendering or styling
complexity are colocated as three TypeScript files: the component class, its HTML template helpers, and its scoped
style string.

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── public/
│   └── assets/
└── src/
    ├── app.ts
    ├── router/
    │   └── Router.ts
    ├── models/
    │   ├── ApiEnvelopes.ts
    │   ├── Auth.ts
    │   ├── Chapter.ts
    │   ├── ChapterProgress.ts
    │   ├── Class.ts
    │   ├── ClassManagement.ts
    │   ├── GameConfig.ts
    │   ├── Quiz.ts
    │   ├── StudentContentAccess.ts
    │   ├── User.ts
    │   ├── components/
    │   │   ├── ConfirmationModal.ts
    │   │   ├── Icons.ts
    │   │   └── ...
    │   ├── core/
    │   ├── game-engine/
    │   └── services/
    ├── services/
    │   ├── ApiClient.ts
    │   ├── AppServices.ts
    │   ├── AuthService.ts
    │   ├── ChapterService.ts
    │   ├── ContentService.ts
    │   ├── GameAccessService.ts
    │   ├── ProgressMetricsService.ts
    │   ├── QuizService.ts
    │   ├── UserService.ts
    │   ├── teacher/
    │   │   ├── TeacherClassService.ts
    │   │   ├── TeacherQuizService.ts
    │   │   └── StudentContentAccessService.ts
    │   └── admin/
    │       ├── AdminManagementService.ts
    │       └── AdminQuizService.ts
    ├── components/
    │   ├── BaseComponent.ts
    │   ├── Layout/
    │   │   ├── Header/
    │   │   └── Footer/
    │   ├── Shared/
    │   │   └── ConfirmationModal/
    │   │       ├── ConfirmationModalComponent.ts
    │   │       ├── ConfirmationModalComponent.template.ts
    │   │       └── ConfirmationModalComponent.styles.ts
    │   ├── GameHome/
    │   │   ├── GameHomeComponent.ts
    │   │   ├── GameHomeComponent.template.ts
    │   │   └── GameHomeComponent.styles.ts
    │   ├── Public/
    │   │   ├── Home/
    │   │   │   ├── HomeComponent.ts
    │   │   │   ├── HomeComponent.template.ts
    │   │   │   └── HomeComponent.styles.ts
    │   │   └── Auth/
    │   │       ├── Login/
    │   │       ├── Register/
    │   │       │   ├── RegisterComponent.ts
    │   │       │   ├── RegisterComponent.template.ts
    │   │       │   └── RegisterComponent.styles.ts
    │   │       └── ResetPassword/
    │   ├── MatheoPanel/
    │   │   ├── Navigation/
    │   │   └── Views/
    │   │       ├── Profile/
    │   │       ├── Progress/
    │   │       │   ├── ProgressComponent.ts
    │   │       │   ├── ProgressComponent.template.ts
    │   │       │   └── ProgressComponent.styles.ts
    │   │       ├── StudentClass/
    │   │       │   └── StudentClassComponent.ts
    │   │       ├── ClassManagement/
    │   │       │   ├── ClassManagementComponent.ts
    │   │       │   ├── ClassManagementComponent.template.ts
    │   │       │   ├── ClassManagementComponent.styles.ts
    │   │       │   ├── components/
    │   │       │   └── utils/
    │   │       ├── QuizManagement/
    │   │       │   ├── QuizManagementComponent.ts
    │   │       │   ├── QuizManagementComponent.template.ts
    │   │       │   └── QuizManagementComponent.styles.ts
    │   │       ├── StudentContentManagement/
    │   │       │   ├── StudentContentManagementComponent.ts
    │   │       │   ├── StudentContentManagementComponent.template.ts
    │   │       │   └── StudentContentManagementComponent.styles.ts
    │   │       ├── AdminPanel/
    │   │       │   ├── AdminPanelComponent.ts
    │   │       │   ├── AdminPanelComponent.template.ts
    │   │       │   └── AdminPanelComponent.styles.ts
    │   │       └── shared/
    │   │           └── QuizQuestionsSection.ts
    └── features/
        ├── QuizPlayer/
        │   ├── QuizPlayComponent.ts
        │   ├── QuizPlayComponent.template.ts
        │   └── QuizPlayComponent.styles.ts
        └── GameEngine/
            ├── GameContainerComponent.ts
            ├── core/
            │   └── SequenceManager.ts
            ├── configs/
            │   ├── index.ts
            │   └── scenarios/
            │       ├── baseConversion.ts
            │       ├── pianoFractions.ts
            │       └── courses/
            ├── blocks/
            │   ├── DialogueBlock/
            │   │   ├── DialogueBlockComponent.ts
            │   │   ├── DialogueBlockComponent.template.ts
            │   │   └── DialogueBlockComponent.styles.ts
            │   ├── InfoBlock/
            │   │   ├── InfoBlockComponent.ts
            │   │   ├── InfoBlockComponent.template.ts
            │   │   └── InfoBlockComponent.styles.ts
            │   ├── RiddleBlock/
            │   │   ├── RiddleBlockComponent.ts
            │   │   ├── RiddleBlockComponent.template.ts
            │   │   └── RiddleBlockComponent.styles.ts
            │   ├── infoContentRenderer.ts
            │   └── shared/
            │       ├── riddleInstructionPanelStyles.ts
            │       └── stepInteractionChrome.ts
            └── games/
                ├── index.ts
                ├── BaseGame.ts
                ├── shared/
                │   └── QuestionSequence.ts
                ├── BaseConversion/
                ├── FractalLuthier/
                └── PianoFractions/
```

### Layout conventions

- Component directories may include `Component.template.ts` and `Component.styles.ts` files colocated with the
  TypeScript class when the component has non-trivial rendering or scoped CSS.
- `Component.ts` owns lifecycle, state, service calls, and event binding.
- `Component.template.ts` owns HTML string builders and small rendering helpers.
- `Component.styles.ts` owns the scoped CSS string passed to `BaseComponent.render()`.
- `app.ts` is the architecture-level entrypoint name; if the runtime bootstrap remains `main.ts`, it should delegate to `App` and preserve the same responsibilities.
- `public/assets/` stores game-facing static resources (backgrounds, character states, SFX/music) consumed by UI and game modules.

### Test file placement

Frontend tests should live next to the code they validate, using `*.test.ts` files. This keeps tests close to the
component, service, or game contract they protect during refactors.

```text
frontend/src/
├── services/
│   ├── ApiClient.ts
│   └── ApiClient.test.ts
├── router/
│   ├── Router.ts
│   └── Router.test.ts
├── components/
│   └── GameHome/
│       ├── GameHomeComponent.ts
│       └── GameHomeComponent.test.ts
└── features/
    └── GameEngine/
        ├── core/
        │   ├── SequenceManager.ts
        │   └── SequenceManager.test.ts
        └── blocks/
            └── RiddleBlock/
                ├── RiddleBlockComponent.ts
                └── RiddleBlockComponent.test.ts
```

End-to-end browser scenarios, when introduced, should be stored separately under `frontend/e2e/` because they validate
complete user journeys rather than a single TypeScript module.
