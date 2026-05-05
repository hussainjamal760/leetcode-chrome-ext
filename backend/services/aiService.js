const axios = require('axios');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/helpers');
const { encryptApiKey, decryptApiKey } = require('../utils/encryption');

class AIService {
  constructor() {
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Generate AI summary using user's API key
   * IMPORTANT: User API key is used in memory only, never stored
   */
  async generateSummary({ problemTitle, code, difficulty, language, userApiKey }) {
    try {
      if (!userApiKey) {
        throw new Error('User API key is required');
      }

      // Create axios instance with user's API key
      const client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const prompt = this.buildPrompt({ problemTitle, code, difficulty, language });

      const response = await retryWithBackoff(async () => {
        return await client.post('/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that analyzes LeetCode solutions and provides concise summaries.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
      }, 2); // Only 2 retries for AI service

      const content = response.data.choices[0].message.content;
      const parsed = this.parseAIResponse(content);

      logger.info('AI summary generated successfully');
      return parsed;

    } catch (error) {
      logger.error(`AI service error: ${error.message}`);
      
      // Return fallback response instead of throwing
      return {
        summary: 'AI summary generation failed. Please check your API key.',
        approach: 'N/A',
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      };
    }
  }

  /**
   * Build prompt for AI
   */
  buildPrompt({ problemTitle, code, difficulty, language }) {
    return `Analyze this LeetCode solution and provide a structured response:

Problem: ${problemTitle}
Difficulty: ${difficulty}
Language: ${language}

Code:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. SUMMARY: A brief 2-3 sentence summary of the solution
2. APPROACH: Explain the approach used in 2-3 sentences
3. TIME_COMPLEXITY: Time complexity in Big O notation
4. SPACE_COMPLEXITY: Space complexity in Big O notation

Format your response exactly as:
SUMMARY: [your summary]
APPROACH: [your approach]
TIME_COMPLEXITY: [complexity]
SPACE_COMPLEXITY: [complexity]`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(content) {
    try {
      const lines = content.split('\n');
      const result = {
        summary: '',
        approach: '',
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      };

      for (const line of lines) {
        if (line.startsWith('SUMMARY:')) {
          result.summary = line.replace('SUMMARY:', '').trim();
        } else if (line.startsWith('APPROACH:')) {
          result.approach = line.replace('APPROACH:', '').trim();
        } else if (line.startsWith('TIME_COMPLEXITY:')) {
          result.timeComplexity = line.replace('TIME_COMPLEXITY:', '').trim();
        } else if (line.startsWith('SPACE_COMPLEXITY:')) {
          result.spaceComplexity = line.replace('SPACE_COMPLEXITY:', '').trim();
        }
      }

      // Fallback if parsing fails
      if (!result.summary) {
        result.summary = content.substring(0, 200);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
      return {
        summary: content.substring(0, 200),
        approach: 'See code for details',
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      };
    }
  }
}

module.exports = new AIService();
