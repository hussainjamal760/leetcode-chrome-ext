const axios = require('axios');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/helpers');

class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.username = process.env.GITHUB_USERNAME;
    this.repo = process.env.GITHUB_REPO || 'leetcode-solutions';
    this.baseUrl = 'https://api.github.com';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Push solution to GitHub
   */
  async pushSolution({ slug, code, language, readme, problemTitle }) {
    try {
      // Ensure repository exists
      await this.ensureRepoExists();

      // Get file extension
      const ext = this.getFileExtension(language);
      
      // Create/update solution file
      const solutionPath = `leetcode/${slug}/solution.${ext}`;
      await this.createOrUpdateFile({
        path: solutionPath,
        content: code,
        message: `Add solution for ${problemTitle}`
      });

      // Create/update README file
      const readmePath = `leetcode/${slug}/README.md`;
      await this.createOrUpdateFile({
        path: readmePath,
        content: readme,
        message: `Add README for ${problemTitle}`
      });

      // Return GitHub URL
      const url = `https://github.com/${this.username}/${this.repo}/tree/main/leetcode/${slug}`;
      return url;

    } catch (error) {
      logger.error(`GitHub service error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ensure repository exists, create if not
   */
  async ensureRepoExists() {
    try {
      await retryWithBackoff(async () => {
        await this.client.get(`/repos/${this.username}/${this.repo}`);
      });
      logger.info(`Repository ${this.repo} exists`);
    } catch (error) {
      if (error.response?.status === 404) {
        logger.info(`Creating repository ${this.repo}`);
        await this.createRepo();
      } else {
        throw error;
      }
    }
  }

  /**
   * Create a new repository
   */
  async createRepo() {
    try {
      await retryWithBackoff(async () => {
        await this.client.post('/user/repos', {
          name: this.repo,
          description: 'LeetCode solutions synced automatically',
          private: false,
          auto_init: true
        });
      });
      logger.info(`Repository ${this.repo} created successfully`);
    } catch (error) {
      logger.error(`Failed to create repository: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update a file in the repository
   */
  async createOrUpdateFile({ path, content, message }) {
    try {
      // Check if file exists
      let sha = null;
      try {
        const response = await retryWithBackoff(async () => {
          return await this.client.get(`/repos/${this.username}/${this.repo}/contents/${path}`);
        });
        sha = response.data.sha;
      } catch (error) {
        // File doesn't exist, will create new
      }

      // Create or update file
      const payload = {
        message,
        content: Buffer.from(content).toString('base64'),
        branch: 'main'
      };

      if (sha) {
        payload.sha = sha;
      }

      await retryWithBackoff(async () => {
        await this.client.put(`/repos/${this.username}/${this.repo}/contents/${path}`, payload);
      });

      logger.info(`File ${path} ${sha ? 'updated' : 'created'} successfully`);
    } catch (error) {
      logger.error(`Failed to create/update file ${path}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file extension based on language
   */
  getFileExtension(language) {
    const extensions = {
      'javascript': 'js',
      'python': 'py',
      'python3': 'py',
      'java': 'java',
      'c++': 'cpp',
      'c': 'c',
      'c#': 'cs',
      'ruby': 'rb',
      'swift': 'swift',
      'go': 'go',
      'kotlin': 'kt',
      'rust': 'rs',
      'typescript': 'ts'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }
}

module.exports = new GitHubService();
