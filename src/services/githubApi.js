// GitHub API service for fetching trending repositories
const GITHUB_API_BASE = 'https://api.github.com';

export const githubApi = {
  // Fetch trending repositories
  async getTrendingRepos(language = 'javascript', timeRange = 'weekly') {
    try {
      // GitHub doesn't have a direct trending API, so we'll use their search API
      // to get repositories sorted by stars
      const response = await fetch(
        `${GITHUB_API_BASE}/search/repositories?q=language:${language}&sort=stars&order=desc&per_page=10`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            // Note: For public repos, we don't need authentication for basic usage
            // But GitHub recommends adding a User-Agent header
            'User-Agent': 'IdeaBoard-App'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        owner: repo.owner.login,
        avatar: repo.owner.avatar_url,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at
      }));
    } catch (error) {
      console.error('Error fetching trending repos:', error);
      throw error;
    }
  },

  // Search repositories by keyword
  async searchRepos(query, language = null) {
    try {
      let searchQuery = query;
      if (language) {
        searchQuery += ` language:${language}`;
      }

      const response = await fetch(
        `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=10`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'IdeaBoard-App'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        owner: repo.owner.login,
        avatar: repo.owner.avatar_url
      }));
    } catch (error) {
      console.error('Error searching repos:', error);
      throw error;
    }
  },

  // Get popular languages for filtering
  getPopularLanguages() {
    return [
      'javascript',
      'python',
      'java',
      'typescript',
      'go',
      'rust',
      'c++',
      'c#',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'dart',
      'scala',
      'elixir'
    ];
  }
}; 