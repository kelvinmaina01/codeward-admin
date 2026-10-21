import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useResendMessage, type EmailMessage } from "../../lib/messages";

export default function ResendMessageDialog({
  message,
  onClose,
  onDone,
}: {
  message: EmailMessage;
  onClose: () => void;
  onDone: () => void;
}) {
  const defaultTo = message.failedRecipient || message.to.map((t) => t.email).join(", ");
  const [to, setTo] = useState(defaultTo);
  const [error, setError] = useState("");
  const resend = useResendMessage();

  const submit = () => {
    const toList = to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (toList.length === 0) {
      setError("Enter at least one recipient address.");
      return;
    }
    setError("");
    resend.mutate(
      { messageId: message.id, to: toList },
      {
        onSuccess: () => onDone(),
        onError: (e) => setError(e.message.replace(/^API Error \d+:\s*/, "") || "Could not resend the message."),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl border-amber-500/30">
        <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b">
          <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Resend Failed Email</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sends a fresh copy of this message and links it to the original attempt.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Recipients</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <p className="text-[11px] text-muted-foreground">
              Fix the address if the provider rejected it (for example a hard bounce for an invalid mailbox).
            </p>
          </div>

          {message.statusReason && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[11px] text-rose-600 dark:text-rose-400">
              <p className="font-semibold">Provider reason</p>
              <p className="mt-0.5 break-words">{message.statusReason}</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={resend.isPending} onClick={submit} className="font-semibold">
              {resend.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Resend
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
