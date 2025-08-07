import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, Bot, User, Loader2, Wifi, WifiOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { openAIService } from "@/services/openai";
import { searchService } from "@/services/search";
import { ChatMessage, Log, CoachSettings } from "./FitnessCoach";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, isUser: boolean) => void;
  logs: Log[];
  chatID: string;
  settings: CoachSettings;
  addAssistantMessage: () => string;
  appendToAssistantMessage: (id: string, chunk: string) => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  logs,
  chatID,
  settings,
  addAssistantMessage,
  appendToAssistantMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight + 30;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    onSendMessage(userMessage, true);

    const assistantMsgId = addAssistantMessage();

    try {
      const stream = await openAIService.streamResponse(userMessage, chatID);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        appendToAssistantMessage(assistantMsgId, chunk);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Streaming error:", error);
      appendToAssistantMessage(
        assistantMsgId,
        "\n\n❌ Error generating response. Please try again."
      );
    } finally {
    }
  };

  return (
    <Card
      className="flex flex-col"
      style={{ height: "calc(100vh - 200px)" }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Fitness Coach</CardTitle>
          <div className="flex items-center space-x-2">
            {settings.apiKey ? (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs"
              >
                <WifiOff className="w-3 h-3 mr-1" />
                Offline Mode
              </Badge>
            )}
          </div>
        </div>
        <Separator />
      </CardHeader>

      <CardContent className="flex flex-col flex-1 overflow-hidden">
        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto px-6"
        >
          <div className="space-y-4 py-4">
            {messages?.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Welcome to Your AI Fitness Coach!
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  I'm here to help you achieve your fitness goals. Ask me about
                  your workouts, nutrition, recovery, or any fitness-related
                  questions.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                // Skip empty assistant message during thinking
                if (!message.isUser && message.content.trim() === "")
                  return null;

                return (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-3 ${
                      message.isUser ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <Avatar
                      className={`h-8 w-8 hidden md:block ${
                        message.isUser
                          ? "bg-gradient-to-br from-primary to-primary-glow"
                          : loading
                          ? "bg-gradient-to-br from-orange-400 to-orange-500 animate-pulse" // glowing bot
                          : "bg-gradient-to-br from-accent to-accent-glow"
                      }`}
                    >
                      <AvatarFallback className="bg-transparent text-white">
                        {message.isUser ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message content */}
                    <div
                      className={`flex-1 max-w-full md:max-w-[80%] ${
                        message.isUser ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 break-words 
                                        ${
                                          message.isUser
                                            ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                                            : "bg-accent/20 text-white"
                                        } 
                                        inline-block max-w-full md:max-w-[80%]
                                    `}
                      >
                        {message.isUser ? (
                          <p className="text-sm">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>

                      <p
                        className={`text-xs text-muted-foreground mt-1 ${
                          message.isUser ? "text-right" : ""
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-accent to-accent-glow">
                  <AvatarFallback className="bg-transparent text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 max-w-full md:max-w-[80%]">
                  <div className="bg-accent/20 text-white rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="md:p-6 pt-4 border-t">
          <form
            onSubmit={handleSubmit}
            className="space-y-2"
          >
            <div className="flex space-x-2 items-center">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about your fitness journey..."
                className="resize-none"
                rows={2}
              />
              <Button
                type="submit"
                size="sm"
                className="px-3"
                disabled={loading || !input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
