// components/FilePickerDialog.tsx
import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPicked: (files: File[]) => void;
  multiple?: boolean;
};

export function FilePickerDialog({
  open,
  onOpenChange,
  onPicked,
  multiple = true,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pick = () => fileInputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    const valid = list.filter((f) => {
      const isValidType = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "text/plain",
      ].includes(f.type);
      const isValidSize = f.size <= 10 * 1024 * 1024;

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${f.name} is not supported.`,
          variant: "destructive",
        });
        return false;
      }
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${f.name} exceeds 10MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (valid.length) {
      onPicked(valid);
      onOpenChange(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select files</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            className="hidden"
            multiple={multiple}
            onChange={onFileChange}
          />
          <div className="space-y-1">
            <Label>Pick from your device</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={pick}
              >
                Choose file{multiple ? "s" : ""}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, TXT (max 10MB each)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
