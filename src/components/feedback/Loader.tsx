// ** Types **
interface LoaderProps {
  label?: string;
}

/** Inline centered spinner (e.g. section-level loading state). */
const Loader = ({ label = 'Loading…' }: LoaderProps) => {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

export default Loader;
