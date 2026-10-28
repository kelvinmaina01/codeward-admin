import { useState, useRef, useCallback, useMemo, type KeyboardEvent, type ClipboardEvent } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Send,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  Smartphone,
  Monitor,
  CheckCircle2,
  Inbox,
  Eye,
  Edit3,
  X,
  Plus,
  User,
  Users,
  UserPlus,
  ExternalLink,
  Shield,
  Sparkles,
  LayoutTemplate,
  Search,
  Check,
  Building,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useSendEmail, SENDER_PRESETS, type SenderPreset } from "../../lib/messages";
import {
  markdownToEmailHtml,
  markdownToPlainText,
  wrapInRetroEmailTemplate,
} from "../../lib/email-markdown";
import { getAvatarUrls } from "../../lib/avatar";
import { useUserDirectory, extractEmailsFromInput, type AppUser } from "../../lib/users";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Avatar with Libravatar / Gravatar support                         */
/* ------------------------------------------------------------------ */

function AvatarImage({
  email,
  label,
  color,
  size = "w-8 h-8",
}: {
  email: string;
  label: string;
  color?: string;
  size?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const avatar = getAvatarUrls(email, 96);

  if (imgError) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-bold uppercase",
          size,
          color || "bg-primary/10 text-primary",
        )}
      >
        {label ? label[0].toUpperCase() : "?"}
      </span>
    );
  }

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full ring-1 ring-border/50", size)}>
      <img
        src={avatar.libravatar}
        alt={label}
        onError={() => setImgError(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User Picker Modal (Multi-select from database)                    */
/* ------------------------------------------------------------------ */

function UserPickerModal({
  isOpen,
  onClose,
  onSelectUsers,
  alreadySelected,
  targetLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectUsers: (emails: string[]) => void;
  alreadySelected: string[];
  targetLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const { data, isLoading } = useUserDirectory(search, 100);
  const users = data?.users || [];

  const toggleUser = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const selectAll = () => {
    const unselected = users
      .map((u) => u.email.toLowerCase())
      .filter((e) => !alreadySelected.includes(e));
    setSelectedEmails(unselected);
  };

  const handleConfirm = () => {
    onSelectUsers(selectedEmails);
    setSelectedEmails([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold">Select Codeward Users</h3>
              <p className="text-xs text-muted-foreground">Add to {targetLabel} field</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b px-4 py-3 bg-muted/20">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email, or plan..."
              className="h-9 w-full rounded-xl border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              autoFocus
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{users.length} users found</span>
            <button
              type="button"
              onClick={selectAll}
              className="font-medium text-primary hover:underline cursor-pointer"
            >
              Select all visible ({users.length})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {isLoading && (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No users matching "{search}"
            </div>
          )}

          {users.map((u) => {
            const isAlready = alreadySelected.includes(u.email.toLowerCase());
            const isChecked = selectedEmails.includes(u.email.toLowerCase()) || isAlready;

            return (
              <div
                key={u.id}
                onClick={() => !isAlready && toggleUser(u.email.toLowerCase())}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl p-2.5 transition-colors",
                  isAlready
                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                    : "hover:bg-muted/60 cursor-pointer",
                  selectedEmails.includes(u.email.toLowerCase()) && "bg-primary/10 border border-primary/20",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                    )}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>

                  <AvatarImage
                    email={u.email}
                    label={u.name || u.email}
                    size="h-8 w-8"
                  />

                  <div className="truncate">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {u.name || u.email.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {u.plan && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                      {u.plan}
                    </span>
                  )}
                  {isAlready && (
                    <span className="text-[10px] text-muted-foreground italic">Already added</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {selectedEmails.length} user(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={selectedEmails.length === 0}
              onClick={handleConfirm}
              className="h-8 text-xs font-semibold cursor-pointer"
            >
              Add {selectedEmails.length > 0 ? `(${selectedEmails.length})` : ""} Recipients
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recipient Inspector Dialog                                        */
/* ------------------------------------------------------------------ */

function RecipientInspectorModal({
  recipient,
  matchedUser,
  onClose,
  onRemove,
  onMoveField,
  currentField,
}: {
  recipient: string | null;
  matchedUser?: AppUser | null;
  onClose: () => void;
  onRemove: () => void;
  onMoveField: (newField: "to" | "cc" | "bcc") => void;
  currentField: "to" | "cc" | "bcc";
}) {
  const navigate = useNavigate();
  if (!recipient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <AvatarImage
              email={recipient}
              label={matchedUser?.name || recipient}
              size="h-12 w-12"
            />
            <div>
              <h3 className="text-base font-bold text-foreground">
                {matchedUser?.name || recipient.split("@")[0]}
              </h3>
              <p className="text-xs text-muted-foreground font-mono">{recipient}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Status Card */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">User Status</span>
            {matchedUser ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Shield className="h-3 w-3" /> Registered User
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                External Contact
              </span>
            )}
          </div>

          {matchedUser && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Plan</span>
                <span className="font-bold uppercase text-foreground">{matchedUser.plan || "Free"}</span>
              </div>
              {matchedUser.orgName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Organization</span>
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Building className="h-3 w-3 text-muted-foreground" /> {matchedUser.orgName}
                  </span>
                </div>
              )}
              {matchedUser.role && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Role</span>
                  <span className="font-medium text-foreground capitalize">{matchedUser.role}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {matchedUser && (
            <Button
              className="w-full font-semibold cursor-pointer"
              onClick={() => {
                onClose();
                navigate(`/users/profile/${matchedUser.id}`);
              }}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View Full User Profile
            </Button>
          )}

          <div className="flex items-center gap-2">
            {currentField !== "to" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs cursor-pointer"
                onClick={() => {
                  onMoveField("to");
                  onClose();
                }}
              >
                Move to To
              </Button>
            )}
            {currentField !== "cc" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs cursor-pointer"
                onClick={() => {
                  onMoveField("cc");
                  onClose();
                }}
              >
                Move to Cc
              </Button>
            )}
            {currentField !== "bcc" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs cursor-pointer"
                onClick={() => {
                  onMoveField("bcc");
                  onClose();
                }}
              >
                Move to Bcc
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="text-xs cursor-pointer"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recipient Input with Autocomplete, Multi-paste & Inspection       */
/* ------------------------------------------------------------------ */

function RecipientInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  usersMap,
  allUsers,
  fieldKey,
  onMoveField,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  usersMap: Map<string, AppUser>;
  allUsers: AppUser[];
  fieldKey: "to" | "cc" | "bcc";
  onMoveField: (email: string, fromField: "to" | "cc" | "bcc", toField: "to" | "cc" | "bcc") => void;
}) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [inspectedRecipient, setInspectedRecipient] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users matching typed query
  const autocompleteSuggestions = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return [];
    return allUsers
      .filter((u) => {
        const email = u.email.toLowerCase();
        const name = (u.name || "").toLowerCase();
        return (email.includes(q) || name.includes(q)) && !value.includes(email);
      })
      .slice(0, 8);
  }, [input, allUsers, value]);

  // Add one or multiple emails
  const addEmails = useCallback(
    (newEmails: string[]) => {
      const clean = newEmails
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && !value.includes(s));
      if (clean.length > 0) {
        onChange([...value, ...clean]);
      }
    },
    [value, onChange],
  );

  // Paste handler: handles comma, list, links with email params, mailto links
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    const extracted = extractEmailsFromInput(pastedText);
    if (extracted.length > 0) {
      e.preventDefault();
      addEmails(extracted);
      setInput("");
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "Tab" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const extracted = extractEmailsFromInput(input);
      if (extracted.length > 0) {
        addEmails(extracted);
      } else {
        addEmails([input.trim()]);
      }
      setInput("");
      setShowDropdown(false);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleSelectUser = (u: AppUser) => {
    addEmails([u.email]);
    setInput("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer transition-colors"
        >
          <UserPlus className="h-3 w-3" />
          Select from Users
        </button>
      </div>

      <div
        className="relative flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border bg-background px-3 py-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all cursor-text shadow-2xs"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email, i) => {
          const user = usersMap.get(email.toLowerCase());
          return (
            <div
              key={email + i}
              onClick={(e) => {
                e.stopPropagation();
                setInspectedRecipient(email);
              }}
              title="Click to inspect recipient details and profile"
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-lg border py-1 pl-1.5 pr-2 text-xs font-medium transition-all cursor-pointer shadow-2xs",
                user
                  ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                  : "bg-muted/60 border-border/60 text-foreground hover:bg-muted",
              )}
            >
              <AvatarImage
                email={email}
                label={user?.name || email}
                size="h-5 w-5"
              />
              <span className="font-semibold text-[11px]">
                {user?.name ? user.name : email}
              </span>
              {user?.plan && (
                <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">
                  {user.plan}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10 cursor-pointer transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        <input
          ref={inputRef}
          id={id}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={value.length === 0 ? placeholder : "Type email, search user, or paste list..."}
          className="min-w-[150px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/50"
        />

        {/* Autocomplete Dropdown */}
        {showDropdown && autocompleteSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-auto rounded-xl border bg-card p-1 shadow-xl animate-in fade-in slide-in-from-top-1">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b mb-1">
              Matching Codeward Users
            </p>
            {autocompleteSuggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectUser(u)}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <AvatarImage
                    email={u.email}
                    label={u.name || u.email}
                    size="h-6 w-6"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate">{u.name || u.email.split("@")[0]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                {u.plan && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground shrink-0">
                    {u.plan}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Directory Modal */}
      <UserPickerModal
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectUsers={(emails) => addEmails(emails)}
        alreadySelected={value}
        targetLabel={label}
      />

      {/* Recipient Inspector Modal */}
      <RecipientInspectorModal
        recipient={inspectedRecipient}
        matchedUser={inspectedRecipient ? usersMap.get(inspectedRecipient.toLowerCase()) : null}
        onClose={() => setInspectedRecipient(null)}
        onRemove={() => {
          if (inspectedRecipient) {
            onChange(value.filter((e) => e.toLowerCase() !== inspectedRecipient.toLowerCase()));
          }
        }}
        onMoveField={(newField) => {
          if (inspectedRecipient) {
            onMoveField(inspectedRecipient, fieldKey, newField);
          }
        }}
        currentField={fieldKey}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sender Selector                                                    */
/* ------------------------------------------------------------------ */

function SenderSelector({
  value,
  onChange,
}: {
  value: SenderPreset;
  onChange: (v: SenderPreset) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const select = (p: SenderPreset) => {
    onChange(p);
    setOpen(false);
    setShowCustom(false);
  };

  const addCustom = () => {
    const prefix = custom.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!prefix) return;
    const preset: SenderPreset = {
      label: prefix,
      email: `${prefix}@codeward.cloud`,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    };
    select(preset);
    setCustom("");
  };

  return (
    <div className="relative space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        From
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border bg-background px-3 py-2.5 text-sm transition-all hover:border-primary/40 cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <AvatarImage
            email={value.email}
            label={value.label}
            color={value.color}
            size="h-8 w-8"
          />
          <div className="text-left">
            <p className="font-semibold leading-tight">{value.label}</p>
            <p className="text-[11px] text-muted-foreground">{value.email}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border bg-card shadow-2xl animate-in fade-in slide-in-from-top-1">
          <div className="p-1.5 space-y-0.5">
            {SENDER_PRESETS.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => select(p)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                  value.email === p.email
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-foreground",
                )}
              >
                <AvatarImage
                  email={p.email}
                  label={p.label}
                  color={p.color}
                  size="h-7 w-7"
                />
                <div className="text-left">
                  <p className="font-medium leading-tight">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">{p.email}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t px-3 py-2.5">
            {showCustom ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center rounded-lg border bg-background">
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustom()}
                    placeholder="prefix"
                    className="h-8 min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none"
                    autoFocus
                  />
                  <span className="pr-2.5 text-xs text-muted-foreground">@codeward.cloud</span>
                </div>
                <Button size="sm" onClick={addCustom} className="h-8 px-3 font-semibold">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Custom email address…
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Compose Component                                            */
/* ------------------------------------------------------------------ */

type ComposeMode = "rich" | "plain" | "html";
type ViewTab = "compose" | "preview";

export default function ComposeEmail() {
  const navigate = useNavigate();
  const sendEmail = useSendEmail();

  // Fetch all users for recipient autocomplete, directory & inspection
  const { data: usersData } = useUserDirectory("", 200);
  const allUsers = usersData?.users || [];

  // Index users by email for fast lookup
  const usersMap = useMemo(() => {
    const map = new Map<string, AppUser>();
    for (const u of allUsers) {
      if (u.email) {
        map.set(u.email.toLowerCase(), u);
      }
    }
    return map;
  }, [allUsers]);

  const [sender, setSender] = useState<SenderPreset>(SENDER_PRESETS[0]);
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<ComposeMode>("rich");
  const [wrapRetroHtml, setWrapRetroHtml] = useState(true);
  const [viewTab, setViewTab] = useState<ViewTab>("compose");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Link dialog
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Move a recipient between To, Cc, and Bcc
  const handleMoveField = (email: string, fromField: "to" | "cc" | "bcc", toField: "to" | "cc" | "bcc") => {
    const cleanEmail = email.toLowerCase();
    if (fromField === "to") setTo((prev) => prev.filter((e) => e.toLowerCase() !== cleanEmail));
    if (fromField === "cc") setCc((prev) => prev.filter((e) => e.toLowerCase() !== cleanEmail));
    if (fromField === "bcc") setBcc((prev) => prev.filter((e) => e.toLowerCase() !== cleanEmail));

    if (toField === "to") setTo((prev) => [...prev, cleanEmail]);
    if (toField === "cc") {
      setShowCcBcc(true);
      setCc((prev) => [...prev, cleanEmail]);
    }
    if (toField === "bcc") {
      setShowCcBcc(true);
      setBcc((prev) => [...prev, cleanEmail]);
    }
  };

  // Insert formatting helper at cursor
  const insertFormatting = (before: string, after: string = "", placeholder = "") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  const handleOpenLinkDialog = () => {
    const el = textareaRef.current;
    if (el) {
      const selected = content.substring(el.selectionStart, el.selectionEnd);
      if (selected) {
        setLinkText(selected);
      }
    }
    setShowLinkDialog(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const text = linkText.trim() || url;

    if (mode === "html") {
      const htmlAnchor = `<a href="${url}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600;">${text}</a>`;
      insertFormatting(htmlAnchor);
    } else {
      insertFormatting(`[${text}](`, `)`, url);
    }

    setShowLinkDialog(false);
    setLinkText("");
    setLinkUrl("");
  };

  const handleInsertButton = () => {
    if (mode === "html") {
      const htmlBtn = `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 14px 0; display: inline-block;"><tr><td align="center" style="border-radius: 12px; background-color: #0f172a; border: 2px solid #0f172a; box-shadow: 3px 3px 0px #2563eb;"><a href="https://codeward.cloud" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff !important; text-decoration: none; padding: 11px 22px; display: inline-block;">Click Here &rarr;</a></td></tr></table>`;
      insertFormatting(htmlBtn);
    } else {
      insertFormatting(`[button: Action Title](https://codeward.cloud)`);
    }
  };

  // Compile final email bodies
  const getCompiledBodies = () => {
    if (mode === "html") {
      const raw = content.trim();
      const isFullDoc = /<!DOCTYPE|<html/i.test(raw);
      const html = !isFullDoc && wrapRetroHtml ? wrapInRetroEmailTemplate(raw) : raw;
      return {
        html,
        text: undefined,
      };
    }
    if (mode === "plain") {
      return {
        text: content.trim(),
        html: undefined,
      };
    }
    // Rich / Markdown mode: generates BOTH email-ready HTML and clean plain-text fallback!
    return {
      html: markdownToEmailHtml(content),
      text: markdownToPlainText(content),
    };
  };

  const send = () => {
    if (to.length === 0) {
      setError("Please add at least one recipient email address.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter a subject line.");
      return;
    }
    if (!content.trim()) {
      setError("Please write the email body content.");
      return;
    }

    setError("");
    const bodies = getCompiledBodies();

    sendEmail.mutate(
      {
        from: sender.email,
        fromName: sender.label,
        to,
        cc: cc.length ? cc : undefined,
        bcc: bcc.length ? bcc : undefined,
        subject: subject.trim(),
        text: bodies.text,
        html: bodies.html,
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
        onError: (e) => {
          setError(
            e.message.replace(/^API Error \d+:\s*/, "") || "Failed to send the email.",
          );
        },
      },
    );
  };

  const resetForm = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject("");
    setContent("");
    setSuccess(false);
    setError("");
  };

  const renderedPreviewHtml =
    mode === "html"
      ? /<!DOCTYPE|<html/i.test(content) || !wrapRetroHtml
        ? content
        : wrapInRetroEmailTemplate(content)
      : markdownToEmailHtml(content);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => navigate("/messages")}
            title="Back to Messages"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">Compose Email</h2>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Resend API
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Send from any @codeward.cloud address · Replies will route to your Inbox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/messages")}
            className="text-xs font-medium cursor-pointer"
          >
            <Inbox className="mr-1.5 h-3.5 w-3.5" />
            Inbox & Replies
          </Button>

          <Button
            size="sm"
            disabled={sendEmail.isPending}
            onClick={send}
            className="font-semibold px-5 cursor-pointer shadow-sm"
          >
            {sendEmail.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            Send Email
          </Button>
        </div>
      </div>

      {/* ── Main Canvas ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {/* Success Banner */}
          {success && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Email sent successfully!
                  </h3>
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    Your message has been dispatched via Resend. When recipients reply,
                    their responses are received and viewable directly in your Inbox.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate("/messages")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                    >
                      <Inbox className="mr-1.5 h-3.5 w-3.5" /> View in Inbox
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                      className="cursor-pointer"
                    >
                      Compose Another
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-in fade-in">
              {error}
            </div>
          )}

          {/* Sender */}
          <SenderSelector value={sender} onChange={setSender} />

          {/* Recipients: TO */}
          <RecipientInput
            id="compose-to"
            label="To"
            value={to}
            onChange={setTo}
            placeholder="recipient@example.com (search user, comma list, or paste link/text)"
            usersMap={usersMap}
            allUsers={allUsers}
            fieldKey="to"
            onMoveField={handleMoveField}
          />

          {/* Cc / Bcc expander */}
          {!showCcBcc && (
            <button
              type="button"
              onClick={() => setShowCcBcc(true)}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              Add Cc / Bcc
            </button>
          )}

          {showCcBcc && (
            <div className="space-y-4 rounded-xl border border-dashed bg-muted/20 p-4">
              <RecipientInput
                id="compose-cc"
                label="Cc"
                value={cc}
                onChange={setCc}
                placeholder="cc@example.com"
                usersMap={usersMap}
                allUsers={allUsers}
                fieldKey="cc"
                onMoveField={handleMoveField}
              />
              <RecipientInput
                id="compose-bcc"
                label="Bcc"
                value={bcc}
                onChange={setBcc}
                placeholder="bcc@example.com"
                usersMap={usersMap}
                allUsers={allUsers}
                fieldKey="bcc"
                onMoveField={handleMoveField}
              />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label
              htmlFor="compose-subject"
              className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Subject
            </label>
            <input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Welcome to Codeward Cloud / Update on your project"
              className="h-11 w-full rounded-xl border bg-background px-3.5 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
            />
          </div>

          {/* Compose Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-2 shadow-xs">
            {/* Mode selection */}
            <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("rich")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  mode === "rich"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Rich / Markdown
              </button>
              <button
                type="button"
                onClick={() => setMode("plain")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  mode === "plain"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Plain Text
              </button>
              <button
                type="button"
                onClick={() => setMode("html")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  mode === "html"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Raw HTML
              </button>
            </div>

            {/* View / Preview toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setViewTab("compose")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  viewTab === "compose"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setViewTab("preview")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  viewTab === "preview"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
          </div>

          {/* Formatting Toolbar */}
          {viewTab === "compose" && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 p-2 text-xs">
              <div className="flex flex-wrap items-center gap-1">
                {mode === "rich" && (
                  <>
                    <button
                      type="button"
                      onClick={() => insertFormatting("**", "**", "bold text")}
                      title="Bold (Ctrl+B)"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("*", "*", "italic text")}
                      title="Italic (Ctrl+I)"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <div className="mx-1 h-4 w-[1px] bg-border" />
                  </>
                )}

                {/* Hyperlink button: Available in both Rich and HTML modes! */}
                {(mode === "rich" || mode === "html") && (
                  <button
                    type="button"
                    onClick={handleOpenLinkDialog}
                    title="Insert Hyperlink"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 hover:bg-background text-primary hover:text-primary cursor-pointer font-semibold transition-colors"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Hyperlink
                  </button>
                )}

                {/* CTA Button: Available in both Rich and HTML modes */}
                {(mode === "rich" || mode === "html") && (
                  <button
                    type="button"
                    onClick={handleInsertButton}
                    title="Insert Styled CTA Button"
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors font-medium"
                  >
                    CTA Button
                  </button>
                )}

                {mode === "rich" && (
                  <>
                    <div className="mx-1 h-4 w-[1px] bg-border" />
                    <button
                      type="button"
                      onClick={() => insertFormatting("## ", "", "Section Title")}
                      title="Heading"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <Heading2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("- ", "", "Bullet item")}
                      title="Bullet List"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("1. ", "", "Ordered item")}
                      title="Numbered List"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("> ", "", "Quoted text")}
                      title="Blockquote"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("`", "`", "code")}
                      title="Code"
                      className="rounded-lg p-1.5 hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* HTML Mode Retro Frame Toggle */}
              {mode === "html" && (
                <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={wrapRetroHtml}
                    onChange={(e) => setWrapRetroHtml(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
                  Apply Retro Outlook/Gmail Frame (4px Border & 18px Radius)
                </label>
              )}
            </div>
          )}

          {/* Hyperlink Dialog */}
          {showLinkDialog && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Insert Clickable Hyperlink
                </span>
                <button
                  type="button"
                  onClick={() => setShowLinkDialog(false)}
                  className="rounded p-0.5 hover:bg-primary/20 text-muted-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Display Text
                  </label>
                  <input
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="e.g. Visit Codeward Cloud"
                    className="h-8 w-full rounded-lg border bg-background px-2.5 text-xs outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Destination URL
                  </label>
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyLink()}
                    placeholder="https://codeward.cloud"
                    className="h-8 w-full rounded-lg border bg-background px-2.5 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLinkDialog(false)}
                  className="h-7 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyLink}
                  className="h-7 text-xs font-semibold cursor-pointer"
                >
                  Insert Hyperlink
                </Button>
              </div>
            </div>
          )}

          {/* Write Canvas */}
          {viewTab === "compose" && (
            <div className="space-y-1.5">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  mode === "rich"
                    ? "Write your email here... You can paste markdown, links like [Codeward](https://codeward.cloud), lists, or plain text."
                    : mode === "html"
                      ? "Paste full HTML email template or write custom HTML tags (<p>, <h2>, <a href='...'>) here..."
                      : "Write plain text message here..."
                }
                rows={16}
                className={cn(
                  "w-full rounded-2xl border bg-background p-4 text-sm leading-relaxed outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-y",
                  mode === "html" && "font-mono text-xs",
                )}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>
                  {mode === "rich"
                    ? "✨ Formatted with huge 4px retro outer border, 18px radius, and table-based Outlook & Gmail responsive layout."
                    : mode === "html"
                      ? wrapRetroHtml
                        ? "✨ Raw HTML wrapped in retro 4px outer border & 18px radius Outlook/Gmail container."
                        : "Sent as standalone custom HTML."
                      : "Sent as pure plain text."}
                </span>
                <span>{content.length} characters</span>
              </div>
            </div>
          )}

          {/* Live Preview Canvas */}
          {viewTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">
                    Cross-Client Email Preview
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Tested for Outlook desktop, Gmail mobile & desktop, and Apple Mail
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
                      previewDevice === "desktop"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Desktop Preview"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors",
                      previewDevice === "mobile"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Mobile Preview (Outlook & Gmail app)"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Mobile (375px)
                  </button>
                </div>
              </div>

              {/* Email Envelope Container */}
              <div
                className={cn(
                  "mx-auto rounded-2xl border bg-card shadow-xl transition-all overflow-hidden",
                  previewDevice === "desktop" ? "w-full max-w-2xl" : "w-[390px] max-w-full",
                )}
              >
                {/* Email Header Preview */}
                <div className="border-b bg-muted/40 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-12 font-semibold text-muted-foreground">From:</span>
                    <span className="font-semibold text-foreground">
                      {sender.label} &lt;{sender.email}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 font-semibold text-muted-foreground">To:</span>
                    <span className="text-foreground">
                      {to.length ? to.join(", ") : "(no recipients specified)"}
                    </span>
                  </div>
                  {cc.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-semibold text-muted-foreground">Cc:</span>
                      <span className="text-foreground">{cc.join(", ")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="w-12 font-semibold text-muted-foreground">Subject:</span>
                    <span className="font-bold text-foreground">
                      {subject || "(no subject)"}
                    </span>
                  </div>
                </div>

                {/* Email Body Iframe Preview */}
                <div className="bg-slate-100 p-2 sm:p-4">
                  {content.trim() ? (
                    <iframe
                      srcDoc={renderedPreviewHtml}
                      title="Email Client Rendering"
                      className="w-full min-h-[500px] rounded-xl border border-border/40 bg-transparent shadow-xs"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="p-12 text-center text-xs text-muted-foreground">
                      Start writing your message to see the responsive Outlook & Gmail preview here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Send Bar */}
          <div className="flex items-center justify-between border-t pt-5">
            <div className="flex items-center gap-2.5">
              <AvatarImage
                email={sender.email}
                label={sender.label}
                color={sender.color}
                size="h-7 w-7"
              />
              <p className="text-xs text-muted-foreground">
                Sending from{" "}
                <span className="font-semibold text-foreground">{sender.email}</span>
              </p>
            </div>

            <Button
              disabled={sendEmail.isPending}
              onClick={send}
              className="font-semibold px-6 cursor-pointer shadow-sm"
            >
              {sendEmail.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Send Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
