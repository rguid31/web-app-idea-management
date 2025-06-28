import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, getDocs, query, where } from 'firebase/firestore';

const AccountSettings = ({ user, onClose }) => {
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.email) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUsername(userData.username || '');
            setUsername(userData.username || '');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const validateUsername = (username) => {
    if (!username.trim()) {
      return 'Username is required';
    }
    
    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    return null;
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    // Check if username is different from current
    if (username.toLowerCase() === currentUsername.toLowerCase()) {
      setError('Username is the same as current username');
      setLoading(false);
      return;
    }

    try {
      // Check if username already exists
      const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
      if (usernameDoc.exists() && usernameDoc.data().uid !== user.uid) {
        setError('Username already taken');
        setLoading(false);
        return;
      }

      // Update username in usernames collection
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: user.uid,
        username: username,
        email: user.email,
        createdAt: new Date()
      });

      // Update user profile
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: user.email,
        createdAt: new Date()
      }, { merge: true });

      // Remove old username entry if it exists
      if (currentUsername && currentUsername.toLowerCase() !== username.toLowerCase()) {
        try {
          await setDoc(doc(db, 'usernames', currentUsername.toLowerCase()), {
            uid: null,
            deleted: true
          });
        } catch (error) {
          console.error('Error removing old username:', error);
        }
      }

      setCurrentUsername(username);
      setSuccess('Username updated successfully!');
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Current email: <span className="font-mono text-blue-300">{user.email}</span>
          </p>
          
          {currentUsername ? (
            <p className="text-gray-300 mb-4">
              Current username: <span className="font-mono text-green-300">@{currentUsername}</span>
            </p>
          ) : (
            <p className="text-yellow-300 mb-4">
              ⚠️ No username set. Create one to display your name instead of email.
            </p>
          )}
        </div>

        <form onSubmit={handleUpdateUsername}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {currentUsername ? 'Update Username' : 'Create Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full p-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          <div className="mb-4 p-3 bg-blue-900 border border-blue-700 rounded text-sm">
            <p className="text-blue-200 mb-1">Username requirements:</p>
            <ul className="text-blue-300 text-xs space-y-1">
              <li>• At least 3 characters long</li>
              <li>• Letters, numbers, and underscores only</li>
              <li>• Must be unique across all users</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              {loading ? 'Updating...' : (currentUsername ? 'Update Username' : 'Create Username')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings; 