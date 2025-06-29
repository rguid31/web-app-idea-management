import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// We'll create these components next
import Login from './components/Login';
import IdeaBoard from './components/IdeaBoard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <nav className="flex justify-between items-center p-3 sm:p-4 bg-slate-800">
        <h1 className="text-lg sm:text-xl font-bold">Idea Board</h1>
        {user && (
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base">
            Logout
          </button>
        )}
      </nav>
      <main className="p-3 sm:p-4">
        {user ? <IdeaBoard user={user} /> : <Login />}
      </main>
    </div>
  );
}

export default App;
