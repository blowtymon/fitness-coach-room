import { apiService } from "./api";

export interface SaveSettingsRequest {
  openai_key: string;
  pinecone_key: string;
  pinecone_env: string;
  pinecone_index: string;
  openai_model?: string;
  temperature?: number;
}

export interface SaveSettingsResponse {
  status: string;
}

export class MemoryService {
  async setSettings(data: SaveSettingsRequest) {
    return apiService.post<SaveSettingsResponse>("/settings/setSettings", {
      ...data,
      openai_model: data.openai_model || "gpt-4o",
      temperature: data.temperature ?? 0.7,
    });
  }
}

export const memoryService = new MemoryService();
