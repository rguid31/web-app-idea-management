import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate username
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      // Check if username already exists
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (usernameDoc.exists()) {
        setError('Username already taken');
        return;
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save username to Firestore
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: user.uid,
        username: username,
        email: email,
        createdAt: new Date()
      });

      // Save user profile
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: email,
        createdAt: new Date()
      });

      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 sm:mt-10 p-4 sm:p-6 bg-slate-800 rounded-lg shadow-xl mx-4">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Welcome to Idea Board</h2>
      
      {/* Anonymous User Option */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-700 rounded-lg border border-slate-600">
        <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Quick Start</h3>
        <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 text-center">
          Start posting ideas immediately without creating an account
        </p>
        <button 
          onClick={handleAnonymousSignIn} 
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded transition-colors text-sm sm:text-base"
        >
          🚀 Continue as Guest
        </button>
      </div>

      <div className="relative mb-4 sm:mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-2 bg-slate-800 text-gray-400">or create an account</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form className="space-y-3 sm:space-y-4">
        {isSignUp && (
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (required for signup)"
            className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        {error && <p className="text-red-500 text-xs sm:text-sm">{error}</p>}
        <div className="flex justify-around gap-2">
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsSignUp(false);
              setError('');
            }} 
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded transition-colors text-sm sm:text-base ${
              !isSignUp ? 'bg-blue-500 hover:bg-blue-600 text-white font-bold' : 'bg-slate-600 hover:bg-slate-500 text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              setIsSignUp(true);
              setError('');
            }} 
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded transition-colors text-sm sm:text-base ${
              isSignUp ? 'bg-green-500 hover:bg-green-600 text-white font-bold' : 'bg-slate-600 hover:bg-slate-500 text-gray-300'
            }`}
          >
            Sign Up
          </button>
        </div>
        
        {isSignUp && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-900 border border-blue-700 rounded text-xs sm:text-sm">
            <p className="text-blue-200 mb-1">Username requirements:</p>
            <ul className="text-blue-300 text-xs space-y-1">
              <li>• At least 3 characters long</li>
              <li>• Letters, numbers, and underscores only</li>
              <li>• Must be unique</li>
            </ul>
          </div>
        )}
        
        <div className="mt-3 sm:mt-4 text-center">
          <button 
            onClick={isSignUp ? handleSignUp : handleSignIn}
            className={`w-full py-2 sm:py-3 px-4 rounded font-bold transition-colors text-sm sm:text-base ${
              isSignUp 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
