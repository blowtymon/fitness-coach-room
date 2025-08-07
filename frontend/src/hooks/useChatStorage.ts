import { useState, useEffect } from "react";
import { Chat } from "@/components/chat/ChatManager";
import { chatApi } from "@/services/chatApi";

export function useChatStorage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await chatApi.getChats();
      if (response.success && response.data) {
        setChats(response.data);
        setCurrentChatId(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
      // Fallback to localStorage
      const savedChats = localStorage.getItem("fitness_chats");
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
        }));
        setChats(parsedChats);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save chats to localStorage (backup)
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("fitness_chats", JSON.stringify(chats));
    }
  }, [chats, loading]);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem("fitness_current_chat_id", currentChatId);
    }
  }, [currentChatId]);

  const createNewChat = async (folderId?: string) => {
    try {
      const response = await chatApi.createChat({
        title: `Chat ${chats.length + 1}`,
        folder_id: folderId,
      });

      if (response.success && response.data) {
        const newChat = response.data;
        setChats([newChat, ...chats]);
        setCurrentChatId(newChat.id);
        return newChat.id;
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }

    // Fallback to local creation
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat ${chats.length + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    try {
      if (updates.title) {
        await chatApi.updateChat(chatId, { title: updates.title });
      }
    } catch (error) {
      console.error("Failed to update chat:", error);
    }

    setChats(
      chats.map((chat) =>
        chat.id === chatId
          ? { ...chat, ...updates, updatedAt: new Date() }
          : chat
      )
    );
  };

  const deleteChat = async (chatId: string) => {
    try {
      await chatApi.deleteChat(chatId);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }

    // Update local state regardless
    const filteredChats = chats.filter((chat) => chat.id !== chatId);
    setChats(filteredChats);

    if (currentChatId === chatId) {
      if (filteredChats.length > 0) {
        setCurrentChatId(filteredChats[0].id);
      }
      //   else {
      //     createNewChat();
      //   }
    }
  };

  const getCurrentChat = () => {
    return chats.find((chat) => chat.id === currentChatId);
  };

  const addMessageToCurrentChat = (message: any, isUser: boolean) => {
    if (currentChatId) {
      const currentChat = getCurrentChat();
      const user = isUser ? "user" : "assistant";
      if (currentChat) {
        chatApi.addMessage(currentChatId, message, user);
      }
    }
  };

  return {
    chats,
    currentChatId,
    loading,
    setCurrentChatId,
    createNewChat,
    updateChat,
    deleteChat,
    getCurrentChat,
    addMessageToCurrentChat,
    refreshChats: loadChats,
  };
}
