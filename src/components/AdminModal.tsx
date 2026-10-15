import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  User,
  Mail,
} from "lucide-react";
import { Button } from "./ui/button";
import { apiFetch } from "../lib/api";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
  defaultRole?: "admin" | "super_admin";
  mode?: "add" | "edit";
}

export default function AdminModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = "",
  defaultRole = "admin",
  mode = "add",
}: AdminModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">(defaultRole);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail);
      setRole(defaultRole);
      setPassword("");
      setName("");
      setError("");
      setSuccess("");
    }
  }, [isOpen, defaultEmail, defaultRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        email: cleanEmail,
        role,
      };
      if (name.trim()) payload.name = name.trim();
      if (password) payload.password = password;

      const res = await apiFetch<{ success: boolean; message: string }>("/admins", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess(res.message || "Admin successfully saved!");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add or promote admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {mode === "edit" ? "Update Admin Credentials" : "Add / Promote Admin"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === "edit"
                  ? "Update administrative role or set a new password."
                  : "Grant administrative access or create a new admin."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20 leading-relaxed">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              User Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. saverio@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || (mode === "edit" && !!defaultEmail)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>

          {/* Name (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Display Name <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Saverio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              Admin Role <span className="text-destructive">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="admin">Admin (Manage users, organizations, scans)</option>
              <option value="super_admin">Super Admin (Full platform & billing control)</option>
            </select>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </label>
              <span className="text-[10px] text-muted-foreground">
                {mode === "edit" ? "Leave blank to keep existing" : "Required for new users (min 8 chars)"}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={mode === "edit" ? "•••••••• (unchanged)" : "Set initial password..."}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-normal mt-1">
              💡 If this user does not exist in Codeward yet, setting a password will{" "}
              <span className="font-medium text-foreground">create their account directly</span> so they can log in
              immediately without signing up first.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 font-semibold min-w-[130px]"
              disabled={isSubmitting || !!success}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  {mode === "edit" ? "Save Changes" : "Save / Promote"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
