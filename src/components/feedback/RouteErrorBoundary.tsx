import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const RouteErrorBoundary = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const errorMessage =
    error?.message || error?.statusText || 'An unexpected error occurred while loading this page.';

  const isChunkLoadError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Loading chunk');

  const handleReload = () => {
    window.location.reload();
  };

  const handleReturnHome = () => {
    navigate(PRIVATE_NAVIGATION.dashboard);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-amber-100 shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
        <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            {isChunkLoadError ? 'Page Module Updated' : 'Something Went Wrong'}
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            {isChunkLoadError
              ? 'The application was updated or the page module needs to be reloaded to fetch the latest version.'
              : errorMessage}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleReload}
            className="w-full sm:w-auto shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleReturnHome}
            className="w-full sm:w-auto"
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;
