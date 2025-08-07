import { apiService } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GPTChatRequest {
  message: string;
  chat_history?: ChatMessage[];
}

export interface GPTChatResponse {
  response: string;
  log_saved?: boolean;
  log_id?: string;
}

class GPTApiService {
  async chat(data: GPTChatRequest) {
    return apiService.post<GPTChatResponse>('/chatgpt/chat', data);
  }
}

export const gptApi = new GPTApiService();