# Mathéopolis: Frontend Architecture & Codex Guidelines

## 1. Core Philosophy & Approach
- **Project:** Mathéopolis (An educational video game embedded within a full-featured web platform).
- **Stack:** Vanilla TypeScript, Single Page Application (SPA), HTML5, CSS3.
- **Frameworks:** **NONE**. No React, No Vue, No Angular. Pure Object-Oriented Programming (OOP) and DOM manipulation.
- **Pattern:** Clean Architecture. Strict separation of concerns between Routing, Services, UI Components, and the Game Engine.

---

## 2. UI Components & Rendering Contract
All visual elements in the application **MUST** inherit from the abstract class `BaseComponent`.

### The `BaseComponent` Lifecycle:
1. `constructor(container: HTMLElement, componentId: string)`: Assigns the mount point and a unique ID.
2. `init(): void`: (Mandatory) Fetches data via services and prepares the component's state.
3. `render(htmlTemplate: string, cssStyle?: string): void`: Injects the HTML into the DOM and automatically scopes the CSS using the `componentId`.
4. `injectStyle(cssContent: string): void`: (Internal) Creates a unique `<style>` tag in the document `<head>`.
5. `bindEvents(): void`: Attaches DOM event listeners (click, input, etc.).

### UI Component Rules:
- **No Global CSS:** Components must define their own CSS as a string and pass it to `render()`.
- **No Orphan Components:** Every UI file must belong to a specific folder (`Public/`, `MatheoPanel/`, `GameEngine/blocks/`).
- **Delegation in Cascade:** Parent components instantiate their own children. For example, `MatheoPanelComponent` instantiates `NavigationComponent` and dynamically mounts `ProfileComponent` or `ProgressComponent`. The global Router is NOT involved in sub-routing.

---

## 3. Routing Model (The Conductor)
- **Mechanism:** Hash-based (`#/login`, `#/game/piano`) or History API routing without full page reload.
- **Responsibility:** The `Router` ONLY mounts master views (e.g., `HomeComponent`, `GameHomeComponent`, `GameContainerComponent`).
- **View Destruction:** The Router is responsible for emptying the main `#main-content` container before mounting a new master view.
- **Dependency Injection:** The `Router` passes a reference to itself into master components (like `GameContainerComponent`) so they can trigger programmatic navigation (e.g., `router.navigate('/game-home')`) when their internal logic finishes.

---

## 4. Data Flow, Services & API (Inversion of Dependency)
No UI component or Game logic is allowed to communicate with the server directly.

### `ApiClient` (The Network Funnel)
- The ONLY class authorized to use the native `fetch()` API.
- Handles the base URL, HTTP methods (`get`, `post`, `patch`, `delete`).
- Automatically intercepts and injects security tokens (JWT Auth Tokens, Anti-Cheat Tokens) into HTTP Headers.

### `Services` (The Business Layer)
- Classes like `AuthService`, `TeacherService`, `RiddleService`, `UserService`.
- They translate UI needs into API calls.
- **Rule:** Components call Services. Services call ApiClient. ApiClient calls the backend.
- Services must unwrap API envelopes and return strictly typed Promises (e.g., `Promise<User>`) to the UI.

---

## 5. The Game Engine Architecture (Core Interactive Module)
The Game Engine is an isolated "app within the app" driven by events and configuration files. It is strictly agnostic to the specific rules of individual mini-games.

### 5.1. Orchestration & State
- **`GameContainerComponent` (The Orchestrator):** Instantiated by the Router. Holds the `sessionId` and `antiCheatToken`. It manages the game loop and listens to `stepComplete` events.
- **`SequenceManager` (The Iterator):** Holds the array of `GameStep` (parsed from JSON). Provides a strictly encapsulated iterator pattern: `advanceToNextStep(): boolean` and `getCurrentStep(): GameStep`. The UI never manipulates the step array directly.

### 5.2. Registries (Open/Closed Principle)
**NEVER use `if/else` or `switch` statements to load different games.**
- **`ConfigsRegistry`:** Maps a string ID (e.g., `"piano"`) to a JSON array of `GameStep`.
- **`GamesRegistry`:** Maps a string ID to a TypeScript class (e.g., `PianoFractions`).

### 5.3. Blocks (The Transition UI)
Steps are rendered via blocks that extend `BaseComponent`:
- `DialogueBlockComponent`: Renders story lines.
- `TutorialBlockComponent`: Handles inputs and error hints.
- `InfoBlockComponent`: Renders static screens (Victory, Intro).
- `RiddleBlockComponent`: The generic shell that queries `GamesRegistry` to instantiate the actual mini-game.

### 5.4. Mini-Games (`BaseGame` Contract)
Every specific math game (e.g., `PianoFractions`) MUST extend the abstract class `BaseGame` and implement:
- `start(): void`: Boots the game logic.
- `destroy(): void`: **CRITICAL.** Removes all event listeners (keyboard, drag & drop) to prevent memory leaks when the game unmounts.
- `showHint(): void`: Triggers visual help (e.g., highlighting a piano key) when the player clicks the "Hint" button in the `RiddleBlockComponent`.

---

## 6. Security and Anti-Cheat
- **Session initialization:** Starting a game via `RiddleService.startRiddle()` returns an `antiCheatToken`.
- **End of game:** The `GameContainerComponent` MUST pass the final score AND the `antiCheatToken` to `RiddleService.submitScore()` to validate the progress.
- **Route Guards:** The Router must verify authentication status via `AuthService.checkAuth()` before mounting protected routes like `/game-home`.

---

## 7. Strict Typing Rules
- **No `any`:** Avoid `any` at all costs, especially in the Service and Model layers.
- **Strict Interfaces:** Use explicit TypeScript interfaces (`DialogueStep`, `RiddleStep`, `User`, `Class`) representing backend OpenApi contracts.
- **Event Driven:** Use custom events (`emit('stepComplete')`, `emit('gameWon')`) to pass messages from children to parents. Parents listen, children broadcast.

---

## INSTRUCTIONS FOR CODEX / AI ASSISTANT

When generating code for this project, you **MUST** abide by the following constraints:
1. **Never use React, Vue, or Angular syntax.** Write pure DOM manipulations.
2. **Always extend `BaseComponent`** when creating a UI element, and implement `init()`, `render()`, and `bindEvents()`.
3. **Always extend `BaseGame`** when creating a new playable mini-game.
4. **Never write a `fetch` call inside a component.** Always mock or use a method from a `Service` class.
5. **Always clean up after yourself.** Implement the `destroy()` method cleanly for games and complex components to prevent DOM and memory leaks.
6. **Use Scoped CSS.** When providing HTML templates for components, provide the corresponding CSS string and inject it via the `render` method's second parameter.