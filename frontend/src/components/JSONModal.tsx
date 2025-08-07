import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const JSONModal = ({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: any;
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/50 fixed inset-0 z-50" />
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto z-50">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-2 bg-muted rounded">
            <pre className="text-md whitespace-pre-wrap break-all text-white">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
