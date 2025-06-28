import { useState, useEffect } from 'react';
import { githubApi } from '../services/githubApi';

const TrendingRepos = ({ onRepoSelect }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [searchQuery, setSearchQuery] = useState('');

  const popularLanguages = githubApi.getPopularLanguages();

  // Fetch trending repos when component mounts or language changes
  useEffect(() => {
    fetchTrendingRepos();
  }, [selectedLanguage]);

  const fetchTrendingRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const trendingRepos = await githubApi.getTrendingRepos(selectedLanguage);
      setRepos(trendingRepos);
    } catch (err) {
      setError('Failed to fetch trending repositories. Please try again.');
      console.error('Error fetching repos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchTrendingRepos();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const searchResults = await githubApi.searchRepos(searchQuery, selectedLanguage);
      setRepos(searchResults);
    } catch (err) {
      setError('Failed to search repositories. Please try again.');
      console.error('Error searching repos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repo) => {
    if (onRepoSelect) {
      onRepoSelect(repo);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6">
      <h3 className="text-xl font-bold mb-4 text-blue-400">
        🔥 Trending GitHub Repositories
      </h3>
      
      {/* Language Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Filter by Language:</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-white"
        >
          {popularLanguages.map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search repositories..."
          className="flex-1 p-2 bg-slate-700 rounded border border-slate-600 text-white"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchTrendingRepos();
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
        )}
      </form>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-400">Loading repositories...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Repositories List */}
      {!loading && !error && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="bg-slate-700 p-3 rounded border border-slate-600 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => handleRepoSelect(repo)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={repo.avatar}
                      alt={repo.owner}
                      className="w-5 h-5 rounded-full"
                    />
                    <h4 className="font-semibold text-blue-300">
                      {repo.fullName}
                    </h4>
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {repo.language}
                      </span>
                    )}
                    <span>⭐ {formatNumber(repo.stars)}</span>
                    <span>🍴 {formatNumber(repo.forks)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(repo.url, '_blank');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && repos.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No repositories found. Try adjusting your search or language filter.</p>
        </div>
      )}
    </div>
  );
};

export default TrendingRepos; 