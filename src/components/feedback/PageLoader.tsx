// ** Types **
interface PageLoaderProps {
  className?: string;
}

/** Full-area centered spinner used as the route Suspense fallback. */
const PageLoader = ({ className = '' }: PageLoaderProps) => {
  return (
    <div className={`flex h-full min-h-screen w-full items-center justify-center ${className}`}>
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
    </div>
  );
};

export default PageLoader;
