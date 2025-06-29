import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, getDocs } from 'firebase/firestore';
import TrendingRepos from './TrendingRepos';
import AccountSettings from './AccountSettings';
import { renderMarkdown, hasMarkdown } from '../utils/markdown';
import SwipeableIdeaCard from './SwipeableIdeaCard';
import BottomSheet from './BottomSheet';

const IdeaBoard = ({ user }) => {
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');
  const [showTrendingRepos, setShowTrendingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [sortBy, setSortBy] = useState(null); // null = chronological order, 'new', 'top', 'hot'
  const [sortedIdeas, setSortedIdeas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingStates, setVotingStates] = useState({}); // Track voting loading states
  const [notification, setNotification] = useState(null); // For feedback messages
  const [newTags, setNewTags] = useState(''); // Tags for new ideas
  const [availableTags, setAvailableTags] = useState([]); // All available tags
  const [selectedCategory, setSelectedCategory] = useState(''); // Category filter
  const [displayedIdeasCount, setDisplayedIdeasCount] = useState(20); // Number of ideas to display
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Loading state for infinite scroll
  const [isMobile, setIsMobile] = useState(false); // Track mobile screen size
  const [isScrolled, setIsScrolled] = useState(false); // Track scroll position for sticky header

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
        
        // Collect all unique tags
        const allTags = new Set();
        ideasData.forEach(idea => {
          if (idea.tags && Array.isArray(idea.tags)) {
            idea.tags.forEach(tag => allTags.add(tag));
          }
        });
        setAvailableTags(Array.from(allTags).sort());
        
        setIdeas(ideasData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Create a new idea
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newIdea.trim() === '' || newIdea.length > 500) return;
    
    setIsSubmitting(true);
    
    try {
      // Process tags
      const tags = newTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length <= 20)
        .slice(0, 5); // Limit to 5 tags
      
      const ideaData = {
        text: newIdea,
        userId: user.uid,
        userEmail: user.email || null,
        userDisplayName: user.email ? (userProfile?.username || user.email) : (displayName || 'Anonymous'),
        createdAt: new Date(),
        votes: 0,
        votedBy: {
          upvotes: [],
          downvotes: []
        },
        tags: tags
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
      setNewTags('');
      setSelectedRepo(null);
      showNotification('💡 Idea added successfully!', 'success');
    } catch (error) {
      console.error('Error adding idea:', error);
      showNotification('❌ Failed to add idea. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle voting on an idea
  const handleVote = async (ideaId, currentVotes, votedBy, voteType) => {
    // Prevent multiple votes while one is processing
    if (votingStates[ideaId]) return;
    
    setVotingStates(prev => ({ ...prev, [ideaId]: true }));
    
    try {
      console.log('Starting vote update:', { ideaId, currentVotes, votedBy, voteType, userId: user.uid });
      
      const ideaRef = doc(db, 'ideas', ideaId);
      
      // Get current voting state
      const currentVotedBy = votedBy || {};
      const upvotes = currentVotedBy.upvotes || [];
      const downvotes = currentVotedBy.downvotes || [];
      
      const hasUpvoted = upvotes.includes(user.uid);
      const hasDownvoted = downvotes.includes(user.uid);

      console.log('Current voting state:', { upvotes, downvotes, hasUpvoted, hasDownvoted });

      // Create new vote arrays
      let newUpvotes = [...upvotes];
      let newDownvotes = [...downvotes];
      let voteChange = 0;

      if (voteType === 'upvote') {
        if (hasUpvoted) {
          // Remove upvote
          newUpvotes = newUpvotes.filter(id => id !== user.uid);
          voteChange = -1;
          console.log('Removing upvote');
        } else {
          // Add upvote
          newUpvotes.push(user.uid);
          // Remove from downvotes if exists
          newDownvotes = newDownvotes.filter(id => id !== user.uid);
          voteChange = hasDownvoted ? 2 : 1; // +2 if removing downvote, +1 if new upvote
          console.log('Adding upvote, removing downvote if exists');
        }
      } else if (voteType === 'downvote') {
        if (hasDownvoted) {
          // Remove downvote
          newDownvotes = newDownvotes.filter(id => id !== user.uid);
          voteChange = 1;
          console.log('Removing downvote');
        } else {
          // Add downvote
          newDownvotes.push(user.uid);
          // Remove from upvotes if exists
          newUpvotes = newUpvotes.filter(id => id !== user.uid);
          voteChange = hasUpvoted ? -2 : -1; // -2 if removing upvote, -1 if new downvote
          console.log('Adding downvote, removing upvote if exists');
        }
      }

      console.log('New voting state:', { newUpvotes, newDownvotes, voteChange });

      // Update the document
      const updateData = {
        votes: increment(voteChange),
        'votedBy.upvotes': newUpvotes,
        'votedBy.downvotes': newDownvotes
      };
      
      console.log('Updating document with:', updateData);
      
      await updateDoc(ideaRef, updateData);

      console.log(`Vote updated successfully: ${voteType}, change: ${voteChange}, new votes: ${currentVotes + voteChange}`);
    } catch (error) {
      console.error('Error updating vote:', error);
      showNotification('❌ Failed to update vote. Please try again.', 'error');
    } finally {
      setVotingStates(prev => ({ ...prev, [ideaId]: false }));
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
          // Default: chronological order (newest first)
          return dateB - dateA;
      }
    });
  };

  // Filter and sort ideas
  const filteredAndSortedIdeas = () => {
    let filtered = ideas;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = ideas.filter(idea => 
        idea.text.toLowerCase().includes(searchLower) ||
        (idea.userDisplayName && idea.userDisplayName.toLowerCase().includes(searchLower)) ||
        (idea.inspiredBy && idea.inspiredBy.repoName.toLowerCase().includes(searchLower)) ||
        (idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Apply category filter
    if (selectedCategory.trim()) {
      filtered = filtered.filter(idea => 
        idea.tags && idea.tags.includes(selectedCategory.toLowerCase())
      );
    }
    
    return sortIdeas(filtered, sortBy);
  };

  // Update sorted ideas when ideas, sort criteria, search term, or category change
  useEffect(() => {
    setSortedIdeas(filteredAndSortedIdeas());
    setDisplayedIdeasCount(20); // Reset displayed count when filters change
  }, [ideas, sortBy, searchTerm, selectedCategory]);

  // Infinite scroll and sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      // Infinite scroll logic
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - 1000 && 
          displayedIdeasCount < sortedIdeas.length && 
          !isLoadingMore) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setDisplayedIdeasCount(prev => Math.min(prev + 20, sortedIdeas.length));
          setIsLoadingMore(false);
        }, 500); // Small delay to show loading state
      }

      // Sticky header logic
      setIsScrolled(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedIdeasCount, sortedIdeas.length, isLoadingMore]);

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 transition-all duration-300 ${
        isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white">💡 Ideas</h1>
              {searchTerm && (
                <span className="text-xs text-gray-400 bg-slate-700 px-2 py-1 rounded">
                  "{searchTerm}"
                </span>
              )}
              {selectedCategory && (
                <span className="text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded">
                  #{selectedCategory}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick sort buttons */}
              <div className="flex bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setSortBy(null)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors min-h-[32px] touch-manipulation ${
                    sortBy === null
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  📅
                </button>
                <button
                  onClick={() => setSortBy('hot')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors min-h-[32px] touch-manipulation ${
                    sortBy === 'hot'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  🔥
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors min-h-[32px] touch-manipulation ${
                    sortBy === 'top'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  ⭐
                </button>
              </div>
              
              {/* Quick action buttons */}
              <button
                onClick={() => setShowTrendingRepos(!showTrendingRepos)}
                className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded text-xs min-h-[32px] touch-manipulation"
              >
                🔥
              </button>
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-slate-600 hover:bg-slate-500 text-white p-2 rounded text-xs min-h-[32px] touch-manipulation"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>

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
              className="bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-white font-bold py-3 px-4 rounded transition-colors text-sm sm:text-base min-h-[44px] touch-manipulation"
            >
              ⚙️ Settings
            </button>
          )}
          <button
            onClick={() => setShowTrendingRepos(!showTrendingRepos)}
            className="bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white font-bold py-3 px-4 rounded text-sm sm:text-base min-h-[44px] touch-manipulation"
          >
            {isMobile ? '🔥 Trending' : (showTrendingRepos ? 'Hide' : 'Show') + ' Trending Repos'}
          </button>
        </div>
      </div>

      {/* Trending Repositories Section - Desktop */}
      {showTrendingRepos && !isMobile && (
        <div className="mb-6">
          <TrendingRepos onRepoSelect={handleRepoSelect} />
        </div>
      )}

      {/* Trending Repositories Section - Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheet 
          isOpen={showTrendingRepos} 
          onClose={() => setShowTrendingRepos(false)}
          title="🔥 Trending Repositories"
        >
          <div className="p-4">
            <TrendingRepos onRepoSelect={(repo) => {
              handleRepoSelect(repo);
              setShowTrendingRepos(false); // Close bottom sheet after selection
            }} />
          </div>
        </BottomSheet>
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

      {/* Category Filter */}
      {availableTags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-400">Filter by tag:</span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-xs transition-colors min-h-[36px] touch-manipulation ${
                selectedCategory === ''
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-600 text-gray-300 hover:bg-slate-500 active:bg-slate-400'
              }`}
            >
              All
            </button>
            {availableTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedCategory(selectedCategory === tag ? '' : tag)}
                className={`px-4 py-2 rounded-full text-xs transition-colors min-h-[36px] touch-manipulation ${
                  selectedCategory === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-600 text-gray-300 hover:bg-slate-500 active:bg-slate-400'
                }`}
              >
                {tag}
              </button>
            ))}
            {availableTags.length > 10 && (
              <span className="text-xs text-gray-500">
                +{availableTags.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search ideas, users, tags, or repositories..."
            className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-400">
            Showing {sortedIdeas.length} result{sortedIdeas.length !== 1 ? 's' : ''} for "{searchTerm}"
            <button 
              onClick={() => setSearchTerm('')}
              className="ml-2 text-blue-400 hover:text-blue-300 underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

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
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              rows="3"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder={selectedRepo ? "Modify your inspired idea..." : "What's your next big idea?"}
              className={`w-full p-3 bg-slate-700 rounded border focus:outline-none focus:ring-2 text-sm sm:text-base resize-none ${
                newIdea.length > 500 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-slate-600 focus:ring-blue-500'
              }`}
              maxLength="500"
            />
            <div className={`absolute bottom-2 right-2 text-xs ${
              newIdea.length > 450 
                ? 'text-red-400' 
                : newIdea.length > 400 
                  ? 'text-yellow-400' 
                  : 'text-gray-500'
            }`}>
              {newIdea.length}/500
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Add tags (comma-separated, e.g., web, mobile, ai)"
              className="w-full p-3 bg-slate-700 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              maxLength="100"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {newTags.split(',').filter(t => t.trim()).length}/5 tags
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              type="submit" 
              disabled={isSubmitting || newIdea.trim() === '' || newIdea.length > 500}
              className={`flex-1 sm:flex-none font-bold py-4 px-6 rounded text-sm sm:text-base transition-all duration-200 min-h-[48px] touch-manipulation ${
                isSubmitting || newIdea.trim() === '' || newIdea.length > 500
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hover:scale-105 active:scale-95'
              }`}
            >
              {isSubmitting ? '🔄 Adding...' : '💡 Add Idea'}
            </button>
            {(newIdea.trim() || newTags.trim()) && (
              <button
                type="button"
                onClick={() => {setNewIdea(''); setNewTags(''); setSelectedRepo(null);}}
                className="px-4 py-4 bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-white rounded text-sm transition-colors min-h-[48px] touch-manipulation"
              >
                Clear
              </button>
            )}
          </div>
          {newIdea.length > 400 && (
            <p className={`text-xs ${
              newIdea.length > 500 ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {newIdea.length > 500 
                ? '⚠️ Idea is too long! Please keep it under 500 characters.' 
                : `⚠️ Approaching character limit (${500 - newIdea.length} remaining)`
              }
            </p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            <details className="cursor-pointer">
              <summary className="hover:text-gray-400">📝 Formatting supported</summary>
              <div className="mt-2 space-y-1 bg-slate-700 p-2 rounded text-xs">
                <div>**bold text** → <strong>bold text</strong></div>
                <div>*italic text* → <em>italic text</em></div>
                <div>`code` → <code className="bg-slate-600 px-1 rounded">code</code></div>
                <div>[link text](https://example.com) → <a href="#" className="text-blue-400">link text</a></div>
                <div>URLs are automatically linked</div>
              </div>
            </details>
          </div>
        </form>
      </div>

      {/* Sorting Controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <div className="flex bg-slate-700 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setSortBy(null)}
              className={`flex-1 sm:flex-none px-3 py-3 sm:py-2 rounded text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
                sortBy === null
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              📅 Latest
            </button>
            <button
              onClick={() => setSortBy('hot')}
              className={`flex-1 sm:flex-none px-3 py-3 sm:py-2 rounded text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
                sortBy === 'hot'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              🔥 Hot
            </button>
            <button
              onClick={() => setSortBy('top')}
              className={`flex-1 sm:flex-none px-3 py-3 sm:py-2 rounded text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
                sortBy === 'top'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              ⭐ Top
            </button>
            <button
              onClick={() => setSortBy('new')}
              className={`flex-1 sm:flex-none px-3 py-3 sm:py-2 rounded text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
                sortBy === 'new'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-slate-600 active:bg-slate-500'
              }`}
            >
              🆕 New
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {sortBy === null && '📅 Latest: Most recent ideas posted (chronological order)'}
          {sortBy === 'hot' && '🔥 Hot: Trending ideas based on votes and recency'}
          {sortBy === 'top' && '⭐ Top: Most voted ideas of all time'}
          {sortBy === 'new' && '🆕 New: Latest ideas posted'}
        </div>
      </div>

      {/* Ideas List */}
      <div className="space-y-3">
        {sortedIdeas.slice(0, displayedIdeasCount).map((idea, index) => (
          <SwipeableIdeaCard
            key={idea.id}
            idea={idea}
            index={index}
            user={user}
            handleVote={handleVote}
            votingStates={votingStates}
            setSelectedCategory={setSelectedCategory}
            selectedCategory={selectedCategory}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {isLoadingMore && (
        <div className="text-center py-4">
          <div className="text-2xl">🔄</div>
          <p className="text-gray-500 text-sm mt-2">Loading more ideas...</p>
        </div>
      )}

      {/* Show More Button (fallback for non-scrolling users) */}
      {!isLoadingMore && displayedIdeasCount < sortedIdeas.length && (
        <div className="text-center py-6">
          <button
            onClick={() => setDisplayedIdeasCount(prev => Math.min(prev + 20, sortedIdeas.length))}
            className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded transition-colors"
          >
            Load More Ideas ({sortedIdeas.length - displayedIdeasCount} remaining)
          </button>
        </div>
      )}

      {/* Ideas Count Info */}
      {sortedIdeas.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          Showing {Math.min(displayedIdeasCount, sortedIdeas.length)} of {sortedIdeas.length} ideas
          {(searchTerm || selectedCategory) && ` (filtered from ${ideas.length} total)`}
        </div>
      )}

      {/* Empty State */}
      {sortedIdeas.length === 0 && (
        <div className="text-center py-12">
          {searchTerm ? (
            <div>
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No ideas found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search terms or browse all ideas</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No ideas yet</h3>
              <p className="text-gray-500 mb-4">Be the first to share your brilliant idea!</p>
              {showTrendingRepos ? null : (
                <button 
                  onClick={() => setShowTrendingRepos(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                >
                  Get Inspired by Trending Repos
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white'
            : notification.type === 'error'
              ? 'bg-red-600 text-white' 
              : 'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="text-white hover:text-gray-200 ml-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
