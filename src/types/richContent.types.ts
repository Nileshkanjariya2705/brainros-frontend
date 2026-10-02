export interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export type RichContent = TiptapDocument | string | null | undefined;

export function isTiptapDocument(content: any): content is TiptapDocument {
  return (
    content !== null &&
    typeof content === 'object' &&
    content.type === 'doc' &&
    Array.isArray(content.content)
  );
}

export function createEmptyDocument(): TiptapDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };
}

export function createDocumentFromPlainText(text: string): TiptapDocument {
  if (!text) return createEmptyDocument();
  const paragraphs = text.split(/\r?\n/);
  return {
    type: 'doc',
    content: paragraphs.map((p) => ({
      type: 'paragraph',
      content: p ? [{ type: 'text', text: p }] : [],
    })),
  };
}

export function extractPlainTextFromTiptap(docOrText: RichContent): string {
  if (!docOrText) return '';
  if (typeof docOrText === 'string') {
    try {
      const parsed = JSON.parse(docOrText);
      if (isTiptapDocument(parsed)) {
        return extractPlainTextFromTiptap(parsed);
      }
    } catch {
      return docOrText;
    }
    return docOrText;
  }

  if (!isTiptapDocument(docOrText)) return '';

  const walk = (node: TiptapNode): string => {
    if (node.type === 'text' && node.text) {
      return node.text;
    }
    if (node.type === 'inlineMath' && node.attrs?.latex) {
      return `$${node.attrs.latex}$`;
    }
    if (node.type === 'blockMath' && node.attrs?.latex) {
      return `$$${node.attrs.latex}$$`;
    }
    if (node.type === 'image') {
      return node.attrs?.alt ? `[Image: ${node.attrs.alt}]` : '[Image]';
    }
    if (node.content && Array.isArray(node.content)) {
      const inner = node.content.map(walk).join('');
      if (
        node.type === 'paragraph' ||
        node.type === 'heading' ||
        node.type === 'listItem'
      ) {
        return inner + '\n';
      }
      return inner;
    }
    return '';
  };

  return docOrText.content.map(walk).join('').trim();
}

export function extractImagesFromTiptap(docOrText: RichContent): TiptapNode[] {
  if (!docOrText) return [];
  let doc: any = docOrText;
  if (typeof doc === 'string') {
    try {
      doc = JSON.parse(doc);
    } catch {
      return [];
    }
  }
  if (!isTiptapDocument(doc)) return [];

  const images: TiptapNode[] = [];
  const walk = (node: TiptapNode) => {
    if (!node) return;
    if (node.type === 'image') {
      images.push(node);
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };
  doc.content.forEach(walk);
  return images;
}

export function mergeTranslationWithRichDoc(
  baseDoc: RichContent,
  translatedText?: string | null,
): RichContent {
  const images = extractImagesFromTiptap(baseDoc);
  if (!translatedText && images.length === 0) {
    return baseDoc;
  }
  if (!translatedText && images.length > 0) {
    return baseDoc;
  }

  const cleanText = (translatedText || '')
    .replace(/\[Image(?::\s*[^\]]*)?\]/gi, '')
    .trim();

  if (images.length === 0) {
    return cleanText || translatedText || '';
  }

  const paragraphs = cleanText ? cleanText.split(/\r?\n/) : [];
  const contentNodes: TiptapNode[] = [];

  paragraphs.forEach((p) => {
    if (p.trim()) {
      contentNodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: p }],
      });
    }
  });

  images.forEach((img) => {
    contentNodes.push(img);
  });

  if (contentNodes.length === 0) {
    return baseDoc;
  }

  return {
    type: 'doc',
    content: contentNodes,
  };
}

