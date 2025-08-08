// const BASE_URL = "http://localhost:5000/api/chatgpt/chat";
const BASE_URL = "http://18.234.185.87:5000/api/chatgpt/chat";

export class OpenAIService {
  async streamResponse(
    messageContent: string,
    chatId: string
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(BASE_URL, {
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
