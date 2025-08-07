// Web search service for research validation
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface SearchQuery {
  query: string;
  timeframe?: 'day' | 'week' | 'month' | 'year';
  domain?: string;
}

export class SearchService {
  private apiKey: string | null = null;
  private provider: 'tavily' | 'serpapi' | null = null;

  initialize(apiKey: string, provider: 'tavily' | 'serpapi' = 'tavily') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async searchFitnessResearch(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.apiKey || !this.provider) {
      console.warn('Search service not initialized');
      return this.getFallbackResults(query.query);
    }

    try {
      switch (this.provider) {
        case 'tavily':
          return await this.searchWithTavily(query);
        case 'serpapi':
          return await this.searchWithSerpAPI(query);
        default:
          throw new Error('Unsupported search provider');
      }
    } catch (error) {
      console.error('Search API error:', error);
      return this.getFallbackResults(query.query);
    }
  }

  private async searchWithTavily(query: SearchQuery): Promise<SearchResult[]> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query: this.enhanceQuery(query.query),
        search_depth: 'advanced',
        include_domains: ['pubmed.ncbi.nlm.nih.gov', 'scholar.google.com', 'examine.com'],
        max_results: 5
      })
    });

    const data = await response.json();
    
    return data.results?.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      publishedDate: result.published_date
    })) || [];
  }

  private async searchWithSerpAPI(query: SearchQuery): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      engine: 'google_scholar',
      q: this.enhanceQuery(query.query),
      api_key: this.apiKey!,
      num: '5'
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    const data = await response.json();
    
    return data.organic_results?.map((result: any) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      publishedDate: result.publication_info?.summary
    })) || [];
  }

  private enhanceQuery(query: string): string {
    // Add fitness/exercise science context to improve results
    const fitnessKeywords = [
      'exercise physiology',
      'sports science',
      'resistance training',
      'peer reviewed',
      'study',
      'research'
    ];

    // Check if query already contains scientific terms
    const hasScientificTerms = fitnessKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    if (!hasScientificTerms) {
      return `${query} exercise science research study`;
    }

    return query;
  }

  private getFallbackResults(query: string): SearchResult[] {
    // Fallback results when API is not available
    return [
      {
        title: "Exercise Research Database - Search not available",
        url: "https://pubmed.ncbi.nlm.nih.gov/",
        snippet: "Real-time research search is currently unavailable. Please check your API configuration in settings. For now, recommendations are based on established exercise science principles.",
        publishedDate: "2024"
      }
    ];
  }

  async summarizeResearch(results: SearchResult[]): Promise<string> {
    if (results.length === 0) {
      return "No recent research found for this query.";
    }

    const summary = results
      .slice(0, 3) // Take top 3 results
      .map((result, index) => 
        `**${index + 1}. ${result.title}**\n${result.snippet}\n*Source: ${new URL(result.url).hostname}*`
      )
      .join('\n\n');

    return `## Latest Research Findings:\n\n${summary}\n\n*Note: Always consult with healthcare professionals before making significant changes to your training or nutrition.*`;
  }
}

export const searchService = new SearchService();