import { apiService } from "./api";
import { Chat } from "@/components/chat/ChatManager";

export interface Folder {
  id: string;
  name: string;
  chatIds: string[];
  createdAt: Date;
}

export interface CreateChatRequest {
  title?: string;
  folder_id?: string;
}

export interface CreateFolderRequest {
  name: string;
}

export interface UpdateChatRequest {
  title: string;
}

export interface UpdateFolderRequest {
  name: string;
}

class ChatApiService {
  // Chat endpoints
  async createChat(data: CreateChatRequest = {}) {
    const response = await apiService.post<Chat>("/chats/create", data);

    if (response.success && response.data) {
      // Convert date strings back to Date objects
      response.data.createdAt = new Date(response.data.createdAt);
      response.data.updatedAt = new Date(response.data.updatedAt);
    }

    return response;
  }

  async getChats(folderId?: string) {
    const endpoint = folderId ? `/chats/?folder_id=${folderId}` : "/chats/";
    const response = await apiService.get<Chat[]>(endpoint);

    if (response.success && response.data) {
      // Convert date strings back to Date objects
      response.data = response.data.map((chat) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
      }));
    }

    return response;
  }

  async getMessagesByChatId(chatId: string) {
    const response = await apiService.get(`/chats/messages?chat_id=${chatId}`);
    if (response.success && response.data) {
      return response.data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.role === "user",
        timestamp: new Date(msg.timestamp),
      }));
    }
    return [];
  }

  async updateChat(chatId: string, data: UpdateChatRequest) {
    const response = await apiService.put<Chat>(
      `/chats/update/${chatId}`,
      data
    );

    if (response.success && response.data) {
      response.data.createdAt = new Date(response.data.createdAt);
      response.data.updatedAt = new Date(response.data.updatedAt);
    }

    return response;
  }

  async addMessage(
    chatId: string,
    content: string,
    role: "user" | "assistant" = "user"
  ) {
    const response = await apiService.post(`/chats/addMessage`, {
      chat_id: chatId,
      content,
      role,
    });

    if (response.success && response.data) {
      response.data.timestamp = new Date(response.data.timestamp);
    }

    return response;
  }

  async deleteChat(chatId: string) {
    return apiService.delete(`/chats/delete/${chatId}`);
  }

  // Folder endpoints
  async createFolder(data: CreateFolderRequest) {
    const response = await apiService.post<Folder>("/folders/create", data);

    if (response.success && response.data) {
      response.data.createdAt = new Date(response.data.createdAt);
    }

    return response;
  }

  async getFolders() {
    const response = await apiService.get<Folder[]>("/folders/");

    if (response.success && response.data) {
      response.data = response.data.map((folder) => ({
        ...folder,
        createdAt: new Date(folder.createdAt),
      }));
    }

    return response;
  }

  async updateFolder(folderId: string, data: UpdateFolderRequest) {
    const response = await apiService.put<Folder>(
      `/folders/update/${folderId}`,
      data
    );

    if (response.success && response.data) {
      response.data.createdAt = new Date(response.data.createdAt);
    }

    return response;
  }

  async deleteFolder(folderId: string) {
    return apiService.delete(`/folders/delete/${folderId}`);
  }
}

export const chatApi = new ChatApiService();
