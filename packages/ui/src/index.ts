// Layout
export { AppShell } from './components/layout/AppShell.js';
export type { AppShellProps } from './components/layout/AppShell.js';

// Components
export { Button } from './components/Button.js';
export type { ButtonProps } from './components/Button.js';
export { Input } from './components/Input.js';
export { Card, CardHeader, CardTitle, CardContent } from './components/Card.js';
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

// Game UI
export { StaminaBar } from './components/StaminaBar.js';
export type { StaminaBarProps } from './components/StaminaBar.js';
export { SceneTypeIcon, SCENE_COLORS, SCENE_BG_COLORS, SCENE_BORDER_COLORS } from './components/SceneTypeIcon.js';
export type { SceneType, SceneTypeIconProps } from './components/SceneTypeIcon.js';

// Utilities
export { cn } from './lib/utils.js';
