import { useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { App } from './App';

export const AppWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)'
      }}>
        <div style={{ color: '#00F0FF', fontSize: '1.2rem', fontWeight: 700 }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <App />;
};
