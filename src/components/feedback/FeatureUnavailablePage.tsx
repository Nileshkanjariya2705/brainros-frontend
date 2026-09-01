import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

interface FeatureUnavailablePageProps {
  featureName?: string;
}

export const FeatureUnavailablePage: React.FC<FeatureUnavailablePageProps> = ({
  featureName,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 shadow-inner mb-6">
        <ShieldOff size={40} className="text-slate-400" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-3">
        Feature Unavailable
      </span>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-3xl">
        This Functionality is Not Currently Enabled
      </h1>

      <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {featureName
          ? `The feature module [${featureName}] is currently deactivated in this deployment environment.`
          : 'This feature is currently deactivated in this deployment environment.'}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto"
        >
          <ArrowLeft size={16} className="mr-2" /> Go Back
        </Button>
        <Button
          onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <Home size={16} className="mr-2" /> Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default FeatureUnavailablePage;
