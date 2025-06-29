import { renderMarkdown, hasMarkdown } from '../utils/markdown';
import useSwipe from '../hooks/useSwipe';

const SwipeableIdeaCard = ({ 
  idea, 
  index, 
  user, 
  handleVote, 
  votingStates, 
  setSelectedCategory, 
  selectedCategory 
}) => {
  // Handle compatibility with old voting structure
  const currentVotedBy = idea.votedBy || {};
  const hasUpvoted = currentVotedBy.upvotes?.includes(user.uid) || 
                    (Array.isArray(currentVotedBy) && currentVotedBy.includes(user.uid));
  const hasDownvoted = currentVotedBy.downvotes?.includes(user.uid);
  const voteCount = idea.votes || 0;

  // Swipe handlers
  const handleSwipeRight = () => {
    if (!votingStates[idea.id]) {
      handleVote(idea.id, voteCount, idea.votedBy, 'upvote');
    }
  };

  const handleSwipeLeft = () => {
    if (!votingStates[idea.id]) {
      handleVote(idea.id, voteCount, idea.votedBy, 'downvote');
    }
  };

  const swipeProps = useSwipe(handleSwipeLeft, handleSwipeRight, 80);

  return (
    <div 
      {...swipeProps}
      className="bg-slate-800 p-3 sm:p-4 rounded-lg shadow relative transition-all duration-200 touch-pan-y"
    >
      {/* Swipe instruction hint for mobile */}
      <div className="absolute top-2 right-2 text-xs text-gray-500 sm:hidden opacity-60">
        👆 swipe
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-gray-400 font-mono flex-shrink-0 mt-1">
            #{index + 1}
          </span>
          <div className="flex-1 text-sm sm:text-base leading-relaxed">
            {hasMarkdown(idea.text) ? (
              <div 
                className="prose prose-slate prose-sm sm:prose-base max-w-none prose-invert prose-a:text-blue-400 prose-strong:text-white prose-em:text-gray-300 prose-code:text-blue-300 prose-code:bg-slate-700 prose-code:px-1 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(idea.text) }}
              />
            ) : (
              <p>{idea.text}</p>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {idea.tags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedCategory(selectedCategory === tag ? '' : tag)}
                className="inline-block bg-blue-600 hover:bg-blue-500 text-blue-100 text-xs px-2 py-1 rounded cursor-pointer transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        
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
        
        {/* Vote Button and Count - Enhanced for mobile */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.preventDefault(); handleVote(idea.id, voteCount, idea.votedBy, 'upvote'); }}
            disabled={votingStates[idea.id]}
            className={`flex items-center gap-1 px-4 py-3 sm:py-2 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] min-w-[60px] justify-center ${
              votingStates[idea.id]
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : hasUpvoted
                  ? 'bg-green-500 text-green-900 hover:bg-green-400 active:scale-95 active:bg-green-600'
                  : 'bg-slate-600 text-gray-300 hover:bg-slate-500 active:scale-95 active:bg-slate-400'
            }`}
          >
            {votingStates[idea.id] ? '🔄' : (hasUpvoted ? '👍' : '👍')} 
          </button>
          <span className={`text-sm font-medium transition-colors ${
            voteCount > 0 ? 'text-green-400' : voteCount < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {voteCount > 0 ? `+${voteCount}` : voteCount}
          </span>
          <button
            onClick={(e) => { e.preventDefault(); handleVote(idea.id, voteCount, idea.votedBy, 'downvote'); }}
            disabled={votingStates[idea.id]}
            className={`flex items-center gap-1 px-4 py-3 sm:py-2 rounded-full text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px] min-w-[60px] justify-center ${
              votingStates[idea.id]
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : hasDownvoted
                  ? 'bg-red-500 text-red-900 hover:bg-red-400 active:scale-95 active:bg-red-600'
                  : 'bg-slate-600 text-gray-300 hover:bg-slate-500 active:scale-95 active:bg-slate-400'
            }`}
          >
            {votingStates[idea.id] ? '🔄' : (hasDownvoted ? '👎' : '👎')}
          </button>
          {Math.abs(voteCount) > 0 && (
            <span className="text-xs text-gray-400">
              {Math.abs(voteCount) === 1 ? '1 vote' : `${Math.abs(voteCount)} votes`}
            </span>
          )}
        </div>

        {/* Repository inspiration info */}
        {idea.inspiredBy && (
          <div className="bg-slate-700 rounded p-3 text-sm">
            <p className="text-blue-400 mb-2">
              💡 Inspired by:{' '}
              <a 
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
};

export default SwipeableIdeaCard;