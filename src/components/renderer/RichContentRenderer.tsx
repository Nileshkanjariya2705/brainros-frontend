import React, { useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  TiptapDocument,
  TiptapNode,
  TiptapMark,
  RichContent,
  isTiptapDocument,
} from '@/types/richContent.types';
import { API_URL } from '@config';

interface RichContentRendererProps {
  content?: RichContent;
  className?: string;
  inline?: boolean;
}

/**
 * Resolve image src URLs:
 * - Cloudinary / absolute URLs → pass through
 * - Relative URLs like /storage/uploads/... → prefix with API_URL
 * - data: URIs → pass through
 */
const resolveImageSrc = (src?: string): string => {
  if (!src) return '';
  // Already absolute or data URI
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  // Relative URL — resolve against backend API URL
  const base = (API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return `${base}${src.startsWith('/') ? '' : '/'}${src}`;
};

/**
 * Image component with error handling — shows a visible placeholder on load failure
 */
const ImageNode: React.FC<{ src?: string; alt?: string }> = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveImageSrc(src);

  if (hasError || !resolvedSrc) {
    return (
      <div className="my-3 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <div>
          <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
          </svg>
          <span className="mt-1 block text-xs text-slate-500 font-medium">
            {alt || 'Image could not be loaded'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 block">
      <img
        src={resolvedSrc}
        alt={alt || 'Question diagram'}
        loading="lazy"
        onError={() => setHasError(true)}
        className="max-w-full h-auto max-h-96 rounded-xl border border-slate-200/80 shadow-xs mx-auto object-contain bg-white"
        referrerPolicy="no-referrer"
      />
      {alt && (
        <span className="block text-center text-[11px] text-slate-400 mt-1 italic">
          {alt}
        </span>
      )}
    </div>
  );
};

const renderInlineMath = (latex: string) => {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
    return (
      <span
        className="inline-math inline-block align-middle mx-0.5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="text-rose-500 font-mono text-xs">{latex}</span>;
  }
};

const renderBlockMath = (latex: string) => {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
    });
    return (
      <div
        className="block-math my-3 py-1 overflow-x-auto text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <div className="text-rose-500 font-mono text-xs my-2">{latex}</div>;
  }
};

const renderTextWithMarks = (text: string, marks?: TiptapMark[], key?: any) => {
  if (!marks || marks.length === 0) {
    return <React.Fragment key={key}>{text}</React.Fragment>;
  }

  let element: React.ReactNode = text;

  marks.forEach((mark) => {
    switch (mark.type) {
      case 'bold':
        element = <strong className="font-bold text-inherit">{element}</strong>;
        break;
      case 'italic':
        element = <em className="italic text-inherit">{element}</em>;
        break;
      case 'underline':
        element = <u className="underline text-inherit">{element}</u>;
        break;
      case 'strike':
        element = <s className="line-through text-inherit">{element}</s>;
        break;
      case 'code':
        element = (
          <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700">
            {element}
          </code>
        );
        break;
      case 'subscript':
        element = <sub className="text-[0.75em] leading-none">{element}</sub>;
        break;
      case 'superscript':
        element = <sup className="text-[0.75em] leading-none">{element}</sup>;
        break;
      default:
        break;
    }
  });

  return <React.Fragment key={key}>{element}</React.Fragment>;
};

const renderNode = (node: TiptapNode, index: number): React.ReactNode => {
  switch (node.type) {
    case 'text':
      return renderTextWithMarks(node.text || '', node.marks, index);

    case 'inlineMath':
      return <React.Fragment key={index}>{renderInlineMath(node.attrs?.latex || '')}</React.Fragment>;

    case 'blockMath':
      return <React.Fragment key={index}>{renderBlockMath(node.attrs?.latex || '')}</React.Fragment>;

    case 'image':
      return (
        <ImageNode
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt}
        />
      );

    case 'paragraph': {
      if (!node.content || node.content.length === 0) {
        return <p key={index} className="min-h-[1.25em]" />;
      }
      return (
        <p key={index} className="mb-2 last:mb-0 leading-relaxed text-inherit">
          {node.content.map((child, cIdx) => renderNode(child, cIdx))}
        </p>
      );
    }

    case 'heading': {
      const level = node.attrs?.level || 2;
      const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
      const headingClass =
        level === 1
          ? 'text-lg font-bold mb-2'
          : level === 2
          ? 'text-base font-bold mb-1.5'
          : 'text-sm font-semibold mb-1';

      return (
        <Tag key={index} className={headingClass}>
          {node.content?.map((child, cIdx) => renderNode(child, cIdx))}
        </Tag>
      );
    }

    case 'bulletList':
      return (
        <ul key={index} className="list-disc list-inside space-y-1 my-2 text-inherit">
          {node.content?.map((child, cIdx) => renderNode(child, cIdx))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={index} className="list-decimal list-inside space-y-1 my-2 text-inherit">
          {node.content?.map((child, cIdx) => renderNode(child, cIdx))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={index} className="text-inherit">
          {node.content?.map((child, cIdx) => renderNode(child, cIdx))}
        </li>
      );

    case 'hardBreak':
      return <br key={index} />;

    default:
      if (node.content) {
        return (
          <React.Fragment key={index}>
            {node.content.map((child, cIdx) => renderNode(child, cIdx))}
          </React.Fragment>
        );
      }
      return null;
  }
};

/**
 * Parses raw strings that might contain math delimiters ($...$ or $$...$$) or LaTeX formulas
 */
function renderPlainTextWithMathFallback(text: string): React.ReactNode {
  if (!text) return null;

  // Check for LaTeX dollar delimiters ($...$ or $$...$$)
  const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
  const parts = text.split(mathRegex);

  if (parts.length === 1) {
    // Check if whole text is a pure LaTeX expression without dollars (e.g. \frac{1}{2}, \sqrt{x})
    if (
      (text.includes('\\frac') ||
        text.includes('\\sqrt') ||
        text.includes('\\pm') ||
        text.includes('\\alpha') ||
        text.includes('\\beta') ||
        text.includes('\\int') ||
        text.includes('^') ||
        text.includes('_')) &&
      !text.includes('<')
    ) {
      try {
        const html = katex.renderToString(text, { throwOnError: false, displayMode: false });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return text;
      }
    }
    return text;
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          return <span key={i}>{renderBlockMath(formula)}</span>;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          return <span key={i}>{renderInlineMath(formula)}</span>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

export const RichContentRenderer: React.FC<RichContentRendererProps> = React.memo(
  ({ content, className = '', inline = false }) => {
    const parsedDocument = useMemo<TiptapDocument | null>(() => {
      if (!content) return null;
      if (isTiptapDocument(content)) return content;
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          if (isTiptapDocument(parsed)) return parsed;
        } catch {
          return null;
        }
      }
      return null;
    }, [content]);

    if (!content) {
      return null;
    }

    if (parsedDocument) {
      return (
        <div
          className={`rich-content-container text-inherit leading-relaxed ${
            inline ? 'inline' : ''
          } ${className}`}
        >
          {parsedDocument.content.map((node, index) => renderNode(node, index))}
        </div>
      );
    }

    // Fallback for plain string / legacy format
    const textContent = typeof content === 'string' ? content : String(content);
    return (
      <span className={`text-inherit leading-relaxed ${className}`}>
        {renderPlainTextWithMathFallback(textContent)}
      </span>
    );
  },
);

RichContentRenderer.displayName = 'RichContentRenderer';

export default RichContentRenderer;
