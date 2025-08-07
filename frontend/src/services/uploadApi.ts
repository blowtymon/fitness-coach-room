import { apiService } from "./api";

export interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  logId?: string;
  error?: string;
}

class UploadApiService {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiService.postForm<{
      fileUrl: string;
      logId: string;
    }>("/upload/file", formData);

    if (response.success && response.data) {
      return {
        success: true,
        fileUrl: response.data.fileUrl,
        logId: response.data.logId,
      };
    }

    return {
      success: false,
      error: response.error || "File upload failed",
    };
  }
}

export const uploadApi = new UploadApiService();
