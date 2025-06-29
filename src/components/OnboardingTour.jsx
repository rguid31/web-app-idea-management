import { useState, useEffect, useRef } from 'react';

const OnboardingTour = ({ isOpen, onClose, currentStep, onNextStep, onPrevStep, totalSteps }) => {
  const [highlightPosition, setHighlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef(null);

  const tourSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Idea Board! 🎉',
      content: 'Let\'s take a quick tour to get you started. This platform helps you share, discover, and collaborate on brilliant ideas.',
      target: null,
      position: 'center'
    },
    {
      id: 'create-idea',
      title: 'Share Your Ideas 💡',
      content: 'Start by typing your idea here. You can use markdown formatting like **bold** text, *italic* text, and [links](url). Your drafts are automatically saved!',
      target: 'textarea[placeholder*="idea"]',
      position: 'bottom'
    },
    {
      id: 'add-tags',
      title: 'Organize with Tags 🏷️',
      content: 'Add tags to categorize your ideas (e.g., web, mobile, ai). This helps others discover your ideas and keeps everything organized.',
      target: 'input[placeholder*="tags"]',
      position: 'bottom'
    },
    {
      id: 'trending-repos',
      title: 'Get Inspired 🔥',
      content: 'Stuck for ideas? Browse trending GitHub repositories to spark your creativity. Click here to explore what\'s popular in the dev community.',
      target: 'button:has-text("Trending")',
      position: 'bottom'
    },
    {
      id: 'search-filter',
      title: 'Find Ideas Easily 🔍',
      content: 'Use the search bar to find specific ideas, or filter by tags to browse categories. Try typing keywords or clicking on any tag.',
      target: 'input[placeholder*="Search"]',
      position: 'bottom'
    },
    {
      id: 'sorting',
      title: 'Sort Your Way 📊',
      content: 'Choose how to view ideas: Latest (newest first), Hot (trending), Top (most voted), or New. Each view gives you a different perspective.',
      target: '[class*="bg-slate-700"]:has(button:has-text("Latest"))',
      position: 'bottom'
    },
    {
      id: 'voting',
      title: 'Vote on Ideas 👍',
      content: 'Show appreciation for great ideas by voting! On mobile, you can also swipe right to upvote or left to downvote. Every vote helps surface the best ideas.',
      target: '.space-y-3 > div:first-child',
      position: 'left'
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Pro Tips ⌨️',
      content: 'Speed up your workflow with keyboard shortcuts: Ctrl+Enter to submit, Esc to clear, / to search, and 1-4 for quick sorting. Check the help section for more!',
      target: 'details:has(summary:has-text("Keyboard shortcuts"))',
      position: 'top'
    }
  ];

  const currentStepData = tourSteps[currentStep] || tourSteps[0];

  const updateHighlight = () => {
    if (!currentStepData.target) {
      setHighlightPosition({ top: 0, left: 0, width: 0, height: 0 });
      return;
    }

    // Special case for buttons with text content
    let element;
    if (currentStepData.target.includes(':has-text(')) {
      const match = currentStepData.target.match(/:has-text\("([^"]+)"\)/);
      if (match) {
        const text = match[1];
        const baseSelector = currentStepData.target.replace(/:has-text\("[^"]+"\)/, '');
        const elements = document.querySelectorAll(baseSelector);
        element = Array.from(elements).find(el => el.textContent.includes(text));
      }
    } else {
      element = document.querySelector(currentStepData.target);
    }

    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightPosition({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX - 8,
        width: rect.width + 16,
        height: rect.height + 16
      });

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateHighlight();
      const timeoutId = setTimeout(updateHighlight, 100); // Slight delay for DOM updates
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      onNextStep();
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay with hole for highlighted element */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black bg-opacity-75 transition-all duration-300"
        style={{
          clipPath: currentStepData.target 
            ? `polygon(0% 0%, 0% 100%, ${highlightPosition.left}px 100%, ${highlightPosition.left}px ${highlightPosition.top}px, ${highlightPosition.left + highlightPosition.width}px ${highlightPosition.top}px, ${highlightPosition.left + highlightPosition.width}px ${highlightPosition.top + highlightPosition.height}px, ${highlightPosition.left}px ${highlightPosition.top + highlightPosition.height}px, ${highlightPosition.left}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {/* Highlight border */}
      {currentStepData.target && (
        <div
          className="absolute border-2 border-blue-400 rounded-lg transition-all duration-300 animate-pulse"
          style={{
            top: highlightPosition.top,
            left: highlightPosition.left,
            width: highlightPosition.width,
            height: highlightPosition.height,
          }}
        />
      )}

      {/* Tour tooltip */}
      <div
        className={`absolute bg-white rounded-lg shadow-2xl p-6 max-w-sm pointer-events-auto transition-all duration-300 ${
          currentStepData.position === 'center' 
            ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' 
            : ''
        }`}
        style={{
          ...(currentStepData.position === 'bottom' && highlightPosition.height > 0 && {
            top: highlightPosition.top + highlightPosition.height + 16,
            left: Math.max(16, Math.min(window.innerWidth - 384, highlightPosition.left + highlightPosition.width / 2 - 192))
          }),
          ...(currentStepData.position === 'top' && highlightPosition.height > 0 && {
            top: highlightPosition.top - 200,
            left: Math.max(16, Math.min(window.innerWidth - 384, highlightPosition.left + highlightPosition.width / 2 - 192))
          }),
          ...(currentStepData.position === 'left' && highlightPosition.height > 0 && {
            top: highlightPosition.top + highlightPosition.height / 2 - 100,
            left: Math.max(16, highlightPosition.left - 400)
          })
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Skip tour
          </button>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {currentStepData.title}
        </h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {currentStepData.content}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;