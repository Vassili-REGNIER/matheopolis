import type { BaseComponent } from "../../components/BaseComponent.js";
import type { UserRole } from "../User.js";

export interface RouteParams {
  [key: string]: string;
}

export type RouteFactory = (params: RouteParams) => BaseComponent | Promise<BaseComponent>;

export interface RouteDefinition {
  pattern: string;
  factory: RouteFactory;
  protectedRoute: boolean;
  allowGuest: boolean;
  roles: UserRole[] | null;
}

export interface RouteMatch {
  definition: RouteDefinition;
  params: RouteParams;
}
