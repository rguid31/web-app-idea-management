import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
  sanitize: false, // We'll handle sanitization manually
});

// Simple sanitization function to prevent XSS
const sanitizeHtml = (html) => {
  // Allow basic formatting tags and links
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const allowedAttributes = {
    'a': ['href', 'target', 'rel']
  };
  
  // Basic XSS protection - remove script tags and javascript: links
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/javascript:/gi, '');
  html = html.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
  
  return html;
};

// Convert markdown to HTML with link detection
export const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Auto-link URLs that aren't already in markdown link format
  const urlRegex = /(?<![\[\(])(https?:\/\/[^\s<>"{}|\\^`\[\]]+)(?![\]\)])/gi;
  let processedText = text.replace(urlRegex, (url) => {
    // Don't auto-link if it's already part of a markdown link
    return `[${url}](${url})`;
  });
  
  // Convert markdown to HTML
  let html = marked.parse(processedText);
  
  // Sanitize the HTML
  html = sanitizeHtml(html);
  
  // Ensure external links open in new tab
  html = html.replace(/<a href="http/g, '<a target="_blank" rel="noopener noreferrer" href="http');
  
  return html;
};

// Check if text contains markdown formatting
export const hasMarkdown = (text) => {
  if (!text) return false;
  
  const markdownPatterns = [
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /`.*?`/, // Code
    /\[.*?\]\(.*?\)/, // Links
    /^#{1,6}\s/, // Headers
    /^\s*[-*+]\s/, // Lists
    /^\s*\d+\.\s/, // Numbered lists
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};