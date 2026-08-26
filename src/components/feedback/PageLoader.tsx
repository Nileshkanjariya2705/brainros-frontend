// ** Types **
interface PageLoaderProps {
  className?: string;
  message?: string;
  label?: string;
}

/** Full-area centered spinner used as the route Suspense fallback and auth session bootstrap loader. */
const PageLoader = ({ className = '', message, label }: PageLoaderProps) => {
  const displayText = message || label;

  return (
    <div
      className={`flex flex-col h-full min-h-screen w-full items-center justify-center space-y-4 bg-slate-50/50 backdrop-blur-xs ${className}`}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-xs" />
      {displayText && (
        <p className="text-xs font-bold text-slate-500 animate-pulse tracking-wide">
          {displayText}
        </p>
      )}
    </div>
  );
};

export default PageLoader;
