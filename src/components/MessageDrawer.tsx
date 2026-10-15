import { useState, useRef, useCallback } from "react";
import { X, Send, Loader2, AlertCircle, CheckCircle2, Mail, Code2, Type, Link, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { apiFetch } from "../lib/api";

interface UserStub {
  id: string;
  name: string;
  email: string;
}

interface Props {
  user: UserStub | null;
  onClose: () => void;
}

type FormatMode = "plain" | "html";

const SUBJECT_TEMPLATES = [
  "Important update about your Codeward account",
  "Action required: Security notice",
  "Your Codeward trial is ending soon",
  "Welcome to Codeward — getting started tips",
  "Feedback request from the Codeward team",
];

export default function MessageDrawer({ user, onClose }: Props) {
  const [mode, setMode] = useState<FormatMode>("plain");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback((before: string, after = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end);
    const newText =
      body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(newText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    });
  }, [body]);

  const handleSend = async () => {
    setError("");
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!body.trim()) { setError("Email body is required."); return; }

    setIsSending(true);
    try {
      await apiFetch(`/users/${user!.id}/message`, {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), body, isHtml: mode === "html" }),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSubject("");
        setBody("");
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  const charCount = body.length;
  const isOpen = !!user;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-lg bg-card border-l border-border/70 shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Mail className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">Send Message</p>
              {user && (
                <p className="text-xs text-muted-foreground truncate">
                  To: <span className="font-medium text-foreground">{user.name}</span>{" "}
                  &lt;{user.email}&gt;
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Format Switcher */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 shrink-0">
          <span className="text-xs text-muted-foreground mr-2">Format:</span>
          {(["plain", "html"] as FormatMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setMode(f)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                mode === f
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "text-muted-foreground border-border/60 hover:border-border hover:text-foreground"
              )}
            >
              {f === "plain" ? <Type className="h-3 w-3" /> : <Code2 className="h-3 w-3" />}
              {f === "plain" ? "Plain Text" : "HTML"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-4 px-5 py-4 overflow-y-auto">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Subject</label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setShowSubjectSuggestions(false); }}
                onFocus={() => !subject && setShowSubjectSuggestions(true)}
                placeholder="e.g. Important update about your account"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-9"
              />
              <button
                type="button"
                onClick={() => setShowSubjectSuggestions((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              {showSubjectSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-border/80 bg-popover shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {SUBJECT_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 transition-colors text-foreground"
                      onClick={() => { setSubject(t); setShowSubjectSuggestions(false); }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HTML toolbar */}
          {mode === "html" && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground mr-1">Insert:</span>
              {[
                { label: "Bold", action: () => insertAtCursor("<strong>", "</strong>") },
                { label: "Italic", action: () => insertAtCursor("<em>", "</em>") },
                { label: "H2", action: () => insertAtCursor("<h2>", "</h2>") },
                { label: "P", action: () => insertAtCursor("<p>", "</p>") },
                { label: "Link", action: () => insertAtCursor('<a href="https://">', "</a>") },
                { label: "HR", action: () => insertAtCursor("<hr />") },
                { label: "BR", action: () => insertAtCursor("<br />") },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="px-2 py-1 rounded-md border border-border/60 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  {label === "Link" ? <Link className="h-3 w-3 inline" /> : label}
                </button>
              ))}
            </div>
          )}

          {/* Email body */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                {mode === "html" ? "HTML Body" : "Message"}
              </label>
              <span className={cn("text-[10px]", charCount > 5000 ? "text-amber-500" : "text-muted-foreground")}>
                {charCount.toLocaleString()} chars
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                mode === "html"
                  ? "<p>Hi {{name}},</p>\n<p>Your message here...</p>"
                  : "Hi there,\n\nYour message here...\n\nBest,\nThe Codeward Team"
              }
              rows={14}
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none leading-relaxed",
                mode === "html" && "font-mono text-xs"
              )}
            />
          </div>

          {/* Help tip */}
          <div className="rounded-lg bg-muted/40 border border-border/40 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
            {mode === "html" ? (
              <>
                <span className="font-medium text-foreground">HTML mode:</span> Full HTML email body. Inline styles are recommended for email client compatibility. Reply-to is set to your admin email.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">Plain text mode:</span> Clean, readable email. No HTML tags needed. Line breaks are preserved.
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-5 py-4 space-y-3 shrink-0">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Email sent successfully!</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Sent via Resend · Reply-to: your admin email
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5 font-semibold min-w-[90px]"
                onClick={handleSend}
                disabled={isSending || success}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
