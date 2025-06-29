import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, getDocs } from 'firebase/firestore';
import TrendingRepos from './TrendingRepos';
import AccountSettings from './AccountSettings';

const IdeaBoard = ({ user }) => {
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');
  const [showTrendingRepos, setShowTrendingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [sortBy, setSortBy] = useState('new'); // 'new', 'top', 'hot'
  const [sortedIdeas, setSortedIdeas] = useState([]);

  // Fetch user profile for registered users
  const fetchUserProfile = async () => {
    if (user && user.email) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // Read ideas from Firestore
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'ideas'));
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const ideasData = [];
        
        // Process each idea and fetch usernames if needed
        for (const doc of querySnapshot.docs) {
          const ideaData = { ...doc.data(), id: doc.id };
          
          // If idea has userEmail but no userDisplayName, try to fetch username
          if (ideaData.userEmail && !ideaData.userDisplayName) {
            try {
              // Try to find user by email in users collection
              const usersQuery = query(collection(db, 'users'), where('email', '==', ideaData.userEmail));
              const userSnapshot = await getDocs(usersQuery);
              if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                ideaData.userDisplayName = userDoc.data().username;
              }
            } catch (error) {
              console.error('Error fetching username for idea:', error);
            }
          }
          
          ideasData.push(ideaData);
        }
        
        // Temporarily remove sorting while index builds
        // ideasData.sort((a, b) => {
        //   const votesA = a.votes || 0;
        //   const votesB = b.votes || 0;
        //   if (votesA !== votesB) {
        //     return votesB - votesA; // Sort by votes descending
        //   }
        //   // If votes are equal, sort by creation date (newest first)
        //   return new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt);
        // });
        setIdeas(ideasData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Create a new idea
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newIdea.trim() === '') return;
    
    const ideaData = {
      text: newIdea,
      userId: user.uid,
      userEmail: user.email || null,
      userDisplayName: user.email ? (userProfile?.username || user.email) : (displayName || 'Anonymous'),
      createdAt: new Date(),
      votes: 0,
      votedBy: []
    };

    // Add repository information if a repo was selected
    if (selectedRepo) {
      ideaData.inspiredBy = {
        repoName: selectedRepo.fullName,
        repoUrl: selectedRepo.url,
        repoDescription: selectedRepo.description,
        language: selectedRepo.language
      };
    }

    await addDoc(collection(db, 'ideas'), ideaData);
    setNewIdea('');
    setSelectedRepo(null);
  };

  // Handle voting on an idea
  const handleVote = async (ideaId, currentVotes, votedBy) => {
    const ideaRef = doc(db, 'ideas', ideaId);
    const hasVoted = votedBy?.includes(user.uid);

    if (hasVoted) {
      // Remove vote
      await updateDoc(ideaRef, {
        votes: increment(-1),
        votedBy: arrayRemove(user.uid)
      });
    } else {
      // Add vote
      await updateDoc(ideaRef, {
        votes: increment(1),
        votedBy: arrayUnion(user.uid)
      });
    }
  };

  // Handle repository selection
  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    // Auto-fill the idea input with inspiration from the repo
    if (repo.description) {
      setNewIdea(`Inspired by ${repo.fullName}: ${repo.description}`);
    } else {
      setNewIdea(`Inspired by ${repo.fullName}`);
    }
  };

  // Clear selected repository
  const clearSelectedRepo = () => {
    setSelectedRepo(null);
  };

  // Handle account settings close and refresh profile
  const handleAccountSettingsClose = () => {
    setShowAccountSettings(false);
    fetchUserProfile(); // Refresh profile after settings update
  };

  // Sort ideas based on selected criteria
  const sortIdeas = (ideasToSort, sortCriteria) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return [...ideasToSort].sort((a, b) => {
      const votesA = a.votes || 0;
      const votesB = b.votes || 0;
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      const timeDiffA = now - dateA;
      const timeDiffB = now - dateB;

      switch (sortCriteria) {
        case 'new':
          // Sort by creation date (newest first)
          return dateB - dateA;
        
        case 'top':
          // Sort by total votes (highest first)
          if (votesA !== votesB) {
            return votesB - votesA;
          }
          // If votes are equal, sort by creation date (newest first)
          return dateB - dateA;
        
        case 'hot':
          // Hot algorithm: votes / time^1.5 (Reddit-style)
          const hotScoreA = votesA / Math.pow((timeDiffA / 1000 / 3600) + 2, 1.5);
          const hotScoreB = votesB / Math.pow((timeDiffB / 1000 / 3600) + 2, 1.5);
          return hotScoreB - hotScoreA;
        
        default:
          return dateB - dateA;
      }
    });
  };

  // Update sorted ideas when ideas or sort criteria change
  useEffect(() => {
    setSortedIdeas(sortIdeas(ideas, sortBy));
  }, [ideas, sortBy]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold break-words">
            Welcome, {user.email ? (userProfile?.username || user.email) : 'Guest User'}
          </h2>
          {!user.email && (
            <p className="text-sm text-gray-400 mt-1">
              You're browsing as a guest. Create an account to save your ideas permanently.
            </p>
          )}
          {user.email && !userProfile?.username && (
            <p className="text-sm text-yellow-400 mt-1">
              ⚠️ No username set. <button 
                onClick={() => setShowAccountSettings(true)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Create one here
              </button> to display your name instead of email.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {user.email && (
            <button
              onClick={() => setShowAccountSettings(true)}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm sm:text-base"
            >
              ⚙️ Settings
            </button>
          )}
          <button
            onClick={() => setShowTrendingRepos(!showTrendingRepos)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
          >
            {showTrendingRepos ? 'Hide' : 'Show'} Trending Repos
          </button>
        </div>
      </div>

      {/* Trending Repositories Section */}
      {showTrendingRepos && (
        <div className="mb-6">
          <TrendingRepos onRepoSelect={handleRepoSelect} />
        </div>
      )}

      {/* Selected Repository Info */}
      {selectedRepo && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-3 sm:p-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-blue-200 mb-2 text-sm sm:text-base">
                💡 Inspired by: {selectedRepo.fullName}
              </h4>
              {selectedRepo.description && (
                <p className="text-blue-300 text-xs sm:text-sm mb-2 line-clamp-2">{selectedRepo.description}</p>
              )}
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-blue-400">
                <span>⭐ {selectedRepo.stars}</span>
                <span>🍴 {selectedRepo.forks}</span>
                {selectedRepo.language && (
                  <span>🔧 {selectedRepo.language}</span>
                )}
              </div>
            </div>
            <button
              onClick={clearSelectedRepo}
              className="text-blue-400 hover:text-blue-300 text-sm ml-2 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Idea Creation Form */}
      <div className="mb-6">
        {!user.email && (
          <div className="mb-4">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full p-3 sm:p-2 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-sm sm:text-base"
            />
            <p className="text-xs text-gray-400">
              Add your name to identify your ideas (optional)
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            placeholder={selectedRepo ? "Modify your inspired idea..." : "What's your next big idea?"}
            className="flex-1 p-3 sm:p-2 bg-slate-700 rounded sm:rounded-l sm:rounded-r-none border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 sm:py-2 px-4 rounded sm:rounded-l-none sm:rounded-r text-sm sm:text-base">
            Add Idea
          </button>
        </form>
      </div>

      {/* Sorting Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <div className="flex bg-slate-700 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setSortBy('hot')}
              className={`flex-1 sm:flex-none px-3 py-2 sm:py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'hot'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              🔥 Hot
            </button>
            <button
              onClick={() => setSortBy('top')}
              className={`flex-1 sm:flex-none px-3 py-2 sm:py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'top'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              ⭐ Top
            </button>
            <button
              onClick={() => setSortBy('new')}
              className={`flex-1 sm:flex-none px-3 py-2 sm:py-1 rounded text-sm font-medium transition-colors ${
                sortBy === 'new'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              🆕 New
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {sortBy === 'hot' && '🔥 Hot: Trending ideas based on votes and recency'}
          {sortBy === 'top' && '⭐ Top: Most voted ideas of all time'}
          {sortBy === 'new' && '🆕 New: Latest ideas posted'}
        </div>
      </div>

      {/* Ideas List */}
      <div className="space-y-3">
        {sortedIdeas.map((idea, index) => {
          const hasVoted = idea.votedBy?.includes(user.uid);
          const voteCount = idea.votes || 0;
          
          return (
            <div key={idea.id} className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow">
              <div className="space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-400 font-mono flex-shrink-0 mt-1">
                    #{index + 1}
                  </span>
                  <p className="flex-1 text-sm sm:text-base leading-relaxed">{idea.text}</p>
                </div>
                
                {/* User Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>
                    by {idea.userDisplayName || idea.userEmail || 'Anonymous'}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span>
                    {idea.createdAt?.toDate?.() ? 
                      idea.createdAt.toDate().toLocaleDateString() : 
                      new Date(idea.createdAt).toLocaleDateString()
                    }
                  </span>
                </div>
                
                {/* Vote Button and Count */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVote(idea.id, voteCount, idea.votedBy)}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      hasVoted
                        ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
                        : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                    }`}
                  >
                    {hasVoted ? '⭐' : '☆'} {voteCount}
                  </button>
                  {voteCount > 0 && (
                    <span className="text-xs text-gray-400">
                      {voteCount === 1 ? '1 vote' : `${voteCount} votes`}
                    </span>
                  )}
                </div>

                {idea.inspiredBy && (
                  <div className="bg-slate-700 rounded p-3 text-sm">
                    <p className="text-blue-400 mb-2">
                      💡 Inspired by: <a 
                        href={idea.inspiredBy.repoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 underline break-all"
                      >
                        {idea.inspiredBy.repoName}
                      </a>
                    </p>
                    {idea.inspiredBy.repoDescription && (
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                        {idea.inspiredBy.repoDescription}
                      </p>
                    )}
                    {idea.inspiredBy.language && (
                      <span className="inline-block bg-blue-600 text-blue-200 text-xs px-2 py-1 rounded">
                        {idea.inspiredBy.language}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettings 
          user={user} 
          onClose={handleAccountSettingsClose}
        />
      )}
    </div>
  );
};

export default IdeaBoard;
