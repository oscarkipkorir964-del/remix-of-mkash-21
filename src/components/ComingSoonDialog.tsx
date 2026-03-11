import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComingSoonDialog = ({ open, onOpenChange }: ComingSoonDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-primary/20">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center animate-bounce-soft">
            <span className="text-primary-foreground font-bold text-3xl font-display">T</span>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Coming Soon
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            We're working hard to bring you an amazing savings experience. Stay tuned for exciting updates!
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
