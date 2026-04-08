import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Send } from "lucide-react";

interface PasswordResetEmailDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onSend: () => void;
}

const PasswordResetEmailDialog = ({ open, onClose, email, onSend }: PasswordResetEmailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Password Reset Email Preview
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">To:</span>
            <span className="text-foreground">{email}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Subject:</span>
            <span className="text-foreground">BookFlow — Password Reset Request</span>
          </div>
          <hr className="border-border" />
          <div className="space-y-2 text-sm text-foreground">
            <p>Hello,</p>
            <p>
              We received a request to reset the password for the account associated
              with <strong>{email}</strong>.
            </p>
            <p>
              Click the button below to reset your password. This link will expire in 24 hours.
            </p>
            <div className="flex justify-center py-3">
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                Reset Password
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              If you did not request a password reset, please ignore this email.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              — The BookFlow Team
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSend} className="gap-2">
            <Send className="h-4 w-4" /> Send Reset Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetEmailDialog;
