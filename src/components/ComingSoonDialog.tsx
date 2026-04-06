import zenkashLogo from "@/assets/zenkash-logo.png";
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
          <img src={zenkashLogo} alt="Zenkash" className="w-20 h-20 object-contain mx-auto mb-4 animate-bounce-soft" />
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
