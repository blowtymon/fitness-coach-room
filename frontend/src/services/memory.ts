import { apiService } from "./api";

export interface SaveSettingsRequest {
  openai_key: string;
  pinecone_key: string;
  pinecone_env: string;
  pinecone_index: string;
  openai_model?: string;
  temperature?: number;
  prompt?: string;
}

export interface SaveSettingsResponse {
  status: string;
}

export interface GetSettingsResponse {
  openai_model: string;
  temperature: number;
  prompt: string;
  pinecone_env: string;
  pinecone_index: string;
  has_openai_key: boolean;
  has_pinecone_key: boolean;
  updated_at: string | null;
}

export class MemoryService {
  async setSettings(data: SaveSettingsRequest): Promise<SaveSettingsResponse> {
    const res = await apiService.post<SaveSettingsResponse>(
      "/settings/setSettings",
      {
        ...data,
        openai_model: data.openai_model || "gpt-4o",
        temperature: data.temperature ?? 0.7,
      }
    );

    if (!res.success) throw new Error(res.error || "Failed to save settings");
    return res.data as SaveSettingsResponse;
  }

  async getSettings(): Promise<GetSettingsResponse> {
    const res = await apiService.get<GetSettingsResponse>(
      "/settings/getSettings"
    );
    if (!res.success) throw new Error(res.error || "Failed to fetch settings");
    return res.data as GetSettingsResponse;
  }
}

export const memoryService = new MemoryService();
