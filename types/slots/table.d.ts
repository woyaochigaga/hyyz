import { TableColumn } from "@/types/blocks/table";
import { Slot } from "@/types/slots/base";

export interface TableGroup {
  title: string;
  data?: any[];
  empty_message?: string;
}

export interface Table extends Slot {
  columns?: TableColumn[];
  empty_message?: string;
  /** 多段列表：共用 columns，每段独立标题与数据（如按角色分表） */
  groups?: TableGroup[];
}
