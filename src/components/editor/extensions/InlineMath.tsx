import { Node, mergeAttributes } from '@tiptap/react';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useMemo } from 'react';
import katex from 'katex';

export const InlineMathNodeView: React.FC<any> = ({ node, selected, extension }) => {
  const latex = node.attrs.latex || '';

  const html = useMemo(() => {
    if (!latex) return '<span class="text-slate-400 italic">(empty math)</span>';
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `<span class="text-rose-500 font-mono">${latex}</span>`;
    }
  }, [latex]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (extension.options.onEditMath) {
      extension.options.onEditMath(node, 'inline');
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      className={`inline-flex items-center mx-1 px-1.5 py-0.5 rounded cursor-pointer border transition-colors ${
        selected
          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300'
          : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-300'
      }`}
      onClick={handleClick}
      title="Click to edit formula"
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </NodeViewWrapper>
  );
};

export interface InlineMathOptions {
  HTMLAttributes: Record<string, any>;
  onEditMath?: (node: any, type: 'inline' | 'block') => void;
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    inlineMath: {
      setInlineMath: (attrs: { latex: string }) => ReturnType;
    };
  }
}

export const InlineMath = Node.create<InlineMathOptions>({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
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
          'data-type': 'inline-math',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="inline-math"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathNodeView);
  },

  addCommands() {
    return {
      setInlineMath:
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
