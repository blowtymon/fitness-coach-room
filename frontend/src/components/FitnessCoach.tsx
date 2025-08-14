import { useState, useEffect } from "react";
import { ChatInterface } from "./ChatInterface";
import { LogEntry } from "./LogEntry";
import { LogHistory } from "./LogHistory";
import { SettingsPanel } from "./SettingsPanel";
import { AuthForm } from "./auth/AuthForm";
import { ChatManager } from "./chat/ChatManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Dumbbell,
  MessageSquare,
  History,
  LogOut,
} from "lucide-react";
import { memoryService } from "@/services/memory";
import { useAuth } from "@/hooks/useAuth";
import { useChatStorage } from "@/hooks/useChatStorage";
import { logsApi } from "@/services/logsApi";
import { chatApi } from "@/services/chatApi";
import { useNavigate } from "react-router-dom";

export interface NutritionData {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

export interface BodyMeasurements {
  weight?: number;
  bodyFat?: number;
  waist?: number;
  leftBicep?: number;
  rightBicep?: number;
}

export interface RecoveryData {
  hrv?: number;
  restingHR?: number;
  doms?: number;
}

export interface StructuredData {
  nutrition?: NutritionData;
  bodyMeasurements?: BodyMeasurements;
  recovery?: RecoveryData;
}

export interface Log {
  id: string;
  timestamp: Date;
  type: "quick" | "nutrition" | "body" | "recovery" | "files";
  content?: string;
  title?: string;
  note?: string;
  description?: string;
  structured?: StructuredData;
  attachments?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    content: string;
  }[];
}

export interface StructuredLogInput {
  type: Log["type"];
  structured?: StructuredData;
  attachments?: Log["attachments"];
  description?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface CoachSettings {
  apiKey: string;
  model: string;
  temperature: number;
  webSearchEnabled: boolean;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const FitnessCoach = () => {
  const { user, loading, signOut, setUser } = useAuth();
  const {
    chats,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    updateChat,
    deleteChat,
    getCurrentChat,
    addMessageToCurrentChat,
    refreshChats,
  } = useChatStorage();

  const navigate = useNavigate();
  const [logs, setLogs] = useState<any>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<CoachSettings>({
    apiKey: "",
    model: "gpt-4.1-2025-04-14",
    temperature: 0.7,
    webSearchEnabled: false,
  });

  // Create an assistant message placeholder
  const addAssistantMessage = (): string => {
    const id = Date.now().toString() + "-ai";
    const newMsg: ChatMessage = {
      id,
      content: "",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    return id;
  };

  // Append content chunk to existing assistant message
  const appendToAssistantMessage = (id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + chunk } : msg
      )
    );
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (currentChatId) {
        try {
          const response = await chatApi.getMessagesByChatId(currentChatId);
          setMessages(response);
        } catch (err) {
          console.error("Failed to load chat messages:", err);
        }
      }
    };

    fetchMessages();
  }, [currentChatId]);

  useEffect(() => {
    const fetchlogs = async () => {
      const response = await logsApi.getLogs();
      setLogs(response);
    };
    fetchlogs();
  }, []);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/ping", {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("fitness_token") || ""
            }`,
          },
        });

        if (res.status === 401) {
          signOut();
          navigate("/signin");
        }
      } catch (err) {
        console.error("Ping error:", err);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [user, signOut, navigate]);

  const handleSendMessage = (content: string, isUser: boolean) => {
    addMessageToCurrentChat(content, isUser);

    const tmp: ChatMessage = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, tmp]);
  };

  const handleNewLog = async (log: Omit<Log, "id" | "timestamp">) => {
    const newLog: Log = {
      ...log,
      id: generateUUID(),
      timestamp: new Date(),
    };

    await logsApi.saveLog(newLog);
  };

  const generateLogResponse = (log: Log): string => {
    if (log.structured) {
      const doms = log.structured.recovery?.doms;
      const hrv = log.structured.recovery?.hrv;
      const weight = log.structured.bodyMeasurements?.weight;
      const waist = log.structured.bodyMeasurements?.waist;
      const bodyFat = log.structured.bodyMeasurements?.bodyFat;

      const calories = log.structured.nutrition?.calories;
      const protein = log.structured.nutrition?.protein;
      const carbs = log.structured.nutrition?.carbs;
      const fat = log.structured.nutrition?.fat;

      let response = "📊 **Log Analysis**\n\n";

      // Recovery
      if (doms !== undefined) {
        if (doms <= 2)
          response += "✅ Low DOMS - good recovery, ready for intensity\n";
        else if (doms <= 4)
          response += "⚠️ Moderate DOMS - consider lighter training\n";
        else response += "🔴 High DOMS - prioritize recovery today\n";
      }

      if (hrv !== undefined)
        response += `🫀 HRV: \`${hrv}\` - ${
          hrv >= 60 ? "Good recovery" : "Monitor your recovery"
        }\n`;

      // Body Measurements
      if (weight !== undefined)
        response += `⚖️ Weight: \`${weight}kg\` logged\n`;

      if (waist !== undefined)
        response += `📏 Waist: \`${waist}cm\` recorded\n`;

      if (bodyFat !== undefined)
        response += `📊 Body Fat: \`${bodyFat}%\` tracked\n`;

      // Nutrition
      if (calories !== undefined)
        response += `🔥 Calories: \`${calories}\` kcal\n`;
      if (protein !== undefined) response += `💪 Protein: \`${protein}g\`\n`;
      if (carbs !== undefined) response += `🍞 Carbs: \`${carbs}g\`\n`;
      if (fat !== undefined) response += `🥑 Fat: \`${fat}g\`\n`;

      response += "\n💡 Keep tracking consistently for better insights!";
      return response;
    }

    return "📝 Log recorded! I'll analyze this with your historical data to provide better coaching.";
  };

  // Show auth form if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="flex flex-col md:flex-row pt-[60px] md:pt-0 min-h-screen h-full">
      <ChatManager
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={async (folderId) => {
          const chatId = await createNewChat(folderId);
          await refreshChats();
          return chatId;
        }}
        chats={chats}
        onUpdateChat={updateChat}
        onDeleteChat={deleteChat}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold">Ori's fitness hub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* <Button
                variant="outline"
                size="sm"
              >
                Export Data
              </Button> */}
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 md:mr-2" />
                <p className="hidden md:block">Sign Out</p>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 container mx-auto px-6 py-6">
          <Tabs
            defaultValue="chat"
            className="h-full flex flex-col space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="chat"
                className="flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger
                value="log"
                className="flex items-center space-x-2"
              >
                <Dumbbell className="w-4 h-4" />
                <span>Log Entry</span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="chat"
              className="flex-1"
            >
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                logs={logs}
                chatID={currentChatId}
                settings={settings}
                addAssistantMessage={addAssistantMessage}
                appendToAssistantMessage={appendToAssistantMessage}
              />
            </TabsContent>

            <TabsContent
              value="log"
              className="flex-1"
            >
              <LogEntry onSubmit={handleNewLog} />
            </TabsContent>

            <TabsContent
              value="history"
              className="flex-1"
            >
              <LogHistory logs={logs} />
            </TabsContent>

            <TabsContent
              value="settings"
              className="flex-1"
            >
              <SettingsPanel
                settings={settings}
                onSettingsChange={setSettings}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
