// Layout
export { AppShell } from './components/layout/AppShell.js';
export type { AppShellProps } from './components/layout/AppShell.js';

// Components
export { Button } from './components/Button.js';
export type { ButtonProps } from './components/Button.js';
export { Input } from './components/Input.js';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/Card.js';
export { Checkbox } from './components/Checkbox.js';
export { Separator } from './components/Separator.js';
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogTitle,
} from './components/Dialog.js';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs.js';
export { Alert } from './components/Alert.js';
export { ScrollArea } from './components/ScrollArea.js';
export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from './components/Tooltip.js';
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './components/Collapsible.js';

// Sidebar
export {
  SidebarProvider,
  useSidebar,
  Sidebar,
  SidebarNav,
  SidebarNavItem,
  SidebarToggle,
} from './components/Sidebar.js';
export type { SidebarNavItemProps, SidebarProviderProps } from './components/Sidebar.js';

// Game UI
export { StaminaBar } from './components/StaminaBar.js';
export type { StaminaBarProps } from './components/StaminaBar.js';
export { SceneTypeIcon, SCENE_COLORS, SCENE_BG_COLORS, SCENE_BORDER_COLORS } from './components/SceneTypeIcon.js';
export type { SceneType, SceneTypeIconProps } from './components/SceneTypeIcon.js';

// Role Toggle
export { RoleToggle } from './components/RoleToggle.js';
export type { RoleToggleProps, UserRole } from './components/RoleToggle.js';

// Icons
export { AnvilIcon } from './components/icons/AnvilIcon.js';
export type { AnvilIconProps } from './components/icons/AnvilIcon.js';
export { D20Icon } from './components/icons/D20Icon.js';
export type { D20IconProps } from './components/icons/D20Icon.js';

// Table
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './components/Table.js';

// Badge
export { Badge } from './components/Badge.js';
export type { BadgeProps } from './components/Badge.js';

// Textarea
export { Textarea } from './components/Textarea.js';
export type { TextareaProps } from './components/Textarea.js';

// Progress
export { Progress } from './components/Progress.js';

// DropdownMenu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './components/DropdownMenu.js';

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './components/Select.js';

// Utilities
export { cn } from './lib/utils.js';
