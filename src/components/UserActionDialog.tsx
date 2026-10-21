import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, RotateCcw, ShieldBan, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { apiFetch } from "../lib/api";

export type UserActionMode = "suspend" | "restore" | "purge";

type Target = {
  id: string;
  email: string;
  name?: string | null;
};

const COPY: Record<
  UserActionMode,
  { title: string; subtitle: string; body: string; cta: string; icon: typeof Trash2; destructive: boolean }
> = {
  suspend: {
    title: "Suspend Account",
    subtitle: "Blocks sign-in immediately. Fully reversible.",
    body:
      "The user is signed out of every session, cannot sign back in, and is excluded from digests and nudges. Their data, subscription and billing history are kept. You can restore the account at any time.",
    cta: "Suspend Account",
    icon: ShieldBan,
    destructive: false,
  },
  restore: {
    title: "Restore Account",
    subtitle: "Re-enables sign-in for this user.",
    body:
      "The account becomes active again and the user can sign in with their existing credentials. Any previous suspension record is cleared.",
    cta: "Restore Account",
    icon: RotateCcw,
    destructive: false,
  },
  purge: {
    title: "Permanently Delete Account",
    subtitle: "This cannot be undone.",
    body:
      "The user row and everything they own are removed: sessions, credentials, repositories, runs, workspaces, chat sessions, org memberships, leaderboard entries and sole-member organizations. Billing history is retained with the organization detached. An active Polar subscription keeps billing until it is cancelled separately.",
    cta: "Delete Permanently",
    icon: Trash2,
    destructive: true,
  },
};

export default function UserActionDialog({
  mode,
  user,
  onClose,
  onDone,
}: {
  mode: UserActionMode;
  user: Target;
  onClose: () => void;
  onDone: () => void;
}) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [cancelSubscription, setCancelSubscription] = useState(false);
  const [error, setError] = useState("");
  const copy = COPY[mode];
  const Icon = copy.icon;

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "purge") {
        return apiFetch(`/users/${user.id}`, {
          method: "DELETE",
          body: JSON.stringify({
            confirmEmail: confirmEmail.trim(),
            cancelSubscription,
          }),
        });
      }
      return apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDeleted: mode === "suspend" }),
      });
    },
    onSuccess: () => {
      onDone();
    },
    onError: (e: Error) => {
      setError(e.message.replace(/^API Error \d+:\s*/, "") || "Action failed.");
    },
  });

  const emailMatches = confirmEmail.trim().toLowerCase() === user.email.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-md shadow-2xl border-destructive/30">
        <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b">
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
              copy.destructive ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-500"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{copy.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{copy.subtitle}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {copy.body}
          </p>
          <p className="text-xs text-foreground">
            Target: <code className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded">{user.email}</code>
          </p>

          {mode === "purge" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Type <span className="font-mono font-bold">{user.email}</span> to confirm
                </label>
                <input
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user.email}
                  autoComplete="off"
                  className="h-9 w-full rounded-lg border bg-background px-2.5 text-sm font-mono outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelSubscription}
                  onChange={(e) => setCancelSubscription(e.target.checked)}
                  className="mt-0.5 accent-destructive"
                />
                Also schedule the org&apos;s Polar subscription to end at the current period end
              </label>
            </>
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
            <Button
              variant={copy.destructive ? "destructive" : "default"}
              size="sm"
              disabled={mutation.isPending || (mode === "purge" && !emailMatches)}
              onClick={() => mutation.mutate()}
              className="font-semibold"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {copy.cta}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
