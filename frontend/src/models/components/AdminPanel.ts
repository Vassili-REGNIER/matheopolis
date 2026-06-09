export type AdminSectionId = "publication-requests" | "teachers";

export interface AdminSectionConfig {
  id: AdminSectionId;
  eyebrow: string;
  title: string;
  description: string;
  enabled: boolean;
}

export type ReviewActionTarget =
  | { kind: "publish"; id: number; title: string }
  | { kind: "reject"; id: number; title: string }
  | { kind: "unpublish"; id: number; title: string };
