export class Router {
    services;
    routes = [];
    container;
    currentComponent = null;
    notFoundFactory = null;
    constructor(containerId, services) {
        this.services = services;
        const container = document.getElementById(containerId);
        if (!(container instanceof HTMLElement)) {
            throw new Error(`Router container "${containerId}" was not found.`);
        }
        this.container = container;
    }
    addRoute(pattern, factory, options = {}) {
        this.routes.push({
            pattern: this.normalize(pattern),
            factory,
            protectedRoute: options.protectedRoute ?? false,
            roles: options.roles ?? null
        });
    }
    setNotFound(factory) {
        this.notFoundFactory = factory;
    }
    navigate(path) {
        const target = this.normalize(path);
        if (window.location.hash === `#${target}`) {
            void this.handleRouting();
            return;
        }
        window.location.hash = target;
    }
    start() {
        window.addEventListener("hashchange", () => {
            void this.handleRouting();
        });
        if (window.location.hash.length === 0) {
            this.navigate("/");
            return;
        }
        void this.handleRouting();
    }
    async handleRouting() {
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
    async canEnter(definition) {
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
    mount(component) {
        if (this.currentComponent !== null) {
            this.currentComponent.destroy();
        }
        this.container.innerHTML = "";
        this.currentComponent = component;
        component.init();
    }
    async mountNotFound(path) {
        if (this.notFoundFactory === null) {
            this.container.innerHTML = "";
            return;
        }
        const component = await this.notFoundFactory({ path });
        this.mount(component);
    }
    findMatch(path) {
        for (const definition of this.routes) {
            const params = this.matchPattern(definition.pattern, path);
            if (params !== null) {
                return { definition, params };
            }
        }
        return null;
    }
    matchPattern(pattern, path) {
        const patternParts = this.parts(pattern);
        const pathParts = this.parts(path);
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        const params = {};
        for (let index = 0; index < patternParts.length; index += 1) {
            const patternPart = patternParts[index];
            const pathPart = pathParts[index];
            if (patternPart === undefined || pathPart === undefined) {
                return null;
            }
            if (patternPart.startsWith(":")) {
                params[patternPart.slice(1)] = decodeURIComponent(pathPart);
            }
            else if (patternPart !== pathPart) {
                return null;
            }
        }
        return params;
    }
    parts(path) {
        return this.normalize(path).split("/").filter((part) => part.length > 0);
    }
    normalize(path) {
        const trimmed = path.trim();
        const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
        return withSlash.replace(/\/+$/, "") || "/";
    }
}
