import type { Classroom } from "../Class.js";
import type {
  StudentContentCatalog,
  StudentContentClassAccessRow,
  StudentContentSectionMeta
} from "../StudentContentAccess.js";

export interface StudentContentManagementTemplateData {
  catalog: StudentContentCatalog;
  sections: readonly StudentContentSectionMeta[];
  classes: Classroom[];
  openMenuKey: string | null;
  loadingMenuKey: string | null;
  listMessage: string;
  accessRowsByKey: Record<string, StudentContentClassAccessRow[]>;
  classAccessByContentKey: Record<string, Record<number, boolean>>;
}
