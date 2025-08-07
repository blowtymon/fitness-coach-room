import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Brain,
  Search,
  Database,
  Save,
  Key,
  CheckCircle,
} from "lucide-react";
import { searchService } from "@/services/search";
import { memoryService } from "@/services/memory";
import type { CoachSettings } from "./FitnessCoach";

interface SettingsPanelProps {
  settings: CoachSettings;
  onSettingsChange: (settings: CoachSettings) => void;
}

export const SettingsPanel = ({
  settings,
  onSettingsChange,
}: SettingsPanelProps) => {
  const { toast } = useToast();

  // API Key States
  const [openaiKey, setOpenaiKey] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [pineconeKey, setPineconeKey] = useState("");
  const [pineconeEnv, setPineconeEnv] = useState("");
  const [pineconeIndex, setPineconeIndex] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.7);

  // Connection status
  const [isOpenAIConnected, setIsOpenAIConnected] = useState(false);
  const [isSearchConnected, setIsSearchConnected] = useState(false);
  const [isPineconeConnected, setIsPineconeConnected] = useState(false);

  //   useEffect(() => {
  //     // Load saved API keys
  //     const savedSearch = localStorage.getItem("search_api_key");
  //     const savedPinecone = localStorage.getItem("pinecone_api_key");
  //     const savedEnv = localStorage.getItem("pinecone_environment");
  //     const savedIndex = localStorage.getItem("pinecone_index");

  //     if (savedOpenAI) {
  //       setOpenaiKey("••••••••••••••••");
  //       setIsOpenAIConnected(true);
  //     }
  //     if (savedSearch) {
  //       setSearchKey("••••••••••••••••");
  //       setIsSearchConnected(true);
  //     }
  //     if (savedPinecone) {
  //       setPineconeKey("••••••••••••••••");
  //       setIsPineconeConnected(true);
  //     }
  //     if (savedEnv) setPineconeEnv(savedEnv);
  //     if (savedIndex) setPineconeIndex(savedIndex);
  //   }, []);

  const handleSave = async () => {
    try {
      const response = await memoryService.setSettings({
        openai_key: openaiKey,
        pinecone_key: pineconeKey,
        pinecone_env: pineconeEnv,
        pinecone_index: pineconeIndex,
        openai_model: model,
        temperature: temperature,
      });

      if (response.success)
        toast({
          title: "Settings saved!",
          description: "Your AI coach configuration has been updated.",
        });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error saving settings",
        description: "Please check your API keys and try again.",
        variant: "destructive",
      });
    }
  };

  const updateSetting = <K extends keyof CoachSettings>(
    key: K,
    value: CoachSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* AI Model Settings */}
      <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">AI Model Configuration</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure how your AI coach thinks and responds
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={model}
              onValueChange={(value) => setModel(value)}
            >
              <SelectTrigger className="bg-input border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                <SelectItem value="gpt-4o-mini">
                  GPT-4o Mini (Faster)
                </SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              GPT-4o provides the best reasoning for complex fitness analysis
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature: {temperature.toFixed(1)}</Label>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise & Consistent</span>
              <span>Creative & Varied</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Research Settings */}
      {/* <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Research & Web Search</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Enable live research for science-backed recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Web Search</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to search for latest research and studies
              </p>
            </div>
            <Switch
              checked={settings.webSearchEnabled}
              onCheckedChange={(checked) => updateSetting('webSearchEnabled', checked)}
            />
          </div>

          {settings.webSearchEnabled && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="search-api">Search API Key (Tavily)</Label>
                  {isSearchConnected && (
                    <Badge variant="outline" className="text-xs text-success border-success/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
                <Input
                  id="search-api"
                  type="password"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="tvly-••••••••••••••••"
                  className="bg-input border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Get your free API key at <a href="https://tavily.com" target="_blank" className="text-accent hover:underline">tavily.com</a>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Memory & Storage Settings */}
      <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Memory & Storage</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure how your training history is stored and recalled
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* <div className="space-y-3">
            <Label>Memory Depth: 50 logs</Label>
            <Slider
              value={[50]}
              onValueChange={() => {}}
              disabled
              max={200}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recent only</span>
              <span>Full history</span>
            </div>
          </div>

          <Separator /> */}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Vector Database (Pinecone)</Label>
              {isPineconeConnected && (
                <Badge
                  variant="outline"
                  className="text-xs text-success border-success/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Pinecone API Key"
                type="password"
                value={pineconeKey}
                onChange={(e) => setPineconeKey(e.target.value)}
                className="bg-input border-border/50"
              />
              <Input
                placeholder="Pinecone Environment (e.g., us-east-1-aws)"
                value={pineconeEnv}
                onChange={(e) => setPineconeEnv(e.target.value)}
                className="bg-input border-border/50"
              />
              <Input
                placeholder="Index Name (e.g., fitness-logs)"
                value={pineconeIndex}
                onChange={(e) => setPineconeIndex(e.target.value)}
                className="bg-input border-border/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Get started at{" "}
              <a
                href="https://pinecone.io"
                target="_blank"
                className="text-accent hover:underline"
              >
                pinecone.io
              </a>{" "}
              • Free tier available
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI API Settings */}
      <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">API Configuration</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your OpenAI API for AI coaching functionality
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              {isOpenAIConnected && (
                <Badge
                  variant="outline"
                  className="text-xs text-success border-success/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <Input
              id="openai-key"
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-••••••••••••••••"
              className="bg-input border-border/50"
            />
            <p className="text-xs text-muted-foreground">
              Get your API key at{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                className="text-accent hover:underline"
              >
                platform.openai.com
              </a>{" "}
              • Your key is stored locally
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-accent to-accent-glow hover:from-accent-glow hover:to-accent"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Configuration
      </Button>
    </div>
  );
};
