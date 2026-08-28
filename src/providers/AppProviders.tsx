// ** Packages **
import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// ** Redux **
import store, { persistor } from '@/redux/store';

// ** Providers **
import QueryProvider from '@/providers/QueryProvider';
import AuthProvider from '@/providers/AuthProvider';

// ** Components **
import PageLoader from '@/components/feedback/PageLoader';
import ToastContainer from '@/components/feedback/ToastContainer';

// ** Types **
interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Single place that wires global providers:
 *   Redux store  →  PersistGate  →  AuthProvider  →  React Query  →  app.
 */
const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<PageLoader />} persistor={persistor}>
        <AuthProvider>
          <QueryProvider>
            {children}
            <ToastContainer />
          </QueryProvider>
        </AuthProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default AppProviders;
