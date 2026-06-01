import type { BaseComponent } from "../components/BaseComponent.js";
import type { UserRole } from "../models/User.js";
import type { AppServices } from "../services/AppServices.js";

export interface RouteParams {
  [key: string]: string;
}

type RouteFactory = (params: RouteParams) => BaseComponent | Promise<BaseComponent>;

interface RouteDefinition {
  pattern: string;
  factory: RouteFactory;
  protectedRoute: boolean;
  roles: UserRole[] | null;
}

interface RouteMatch {
  definition: RouteDefinition;
  params: RouteParams;
}

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
    options: { protectedRoute?: boolean; roles?: UserRole[] } = {}
  ): void {
    this.routes.push({
      pattern: this.normalize(pattern),
      factory,
      protectedRoute: options.protectedRoute ?? false,
      roles: options.roles ?? null
    });
  }

  public setNotFound(factory: RouteFactory): void {
    this.notFoundFactory = factory;
  }

  public navigate(path: string): void {
    const target = this.normalize(path);
    if (window.location.hash === `#${target}`) {
      void this.handleRouting();
      return;
    }
    window.location.hash = target;
  }

  public start(): void {
    window.addEventListener("hashchange", () => {
      void this.handleRouting();
    });

    if (window.location.hash.length === 0) {
      this.navigate("/");
      return;
    }

    void this.handleRouting();
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
