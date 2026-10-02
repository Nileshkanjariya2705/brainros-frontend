import { Node, mergeAttributes } from '@tiptap/react';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useMemo } from 'react';
import katex from 'katex';

export const BlockMathNodeView: React.FC<any> = ({ node, selected, extension }) => {
  const latex = node.attrs.latex || '';

  const html = useMemo(() => {
    if (!latex) return '<span class="text-slate-400 italic">(empty equation)</span>';
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return `<span class="text-rose-500 font-mono">${latex}</span>`;
    }
  }, [latex]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (extension.options.onEditMath) {
      extension.options.onEditMath(node, 'block');
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      className={`my-3 p-3 rounded-xl cursor-pointer border text-center transition-all ${
        selected
          ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-300'
          : 'bg-slate-50 hover:bg-indigo-50/30 border-slate-200 hover:border-indigo-300 shadow-sm'
      }`}
      onClick={handleClick}
      title="Click to edit equation"
    >
      <div className="overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: html }} />
    </NodeViewWrapper>
  );
};

export interface BlockMathOptions {
  HTMLAttributes: Record<string, any>;
  onEditMath?: (node: any, type: 'inline' | 'block') => void;
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    blockMath: {
      setBlockMath: (attrs: { latex: string }) => ReturnType;
    };
  }
}

export const BlockMath = Node.create<BlockMathOptions>({
  name: 'blockMath',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onEditMath: undefined,
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes) => ({
          'data-latex': attributes.latex,
          'data-type': 'block-math',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="block-math"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockMathNodeView);
  },

  addCommands() {
    return {
      setBlockMath:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
