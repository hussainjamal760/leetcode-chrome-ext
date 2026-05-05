const axios = require('axios');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/helpers');

class NotionService {
  constructor() {
    this.apiKey = process.env.NOTION_API_KEY;
    this.databaseId = process.env.NOTION_DATABASE_ID;
    this.baseUrl = 'https://api.notion.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new entry in Notion database
   */
  async createEntry({ problemTitle, difficulty, tags, githubUrl, aiSummary, language, problemUrl }) {
    try {
      const properties = {
        'Title': {
          title: [
            {
              text: {
                content: problemTitle
              }
            }
          ]
        },
        'Difficulty': {
          select: {
            name: difficulty
          }
        },
        'Language': {
          select: {
            name: language
          }
        },
        'Date': {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        }
      };

      // Add tags if provided
      if (tags && tags.length > 0) {
        properties['Tags'] = {
          multi_select: tags.map(tag => ({ name: tag }))
        };
      }

      // Add GitHub URL if available
      if (githubUrl) {
        properties['GitHub'] = {
          url: githubUrl
        };
      }

      // Add problem URL if available
      if (problemUrl) {
        properties['Problem Link'] = {
          url: problemUrl
        };
      }

      // Add AI summary if available
      if (aiSummary && aiSummary.summary) {
        properties['Summary'] = {
          rich_text: [
            {
              text: {
                content: aiSummary.summary.substring(0, 2000) // Notion limit
              }
            }
          ]
        };
      }

      // Add complexity if available
      if (aiSummary && aiSummary.timeComplexity) {
        properties['Time Complexity'] = {
          rich_text: [
            {
              text: {
                content: aiSummary.timeComplexity
              }
            }
          ]
        };
      }

      const response = await retryWithBackoff(async () => {
        return await this.client.post('/pages', {
          parent: {
            database_id: this.databaseId
          },
          properties
        });
      });

      logger.info(`Notion entry created: ${response.data.id}`);
      return response.data.url;

    } catch (error) {
      logger.error(`Notion service error: ${error.message}`);
      if (error.response) {
        logger.error(`Notion API response: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Validate Notion database structure
   */
  async validateDatabase() {
    try {
      const response = await this.client.get(`/databases/${this.databaseId}`);
      logger.info('Notion database validated successfully');
      return response.data;
    } catch (error) {
      logger.error(`Failed to validate Notion database: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new NotionService();
