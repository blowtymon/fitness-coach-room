import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, X, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { FilePickerDialog } from "@/components/FilePickerDialog";
import { uploadApi } from "@/services/uploadApi";

import type {
  Log,
  NutritionData,
  BodyMeasurements,
  RecoveryData,
  StructuredLogInput,
} from "./FitnessCoach";

interface LogEntryProps {
  onSubmit: (log: Log | StructuredLogInput) => void;
}

type UploadedAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
};

export const LogEntry = ({ onSubmit }: LogEntryProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quick");

  const [quickContent, setQuickContent] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [nutrition, setNutrition] = useState<NutritionData>({});

  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements>(
    {}
  );

  const [recovery, setRecovery] = useState<RecoveryData>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadedAttachments, setUploadedAttachments] = useState<
    UploadedAttachment[]
  >([]);

  const onFilesPicked = (files: File[]) => {
    const key = (f: File) => `${f.name}_${f.size}`;
    const existing = new Set(pendingFiles.map(key));
    const deduped = files.filter((f) => !existing.has(key(f)));
    setPendingFiles((prev) => [...prev, ...deduped]);
  };

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeUploaded = (idx: number) => {
    setUploadedAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPendingFiles = async () => {
    if (!pendingFiles.length) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(
        pendingFiles.map(async (file) => {
          const resp = await uploadApi.uploadFile(file);
          const ok = !!(resp.success && resp.fileUrl);
          return {
            ok,
            file,
            uploaded: ok
              ? ({
                  id: resp.logId ?? crypto.randomUUID(),
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  url: resp.fileUrl!,
                } as UploadedAttachment)
              : undefined,
            error: resp.error,
          };
        })
      );

      const successes = results.filter((r) => r.ok).map((r) => r.uploaded!);
      const failures = results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => !r.ok)
        .map(({ i }) => pendingFiles[i].name);

      if (successes.length) {
        setUploadedAttachments((prev) => [...prev, ...successes]);
        toast({
          title: "Upload complete",
          description: `${successes.length} file(s) uploaded successfully.`,
        });
      }
      if (failures.length) {
        toast({
          title: "Some uploads failed",
          description: failures.join(", "),
          variant: "destructive",
        });
      }

      const successMask = results.map((r) => r.ok);
      setPendingFiles((prev) => prev.filter((_, i) => !successMask[i]));
    } finally {
      setIsUploading(false);
    }
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
      description: note,
    });

    setQuickContent("");
    setUploadedAttachments([]);
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
    onSubmit({
      type,
      structured: data,
      description,
    });

    setNutrition({});
    setBodyMeasurements({});
    setRecovery({});
    setUploadedAttachments([]);

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

            <TabsContent
              value="quick"
              className="space-y-4"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
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
                </div>

                <div>
                  <Label htmlFor="note">Note</Label>
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
              >
                Submit Nutrition Log
              </Button>
            </TabsContent>

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
                    min={1}
                    max={10}
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

            {/* Files */}
            <TabsContent
              value="files"
              className="space-y-4"
            >
              <div className="flex items-center justify-between mt-4">
                <div>
                  <Label>Attachments</Label>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG, TXT (max 10MB each)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setPickerOpen(true)}>
                    <Plus className="h-4 w-4" />
                    <p className="hidden md:block">Add file</p>
                  </Button>
                  <Button
                    onClick={uploadPendingFiles}
                    disabled={!pendingFiles.length || isUploading}
                  >
                    <Upload className="h-4 w-4" />
                    <p className="hidden md:block">
                      {isUploading ? "Uploading..." : "Upload"}
                    </p>
                  </Button>
                </div>
              </div>

              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Pending ({pendingFiles.length})</Label>
                  {pendingFiles.map((file, index) => (
                    <div
                      key={`${file.name}_${file.size}_${index}`}
                      className="flex items-center justify-between p-2 bg-muted rounded border"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium truncate max-w-[240px]">
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
                        onClick={() => removePending(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedAttachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded ({uploadedAttachments.length})</Label>
                  {uploadedAttachments.map((att, index) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 bg-muted rounded border"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium truncate max-w-[240px]">
                          {att.fileName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {(att.fileSize / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        onClick={() => removeUploaded(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <FilePickerDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onPicked={onFilesPicked}
                multiple
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
