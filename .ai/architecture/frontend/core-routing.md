# Frontend Core & UI Foundations

This module is the backbone (Core) of the SPA. It boots the application, structures the main
page layout, and dynamically mounts the right views based on the visited URL.

Principle: the app orchestrates, the router directs, the components render.

## Fundamental building blocks

### 1. App (entrypoint)

- Folder: `src/`
- The main orchestrator, instantiated once at startup (from `main.ts`/`index.ts`).
- Responsibilities:
  - composes (instantiates and owns) the shell `HeaderComponent`,
  - uses the `Router` to manage the central screen area,
  - `setupRoutes()`: declares all routes (e.g. `/login`, `/game-home`) and binds them to their components.
  Footer markup is provided by `Layout/Footer/FooterComponent.ts` as template/style helper functions and is
  composed by route views that need a footer; it is not an `App`-owned `BaseComponent` subclass.

Reference signature:

```ts
class App {
  private services: AppServices;
  private router: Router;
  private header: HeaderComponent;
  init(): void;
  private setupRoutes(router: Router): void;
  private bindEvents(): void;
  private injectResponsiveShellStyles(): void;
  private mainContainer(): HTMLElement;
}
```

### 2. Router

- Folder: `src/router/`
- Listens to URL changes (hash-based, e.g. `#/login`, `#/game/piano`; History API is an acceptable alternative) and mounts the right page without full page reload.
- Receives an HTML container (typically `<main id="main-content">`) in its constructor; this is its exclusive work area.
- Key methods:
  - `addRoute(hash, callback)`: register a route,
  - `navigate(hash)`: force a programmatic navigation (e.g. redirect home after a win),
  - `handleRouting()`: clears the container and mounts the component bound to the current route.
- Dependency injection: the router passes a reference to itself into master components (e.g. `GameContainerComponent`)
  so they can trigger programmatic navigation when their internal logic finishes.

### Route guards (authentication)

- Protected routes (e.g. `/game-home`, `/panel`, `/quiz/:quizId`) must verify authentication before mounting.
- The router checks identity via `AuthService` (e.g. `checkAuth()` / `getMe()`) and redirects unauthenticated
  users to the login route.
- Routes may opt out of guest access when they represent private account space. In particular, guest mode
  must be redirected away from MatheoPanel while retaining access to the game hub and playable chapters.
- Frontend guards improve UX only; backend authorization remains authoritative.

Reference signature:

```ts
class Router {
  private routes: RouteDefinition[];
  private container: HTMLElement;
  private currentComponent: BaseComponent | null;
  private notFoundFactory: RouteFactory | null;
  constructor(containerId: string, services: AppServices);
  addRoute(pattern: string, factory: RouteFactory, options?: RouteOptions): void;
  setNotFound(factory: RouteFactory): void;
  navigate(path: string): void;
  clearTokenFromUrl(): void;
  start(): void;
  handleRouting(): Promise<void>;
}
```

> Note: an earlier draft named the navigation method `Maps()`; the canonical name is `navigate()`.

### 3. BaseComponent (the UI contract)

- Folder: `src/components/`
- Abstract parent class of ALL visual elements. Guarantees consistent behavior and shared tooling.
- Lifecycle:
  - `init()`: mandatory; each child runs its own logic here,
  - `render(htmlTemplate, componentStyle?)`: injects HTML into the DOM and applies `componentId` as a scoping CSS class,
  - `injectStyle(css)`: creates a unique `<style>` tag in the document `<head>`,
  - `bindEvents()`: attaches event listeners (clicks, hovers, inputs).

Reference signature:

```ts
abstract class BaseComponent {
  protected container: HTMLElement;
  private componentId: string;
  constructor(container: HTMLElement, componentId: string);
  init(): void;
  protected render(htmlTemplate: string, componentStyle?: string): void;
  protected bindEvents(): void;
  private injectStyle(cssContent: string): void;
}
```

### 4. HeaderComponent and footer helpers

- `HeaderComponent` lives in `src/components/Layout/Header/` and is a direct child of `BaseComponent`.
- `src/components/Layout/Footer/FooterComponent.ts` exports `footerTemplate()` and `footerStyles()` helper
  functions. There is no current `FooterComponent` class.
- The header is mounted by `App`; footer helpers are composed by route views that need footer markup.

## Execution flow

1. Startup: the project entrypoint runs `new App().init()`.
2. Layout mount: `App` instantiates `HeaderComponent` in the shell.
3. Router setup: `App` instantiates the `Router` with the main content area, then calls `setupRoutes()`.
4. Navigation: the user clicks a link; the `Router` reads the URL, clears the central area, and mounts the requested page component.

### Master routes (current)

| Route | Component | Notes |
| --- | --- | --- |
| `/` | `HomeComponent` | Public landing |
| `/login`, `/register`, `/reset-password` | Auth views | |
| `/intro` | `StudentIntroComponent` | Protected; optional onboarding |
| `/game-home` | `GameHomeComponent` | Protected; guest allowed |
| `/panel` | `MatheoPanelComponent` | Protected; guest blocked |
| `/game/:chapterId` | `GameContainerComponent` | Narrative chapter engine |
| `/quiz/:quizId` | `QuizPlayComponent` | Quiz attempt |
| `/quiz/:quizId/results` | `QuizPlayComponent` | Correction view (`showResults=true`) |

Panel internal views (`profile`, `progress`, `classes`, etc.) are **not** router routes; `MatheoPanelComponent` swaps them locally.

## Development rules

1. Strict inheritance: every new visual component must extend `BaseComponent`.
2. Scoped CSS: no giant global stylesheet; each component passes its own CSS to `render()`, and `BaseComponent` injects it cleanly.
3. Router isolation: the `Router` only manages the main container (`#main-content`); child components (side menus, game blocks) are instantiated by their own parents, never by the root router.
4. Independence: shell helpers do not talk directly to the central area; for a global action
   (e.g. logout/header refresh) use an event or a dedicated service.
