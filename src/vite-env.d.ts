/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_API_TIMEOUT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// SVG imports (mirrors the repo's svg.d.ts)
declare module '*.svg?react' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default ReactComponent;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
