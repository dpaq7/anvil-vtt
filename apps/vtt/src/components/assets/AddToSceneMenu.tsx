import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Button,
} from '@anvil/ui';

interface SceneOption {
  id: string;
  name: string;
  sceneType: string;
}

export interface AddToSceneMenuProps {
  monsterName: string;
  isMinion: boolean;
  availableScenes: SceneOption[];
  onAdd: (monsterName: string, quantity: number, sceneId: string) => void;
}

const MINION_FORMATIONS = [
  { label: 'Mob (4)', quantity: 4 },
  { label: 'Squad (5)', quantity: 5 },
  { label: 'Platoon (8)', quantity: 8 },
  { label: 'Horde (10)', quantity: 10 },
] as const;

export function AddToSceneMenu({ monsterName, isMinion, availableScenes, onAdd }: AddToSceneMenuProps) {
  if (availableScenes.length === 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-40"
        disabled
        title="No scenes available — create a session with scenes first"
        onClick={(e) => e.stopPropagation()}
      >
        <Plus className="size-3.5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" onClick={(e) => e.stopPropagation()}>
          <Plus className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Add to Scene</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isMinion ? (
          // Minion: show formation sub-menus
          <>
            {MINION_FORMATIONS.map((formation) => (
              <DropdownMenuSub key={formation.quantity}>
                <DropdownMenuSubTrigger className="text-xs">
                  {formation.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {availableScenes.map((scene) => (
                    <DropdownMenuItem
                      key={scene.id}
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(monsterName, formation.quantity, scene.id);
                      }}
                    >
                      {scene.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
            <DropdownMenuSeparator />
            {/* Single minion */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                Single (1)
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableScenes.map((scene) => (
                  <DropdownMenuItem
                    key={scene.id}
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(monsterName, 1, scene.id);
                    }}
                  >
                    {scene.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : (
          // Non-minion: direct scene list
          availableScenes.map((scene) => (
            <DropdownMenuItem
              key={scene.id}
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(monsterName, 1, scene.id);
              }}
            >
              {scene.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
