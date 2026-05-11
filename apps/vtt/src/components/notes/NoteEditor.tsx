import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Textarea } from '@anvil/ui';
import type { Note } from '@anvil/types';
import { markdownToHtml, htmlToMarkdown } from '../../lib/markdown.js';
import { useNotesStore } from '../../stores/notesStore.js';
import { NoteToolbar } from './NoteToolbar.js';
import type { SourceFormat } from './NoteToolbar.js';
import { NoteEditorTitle } from './NoteEditorTitle.js';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type EditorMode = 'editor' | 'source';

interface NoteEditorProps {
  note: Note;
  campaignId: string;
}

export function NoteEditor({ note, campaignId }: NoteEditorProps) {
  const { updateNote } = useNotesStore();

  const [mode, setMode] = useState<EditorMode>('editor');
  const [sourceText, setSourceText] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef(note.content);
  const sourceTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: markdownToHtml(note.content),
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none px-4 py-3 min-h-full focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = htmlToMarkdown(ed.getHTML());
      debouncedSave(md);
    },
  });

  // Reset when note changes
  useEffect(() => {
    if (editor) {
      const html = markdownToHtml(note.content);
      editor.commands.setContent(html);
    }
    setSourceText(note.content);
    lastSavedContentRef.current = note.content;
    setSaveStatus('idle');
    setMode('editor');
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, []);

  const debouncedSave = useCallback(
    (content: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

      if (content === lastSavedContentRef.current) return;

      setSaveStatus('saving');

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateNote(campaignId, note.id, { content });
          lastSavedContentRef.current = content;
          setSaveStatus('saved');
          idleTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
        }
      }, 1000);
    },
    [campaignId, note.id, updateNote],
  );

  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      if (newMode === mode) return;

      if (newMode === 'source' && editor) {
        // Editor -> Source: convert current HTML to markdown
        const md = htmlToMarkdown(editor.getHTML());
        setSourceText(md);
      } else if (newMode === 'editor' && editor) {
        // Source -> Editor: convert markdown to HTML and load into editor
        const html = markdownToHtml(sourceText);
        editor.commands.setContent(html);
      }

      setMode(newMode);
    },
    [mode, editor, sourceText],
  );

  const handleSourceChange = useCallback(
    (value: string) => {
      setSourceText(value);
      debouncedSave(value);
    },
    [debouncedSave],
  );

  const replaceSourceSelection = useCallback(
    (replacement: string, selectionStartOffset: number, selectionEndOffset: number) => {
      const textarea = sourceTextareaRef.current;
      const start = textarea?.selectionStart ?? sourceText.length;
      const end = textarea?.selectionEnd ?? sourceText.length;
      const next = `${sourceText.slice(0, start)}${replacement}${sourceText.slice(end)}`;

      setSourceText(next);
      debouncedSave(next);

      requestAnimationFrame(() => {
        sourceTextareaRef.current?.focus();
        sourceTextareaRef.current?.setSelectionRange(
          start + selectionStartOffset,
          start + selectionEndOffset,
        );
      });
    },
    [debouncedSave, sourceText],
  );

  const handleSourceFormat = useCallback(
    (format: SourceFormat) => {
      const textarea = sourceTextareaRef.current;
      const start = textarea?.selectionStart ?? sourceText.length;
      const end = textarea?.selectionEnd ?? sourceText.length;
      const selected = sourceText.slice(start, end);

      const wrap = (before: string, after: string, fallback: string) => {
        const content = selected || fallback;
        replaceSourceSelection(`${before}${content}${after}`, before.length, before.length + content.length);
      };

      const prefixLines = (prefix: string, fallback: string) => {
        const content = selected || fallback;
        const replacement = content
          .split('\n')
          .map((line) => `${prefix}${line}`)
          .join('\n');
        replaceSourceSelection(replacement, 0, replacement.length);
      };

      switch (format) {
        case 'bold':
          wrap('**', '**', 'bold text');
          break;
        case 'italic':
          wrap('*', '*', 'italic text');
          break;
        case 'strike':
          wrap('~~', '~~', 'struck text');
          break;
        case 'code':
          wrap('`', '`', 'code');
          break;
        case 'heading1':
          prefixLines('# ', 'Heading');
          break;
        case 'heading2':
          prefixLines('## ', 'Heading');
          break;
        case 'heading3':
          prefixLines('### ', 'Heading');
          break;
        case 'bulletList':
          prefixLines('- ', 'List item');
          break;
        case 'orderedList': {
          const content = selected || 'List item';
          const replacement = content
            .split('\n')
            .map((line, index) => `${index + 1}. ${line}`)
            .join('\n');
          replaceSourceSelection(replacement, 0, replacement.length);
          break;
        }
        case 'blockquote':
          prefixLines('> ', 'Quote');
          break;
        case 'horizontalRule': {
          const before = start > 0 && !sourceText.slice(0, start).endsWith('\n') ? '\n' : '';
          const after = end < sourceText.length && !sourceText.slice(end).startsWith('\n') ? '\n' : '';
          const replacement = `${before}---${after}`;
          replaceSourceSelection(replacement, replacement.length, replacement.length);
          break;
        }
      }
    },
    [replaceSourceSelection, sourceText],
  );

  return (
    <div className="flex h-full flex-col">
      <NoteToolbar
        editor={editor}
        mode={mode}
        onModeChange={handleModeChange}
        saveStatus={saveStatus}
        onSourceFormat={handleSourceFormat}
      />
      <NoteEditorTitle noteId={note.id} campaignId={campaignId} initialTitle={note.title} />
      <div className="flex-1 overflow-y-auto">
        {mode === 'editor' ? (
          <EditorContent editor={editor} className="h-full" />
        ) : (
          <Textarea
            ref={sourceTextareaRef}
            value={sourceText}
            onChange={(e) => handleSourceChange(e.target.value)}
            className="h-full min-h-full resize-none rounded-none border-none bg-transparent font-mono text-sm text-zinc-300 shadow-none focus-visible:ring-0"
            placeholder="Write markdown..."
          />
        )}
      </div>
    </div>
  );
}
