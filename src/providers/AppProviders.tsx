// ** Packages **
import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// ** Redux **
import store, { persistor } from '@/redux/store';

// ** Providers **
import QueryProvider from '@/providers/QueryProvider';

// ** Components **
import PageLoader from '@/components/feedback/PageLoader';

// ** Types **
interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Single place that wires global providers:
 *   Redux store  →  PersistGate (waits for rehydration)  →  React Query  →  app.
 */
const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<PageLoader />} persistor={persistor}>
        <QueryProvider>{children}</QueryProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default AppProviders;
