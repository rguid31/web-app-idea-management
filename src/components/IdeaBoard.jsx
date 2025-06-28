import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import TrendingRepos from './TrendingRepos';

const IdeaBoard = ({ user }) => {
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState('');
  const [showTrendingRepos, setShowTrendingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);

  // Read ideas from Firestore
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'ideas'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ideasData = [];
        querySnapshot.forEach((doc) => {
          ideasData.push({ ...doc.data(), id: doc.id });
        });
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
      createdAt: new Date(),
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

  // Delete an idea
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'ideas', id));
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Welcome, {user.email}</h2>
        <button
          onClick={() => setShowTrendingRepos(!showTrendingRepos)}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
        >
          {showTrendingRepos ? 'Hide' : 'Show'} Trending Repos
        </button>
      </div>

      {/* Trending Repositories Section */}
      {showTrendingRepos && (
        <TrendingRepos onRepoSelect={handleRepoSelect} />
      )}

      {/* Selected Repository Info */}
      {selectedRepo && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-blue-200 mb-2">
                💡 Inspired by: {selectedRepo.fullName}
              </h4>
              {selectedRepo.description && (
                <p className="text-blue-300 text-sm mb-2">{selectedRepo.description}</p>
              )}
              <div className="flex gap-4 text-xs text-blue-400">
                <span>⭐ {selectedRepo.stars}</span>
                <span>🍴 {selectedRepo.forks}</span>
                {selectedRepo.language && (
                  <span>🔧 {selectedRepo.language}</span>
                )}
              </div>
            </div>
            <button
              onClick={clearSelectedRepo}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Idea Creation Form */}
      <form onSubmit={handleSubmit} className="mb-6 flex">
        <input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder={selectedRepo ? "Modify your inspired idea..." : "What's your next big idea?"}
          className="flex-grow p-2 bg-slate-700 rounded-l border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r">
          Add Idea
        </button>
      </form>

      {/* Ideas List */}
      <div>
        {ideas.map((idea) => (
          <div key={idea.id} className="bg-slate-800 p-4 rounded-lg mb-3 shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="mb-2">{idea.text}</p>
                {idea.inspiredBy && (
                  <div className="bg-slate-700 rounded p-2 text-sm">
                    <p className="text-blue-400 mb-1">
                      💡 Inspired by: <a 
                        href={idea.inspiredBy.repoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 underline"
                      >
                        {idea.inspiredBy.repoName}
                      </a>
                    </p>
                    {idea.inspiredBy.repoDescription && (
                      <p className="text-gray-400 text-xs">
                        {idea.inspiredBy.repoDescription}
                      </p>
                    )}
                    {idea.inspiredBy.language && (
                      <span className="inline-block bg-blue-600 text-blue-200 text-xs px-2 py-1 rounded mt-1">
                        {idea.inspiredBy.language}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleDelete(idea.id)} 
                className="text-red-500 hover:text-red-400 font-bold ml-4"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdeaBoard;
