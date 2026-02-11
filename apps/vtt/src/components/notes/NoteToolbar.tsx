import type { Editor } from '@tiptap/react';
import { Button } from '@anvil/ui';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Eye,
  PenLine,
} from 'lucide-react';
import { cn } from '@anvil/ui';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type EditorMode = 'editor' | 'source';

interface NoteToolbarProps {
  editor: Editor | null;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  saveStatus: SaveStatus;
}

interface ToolbarButton {
  icon: React.ReactNode;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  label: string;
}

const FORMAT_BUTTONS: ToolbarButton[] = [
  {
    icon: <Bold className="size-4" />,
    action: (e) => e.chain().focus().toggleBold().run(),
    isActive: (e) => e.isActive('bold'),
    label: 'Bold',
  },
  {
    icon: <Italic className="size-4" />,
    action: (e) => e.chain().focus().toggleItalic().run(),
    isActive: (e) => e.isActive('italic'),
    label: 'Italic',
  },
  {
    icon: <Strikethrough className="size-4" />,
    action: (e) => e.chain().focus().toggleStrike().run(),
    isActive: (e) => e.isActive('strike'),
    label: 'Strikethrough',
  },
  {
    icon: <Code className="size-4" />,
    action: (e) => e.chain().focus().toggleCode().run(),
    isActive: (e) => e.isActive('code'),
    label: 'Code',
  },
];

const HEADING_BUTTONS: ToolbarButton[] = [
  {
    icon: <Heading1 className="size-4" />,
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e.isActive('heading', { level: 1 }),
    label: 'Heading 1',
  },
  {
    icon: <Heading2 className="size-4" />,
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e.isActive('heading', { level: 2 }),
    label: 'Heading 2',
  },
  {
    icon: <Heading3 className="size-4" />,
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e.isActive('heading', { level: 3 }),
    label: 'Heading 3',
  },
];

const STRUCTURE_BUTTONS: ToolbarButton[] = [
  {
    icon: <List className="size-4" />,
    action: (e) => e.chain().focus().toggleBulletList().run(),
    isActive: (e) => e.isActive('bulletList'),
    label: 'Bullet list',
  },
  {
    icon: <ListOrdered className="size-4" />,
    action: (e) => e.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e.isActive('orderedList'),
    label: 'Ordered list',
  },
  {
    icon: <Quote className="size-4" />,
    action: (e) => e.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e.isActive('blockquote'),
    label: 'Blockquote',
  },
  {
    icon: <Minus className="size-4" />,
    action: (e) => e.chain().focus().setHorizontalRule().run(),
    label: 'Horizontal rule',
  },
];

function ToolbarGroup({
  buttons,
  editor,
  disabled,
}: {
  buttons: ToolbarButton[];
  editor: Editor;
  disabled: boolean;
}) {
  return (
    <>
      {buttons.map((btn) => (
        <Button
          key={btn.label}
          variant={btn.isActive?.(editor) ? 'secondary' : 'ghost'}
          size="sm"
          className="size-8 p-0"
          disabled={disabled}
          onClick={() => btn.action(editor)}
          title={btn.label}
        >
          {btn.icon}
        </Button>
      ))}
    </>
  );
}

export function NoteToolbar({ editor, mode, onModeChange, saveStatus }: NoteToolbarProps) {
  const isSource = mode === 'source';

  return (
    <div className="flex items-center gap-1 border-b border-zinc-800 px-3 py-1.5">
      {/* Formatting buttons */}
      {editor && (
        <>
          <ToolbarGroup buttons={FORMAT_BUTTONS} editor={editor} disabled={isSource} />
          <div className="mx-1 h-5 w-px bg-zinc-700" />
          <ToolbarGroup buttons={HEADING_BUTTONS} editor={editor} disabled={isSource} />
          <div className="mx-1 h-5 w-px bg-zinc-700" />
          <ToolbarGroup buttons={STRUCTURE_BUTTONS} editor={editor} disabled={isSource} />
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mode toggle */}
      <div className="flex items-center gap-0.5 rounded-md bg-zinc-800/50 p-0.5">
        <Button
          variant={mode === 'editor' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => onModeChange('editor')}
        >
          <PenLine className="size-3.5" />
          Edit
        </Button>
        <Button
          variant={mode === 'source' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={() => onModeChange('source')}
        >
          <Eye className="size-3.5" />
          Source
        </Button>
      </div>

      {/* Save status */}
      <div className={cn('ml-2 flex items-center gap-1.5 text-xs', saveStatus === 'idle' && 'invisible')}>
        {saveStatus === 'saving' && (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            <span className="text-zinc-500">Saving...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-500">Saved</span>
          </>
        )}
        {saveStatus === 'error' && (
          <>
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-500">Save failed</span>
          </>
        )}
      </div>
    </div>
  );
}
