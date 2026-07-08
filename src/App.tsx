// ** Providers **
import AppProviders from '@/providers/AppProviders';

// ** Routes **
import AppRouter from '@/routes';

// ** Components **
import ErrorBoundary from '@/components/feedback/ErrorBoundary';

const App = () => {
  return (
    // Outermost boundary — catches errors from the providers, router and pages.
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
