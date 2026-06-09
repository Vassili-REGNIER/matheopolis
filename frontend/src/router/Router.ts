import type { BaseComponent } from "../components/BaseComponent.js";
import type {
  RouteDefinition,
  RouteFactory,
  RouteMatch,
  RouteParams
} from "../models/core/Router.js";
import type { AppServices } from "../models/services/AppServices.js";
import type { UserRole } from "../models/User.js";

export class Router {
  private readonly routes: RouteDefinition[] = [];
  private readonly container: HTMLElement;
  private currentComponent: BaseComponent | null = null;
  private notFoundFactory: RouteFactory | null = null;

  public constructor(
    containerId: string,
    private readonly services: AppServices
  ) {
    const container = document.getElementById(containerId);
    if (!(container instanceof HTMLElement)) {
      throw new Error(`Router container "${containerId}" was not found.`);
    }
    this.container = container;
  }

  public addRoute(
    pattern: string,
    factory: RouteFactory,
    options: { protectedRoute?: boolean; allowGuest?: boolean; roles?: UserRole[] } = {}
  ): void {
    this.routes.push({
      pattern: this.normalize(pattern),
      factory,
      protectedRoute: options.protectedRoute ?? false,
      allowGuest: options.allowGuest ?? true,
      roles: options.roles ?? null
    });
  }

  public setNotFound(factory: RouteFactory): void {
    this.notFoundFactory = factory;
  }

  public navigate(path: string): void {
    const target = this.normalize(path);
    this.clearTokenFromUrl();

    if (window.location.hash === `#${target}`) {
      void this.handleRouting();
      return;
    }
    window.location.hash = target;
  }

  /** Removes one-time auth tokens from the URL after they have been consumed or when leaving token routes. */
  public clearTokenFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    params.delete("token");

    let hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex !== -1) {
      const hashPath = hash.slice(0, queryIndex);
      const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
      hashParams.delete("token");
      const hashQuery = hashParams.toString();
      hash = hashQuery.length > 0 ? `${hashPath}?${hashQuery}` : hashPath;
    }

    const search = params.toString();
    const searchSuffix = search.length > 0 ? `?${search}` : "";
    window.history.replaceState(null, "", `${window.location.origin}/${searchSuffix}${hash}`);
  }

  public start(): void {
    window.addEventListener("hashchange", () => {
      void this.handleRouting();
    });

    this.bootstrapPathFromLocation();

    if (window.location.hash.length === 0) {
      this.navigate("/");
      return;
    }

    void this.handleRouting();
  }

  /**
   * Email links use path URLs (/verify-email?token=...) while the SPA router uses hash routes (#/verify-email).
   * When the app loads without a hash, promote a known path to its hash equivalent and keep query params.
   */
  private bootstrapPathFromLocation(): void {
    if (window.location.hash.length > 0) {
      return;
    }

    const path = this.normalize(window.location.pathname);
    if (path === "/" || this.findMatch(path) === null) {
      return;
    }

    const search = window.location.search;
    window.history.replaceState(null, "", `${window.location.origin}/${search}#${path}`);
  }

  public async handleRouting(): Promise<void> {
    const path = this.normalize(window.location.hash.replace(/^#/, "") || "/");
    const match = this.findMatch(path);

    window.dispatchEvent(new CustomEvent("route:changed", { detail: { path } }));

    if (match === null) {
      await this.mountNotFound(path);
      return;
    }

    const allowed = await this.canEnter(match.definition);
    if (!allowed) {
      return;
    }

    const component = await match.definition.factory(match.params);
    this.mount(component);
  }

  private async canEnter(definition: RouteDefinition): Promise<boolean> {
    if (!definition.protectedRoute) {
      return true;
    }

    const user = await this.services.auth.getMe();
    if (user === null) {
      this.navigate("/login");
      return false;
    }

    if (!definition.allowGuest && this.services.auth.isGuestUser(user)) {
      this.navigate("/game-home");
      return false;
    }

    if (definition.roles !== null && !definition.roles.includes(user.role)) {
      this.navigate(user.role === "student" || user.role === "free_user" ? "/game-home" : "/panel");
      return false;
    }

    return true;
  }

  private mount(component: BaseComponent): void {
    if (this.currentComponent !== null) {
      this.currentComponent.destroy();
    }
    this.container.innerHTML = "";
    this.currentComponent = component;
    component.init();
  }

  private async mountNotFound(path: string): Promise<void> {
    if (this.notFoundFactory === null) {
      this.container.innerHTML = "";
      return;
    }

    const component = await this.notFoundFactory({ path });
    this.mount(component);
  }

  private findMatch(path: string): RouteMatch | null {
    for (const definition of this.routes) {
      const params = this.matchPattern(definition.pattern, path);
      if (params !== null) {
        return { definition, params };
      }
    }

    return null;
  }

  private matchPattern(pattern: string, path: string): RouteParams | null {
    const patternParts = this.parts(pattern);
    const pathParts = this.parts(path);
    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: RouteParams = {};
    for (let index = 0; index < patternParts.length; index += 1) {
      const patternPart = patternParts[index];
      const pathPart = pathParts[index];
      if (patternPart === undefined || pathPart === undefined) {
        return null;
      }

      if (patternPart.startsWith(":")) {
        params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  private parts(path: string): string[] {
    return this.normalize(path).split("/").filter((part) => part.length > 0);
  }

  private normalize(path: string): string {
    const trimmed = path.trim();
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return withSlash.replace(/\/+$/, "") || "/";
  }
}
