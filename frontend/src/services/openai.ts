import type { Log, ChatMessage } from "@/components/FitnessCoach";

interface BackendChatResponse {
  type: string;
  message: string;
  log_id?: string;
}

export class OpenAIService {
  private baseUrl = "http://localhost:5000/chatgpt/chat";

  async streamResponse(
    messageContent: string,
    chatId: string
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("fitness_token")}`,
      },
      body: JSON.stringify({
        message: messageContent,
        chat_id: chatId,
      }),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      throw new Error(`Streaming error: ${error}`);
    }

    return response.body;
  }
}

export const openAIService = new OpenAIService();
