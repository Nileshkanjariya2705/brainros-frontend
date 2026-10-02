import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react';
import { InlineMath } from './extensions/InlineMath';
import { BlockMath } from './extensions/BlockMath';
import { MathEditorModal } from './MathEditorModal';
import { ImageUploadButton } from './ImageUploadButton';
import {
  TiptapDocument,
  RichContent,
  isTiptapDocument,
  createDocumentFromPlainText,
  extractPlainTextFromTiptap,
} from '@/types/richContent.types';

interface RichContentEditorProps {
  content?: RichContent;
  onChange?: (json: TiptapDocument, plainText: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
  isCompact?: boolean;
}

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  content,
  onChange,
  placeholder = 'Type question or content here...',
  minHeight = '100px',
  disabled = false,
  className = '',
  isCompact = false,
}) => {
  const [mathModalOpen, setMathModalOpen] = useState(false);
  const [editingMath, setEditingMath] = useState<{
    latex: string;
    type: 'inline' | 'block';
    node?: any;
  } | null>(null);

  const isInternalUpdate = useRef(false);

  const initialParsedContent = React.useMemo(() => {
    if (!content) return createDocumentFromPlainText('');
    if (isTiptapDocument(content)) return content;
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (isTiptapDocument(parsed)) return parsed;
      } catch {
        return createDocumentFromPlainText(content);
      }
      return createDocumentFromPlainText(content);
    }
    return createDocumentFromPlainText('');
  }, [content]);

  const handleEditMathNode = useCallback((node: any, type: 'inline' | 'block') => {
    setEditingMath({
      latex: node.attrs.latex || '',
      type,
      node,
    });
    setMathModalOpen(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-xl shadow-sm my-2 border border-slate-200',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      InlineMath.configure({
        onEditMath: handleEditMathNode,
      }),
      BlockMath.configure({
        onEditMath: handleEditMathNode,
      }),
    ],
    content: initialParsedContent,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      const json = editor.getJSON() as TiptapDocument;
      const plainText = extractPlainTextFromTiptap(json);
      onChange?.(json, plainText);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 0);
    },
    editorProps: {
      attributes: {
        class: `prose prose-slate max-w-none focus:outline-none p-3 text-sm text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 ${
          isCompact ? 'text-xs leading-relaxed p-2' : ''
        }`,
        style: `min-height: ${minHeight};`,
      },
    },
  });

  // Sync external content changes if updated from outside
  useEffect(() => {
    if (!editor || isInternalUpdate.current) return;
    const currentJSON = JSON.stringify(editor.getJSON());
    const incomingJSON = JSON.stringify(initialParsedContent);
    if (currentJSON !== incomingJSON) {
      editor.commands.setContent(initialParsedContent, { emitUpdate: false });
    }
  }, [initialParsedContent, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const handleInsertMath = (latex: string, type: 'inline' | 'block') => {
    if (!editor) return;

    if (type === 'inline') {
      editor.chain().focus().setInlineMath({ latex }).run();
    } else {
      editor.chain().focus().setBlockMath({ latex }).run();
    }
    setEditingMath(null);
  };

  const handleImageUploaded = (url: string, altText?: string) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setImage({ src: url, alt: altText || 'Diagram' })
      .run();
  };

  if (!editor) return null;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 ${
        disabled ? 'bg-slate-50 opacity-80 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Editor Toolbar */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50/80 border-b border-slate-200/80 text-slate-600">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
              editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700 font-bold' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
              editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700 font-bold' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
              editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700 font-bold' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
              editor.isActive('strike') ? 'bg-indigo-100 text-indigo-700' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {!isCompact && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700' : ''
                }`}
                title="Heading"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
                  editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : ''
                }`}
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded-lg text-xs hover:bg-slate-200/70 transition-colors ${
                  editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : ''
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1" />
            </>
          )}

          {/* Math Formula Button */}
          <button
            type="button"
            onClick={() => {
              setEditingMath(null);
              setMathModalOpen(true);
            }}
            className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Insert Math Equation / Formula (LaTeX, roots, fractions, Greek letters)"
          >
            <span className="font-serif text-sm">∑</span>
            <span className="hidden sm:inline">Equation</span>
          </button>

          {/* Image Upload Button */}
          <ImageUploadButton onImageUploaded={handleImageUploaded} disabled={disabled} />

          <div className="flex-1" />

          {/* Undo / Redo / Clear */}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 rounded-lg text-xs hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-xs hover:bg-slate-200/70 text-slate-500 disabled:opacity-40 transition-colors"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-xs hover:bg-slate-200/70 text-slate-500 disabled:opacity-40 transition-colors"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="cursor-text bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Math Modal Popup */}
      <MathEditorModal
        isOpen={mathModalOpen}
        onClose={() => {
          setMathModalOpen(false);
          setEditingMath(null);
        }}
        onInsert={handleInsertMath}
        initialLatex={editingMath?.latex || ''}
        initialType={editingMath?.type || 'inline'}
      />
    </div>
  );
};
