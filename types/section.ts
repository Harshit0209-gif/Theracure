import { LucideIcon } from "lucide-react";

export interface SectionConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  required: boolean;
  active: boolean;
  toggle: boolean;
  defaultActive?: boolean;
}

export interface SectionGroupConfig {
  title: string;
  badge: string;
  color: string;
  badgeColor: string;
  layout: string;
  itemClass: string;
}
