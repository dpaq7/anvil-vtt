import { createContext, useContext } from "react";

export type SidebarVariant = "director" | "player" | "default";

export interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  expand: () => void;
  variant: SidebarVariant;
  setVariant: (variant: SidebarVariant) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}
