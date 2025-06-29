import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LoadingSpinner } from './components/Progress';
import Icon from './components/Icon';

// We'll create these components next
import Login from './components/Login';
import IdeaBoard from './components/IdeaBoard';
import Footer from './components/Footer';

// Inner App component that uses theme context
function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme, isLoading: themeLoading } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  if (loading || themeLoading) {
    return (
      <div className="bg-slate-900 dark:bg-slate-900 light:bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" variant="primary" />
          <p className="text-slate-300 dark:text-slate-300 light:text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 dark:bg-slate-900 light:bg-gray-50 min-h-screen text-white dark:text-white light:text-slate-900 transition-colors duration-200 flex flex-col">
      <nav className="flex justify-between items-center p-3 sm:p-4 bg-slate-800 dark:bg-slate-800 light:bg-white border-b dark:border-slate-700 light:border-gray-200">
        <div className="flex items-center gap-4">
          <Icon name="light-bulb" size="lg" className="text-blue-500" />
          <h1 className="text-lg sm:text-xl font-bold">Idea Board</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            <Icon 
              name={theme === 'dark' ? 'sun' : 'moon'} 
              size="sm"
              className="text-yellow-400 dark:text-yellow-400 light:text-slate-600"
            />
          </button>
          
          {user && (
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base transition-colors flex items-center gap-2"
            >
              <Icon name="arrow-right" size="sm" />
              Logout
            </button>
          )}
        </div>
      </nav>
      <main className="flex-1 p-3 sm:p-4">
        {user ? <IdeaBoard user={user} /> : <Login />}
      </main>
      <Footer />
    </div>
  );
}

// Main App component with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
