import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { App } from './App';
import { Header } from './components/Header';
import { StartScreenSkeleton } from './components/StartScreenSkeleton';

export const AppWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-dark)' }}>
        <Header onNavigate={() => {}} onMenuClick={() => {}} />
        <main style={{ flex: 1, paddingBottom: '60px' }}>
          <StartScreenSkeleton />
        </main>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <App />;
};
