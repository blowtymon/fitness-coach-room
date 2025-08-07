import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "./FileUpload";

import type {
  Log,
  NutritionData,
  BodyMeasurements,
  RecoveryData,
  StructuredData,
  StructuredLogInput,
} from "./FitnessCoach";

interface LogEntryProps {
  onSubmit: (log: Log | StructuredLogInput) => void;
}

export const LogEntry = ({ onSubmit }: LogEntryProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quick");

  // Quick log state
  const [quickContent, setQuickContent] = useState("");
  //   const [logType, setLogType] = useState<Log["type"]>("quick");

  // Nutrition state
  const [nutrition, setNutrition] = useState<NutritionData>({});

  // Body measurements state
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements>(
    {}
  );

  // Recovery state
  const [recovery, setRecovery] = useState<RecoveryData>({});

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    // Validate file types and sizes
    const validFiles = selectedFiles.filter((file) => {
      const isValidType = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain",
      ].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }

      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleQuickLog = async () => {
    if (!quickContent.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your log",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      type: "quick",
      title,
      content: quickContent,
      note,
    });

    setQuickContent("");
    setFiles([]);
    toast({
      title: "Log submitted",
      description: "Your log has been recorded successfully",
    });
  };

  const handleStructuredSubmit = async (
    type: Log["type"],
    data: any,
    description: string
  ) => {
    const attachments = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        content: await fileToBase64(file),
      }))
    );

    onSubmit({
      type,
      structured: data,
      attachments: attachments.length > 0 ? attachments : undefined,
      description,
    });

    // Reset forms
    setNutrition({});
    setBodyMeasurements({});
    setRecovery({});
    setFiles([]);

    toast({
      title: "Log submitted",
      description: "Your structured log has been recorded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader>
          <CardTitle className="text-xl">Add Training Log</CardTitle>
          <p className="text-sm text-muted-foreground">
            Log your training data using structured forms or quick text entry
          </p>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="quick">Quick</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="recovery">Recovery</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            {/* Quick Log */}
            <TabsContent
              value="quick"
              className="space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logType">Title</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="w/o title"
                    value={title || ""}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="e.g., DOMS 3, 71.4kg, 6.5h sleep, sore triceps"
                    value={quickContent}
                    onChange={(e) => setQuickContent(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Natural language parsing enabled - mention DOMS, weight,
                    waist, sleep, etc.
                  </p>
                </div>
                <div>
                  <Label htmlFor="logType">Note</Label>
                  <Input
                    id="note"
                    type="text"
                    placeholder=""
                    value={note || ""}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleQuickLog}
                  className="w-full"
                >
                  Submit Quick Log
                </Button>
              </div>
            </TabsContent>

            {/* Nutrition */}
            <TabsContent
              value="nutrition"
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    placeholder="2500"
                    value={nutrition.calories || ""}
                    onChange={(e) =>
                      setNutrition((prev) => ({
                        ...prev,
                        calories: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    placeholder="300"
                    value={nutrition.carbs || ""}
                    onChange={(e) =>
                      setNutrition((prev) => ({
                        ...prev,
                        carbs: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    placeholder="150"
                    value={nutrition.protein || ""}
                    onChange={(e) =>
                      setNutrition((prev) => ({
                        ...prev,
                        protein: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    placeholder="80"
                    value={nutrition.fat || ""}
                    onChange={(e) =>
                      setNutrition((prev) => ({
                        ...prev,
                        fat: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  handleStructuredSubmit(
                    "nutrition",
                    { nutrition },
                    "Daily nutrition tracking"
                  )
                }
                className="w-full"
                // disabled={
                //   !nutrition.calories &&
                //   !nutrition.carbs &&
                //   !nutrition.protein &&
                //   !nutrition.fat
                // }
              >
                Submit Nutrition Log
              </Button>
            </TabsContent>

            {/* Body Measurements */}
            <TabsContent
              value="body"
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={bodyMeasurements.weight || ""}
                    onChange={(e) =>
                      setBodyMeasurements((prev) => ({
                        ...prev,
                        weight: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="bodyFat">Body Fat (%)</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                    value={bodyMeasurements.bodyFat || ""}
                    onChange={(e) =>
                      setBodyMeasurements((prev) => ({
                        ...prev,
                        bodyFat: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="waist">Waist (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="85.0"
                    value={bodyMeasurements.waist || ""}
                    onChange={(e) =>
                      setBodyMeasurements((prev) => ({
                        ...prev,
                        waist: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="leftBicep">Left Bicep (cm)</Label>
                  <Input
                    id="leftBicep"
                    type="number"
                    step="0.1"
                    placeholder="38.0"
                    value={bodyMeasurements.leftBicep || ""}
                    onChange={(e) =>
                      setBodyMeasurements((prev) => ({
                        ...prev,
                        leftBicep: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="rightBicep">Right Bicep (cm)</Label>
                  <Input
                    id="rightBicep"
                    type="number"
                    step="0.1"
                    placeholder="38.5"
                    value={bodyMeasurements.rightBicep || ""}
                    onChange={(e) =>
                      setBodyMeasurements((prev) => ({
                        ...prev,
                        rightBicep: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  handleStructuredSubmit(
                    "body",
                    { bodyMeasurements },
                    "Body measurements tracking"
                  )
                }
                className="w-full"
                disabled={
                  !bodyMeasurements.weight &&
                  !bodyMeasurements.bodyFat &&
                  !bodyMeasurements.waist &&
                  !bodyMeasurements.leftBicep &&
                  !bodyMeasurements.rightBicep
                }
              >
                Submit Body Measurements
              </Button>
            </TabsContent>

            {/* Recovery */}
            <TabsContent
              value="recovery"
              className="space-y-4"
            >
              <div className="grid grid-rows-3 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hrv">HRV (ms)</Label>
                  <Input
                    id="hrv"
                    type="number"
                    placeholder="45"
                    value={recovery.hrv || ""}
                    onChange={(e) =>
                      setRecovery((prev) => ({
                        ...prev,
                        hrv: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="restingHR">Resting HR (bpm)</Label>
                  <Input
                    id="restingHR"
                    type="number"
                    placeholder="60"
                    value={recovery.restingHR || ""}
                    onChange={(e) =>
                      setRecovery((prev) => ({
                        ...prev,
                        restingHR: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="doms">DOMS (1-10)</Label>
                  <Input
                    id="doms"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="3"
                    value={recovery.doms || ""}
                    onChange={(e) =>
                      setRecovery((prev) => ({
                        ...prev,
                        doms: parseFloat(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  handleStructuredSubmit(
                    "recovery",
                    { recovery },
                    "Recovery metrics tracking"
                  )
                }
                className="w-full"
                disabled={
                  !recovery.hrv && !recovery.restingHR && !recovery.doms
                }
              >
                Submit Recovery Data
              </Button>
            </TabsContent>

            {/* File Upload */}
            <TabsContent
              value="files"
              className="space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileUpload">Upload Files</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: PDF, JPG, PNG, TXT (max 10MB each)
                  </p>
                </div>

                {files.length > 0 && (
                  <>
                    {" "}
                    <div className="space-y-2">
                      <Label>Selected Files ({files.length})</Label>
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded border"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">
                              {file.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                          </div>
                          <Button
                            onClick={() => removeFile(index)}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <FileUpload />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
