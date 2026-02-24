"use client";

import { useState } from "react";
import { RoleGuard } from "@/app/components/role-guard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">
      {children}
    </label>
  );
}

function Input({
  id, value, onChange, placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400
        focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
    />
  );
}

function NumberInput({
  id, value, onChange, min, max,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      id={id}
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 w-28 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900
        focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
    />
  );
}

function Select({
  id, value, onChange, options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 text-[13px] text-zinc-700
          focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}

function Toggle({
  id, checked, onChange, label, description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-[13px] font-medium text-zinc-800 cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="mt-0.5 text-[12px] text-zinc-400">{description}</p>
        )}
      </div>
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
          checked ? "bg-zinc-900" : "bg-zinc-200",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function CardFooter({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div className="mt-auto flex items-center justify-end border-t border-zinc-100 bg-zinc-50 px-6 py-4 rounded-br-xl">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
      >
        {label}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {

  // ── General ──
  const [companyName,    setCompanyName]    = useState("Edocsis Corp.");
  const [visibility,     setVisibility]     = useState("department");
  const [approvalFlow,   setApprovalFlow]   = useState("multi");
  const [docFormat,      setDocFormat]      = useState("DOC-YYYY-####");

  // ── Notifications ──
  const [notifyApproval, setNotifyApproval] = useState(true);
  const [notifyReject,   setNotifyReject]   = useState(true);
  const [notifyDeadline, setNotifyDeadline] = useState(true);
  const [notifySummary,  setNotifySummary]  = useState(false);

  // ── Security ──
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [twoFactor,      setTwoFactor]      = useState(false);
  const [minPwLength,    setMinPwLength]    = useState(8);

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-260 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          System Settings
        </h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Configure document workflows and system preferences.
        </p>
      </div>

      {/* ── Section 1: General Settings ─────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

          {/* Left */}
          <div className="border-b border-zinc-100 px-6 py-6 lg:border-b-0 lg:border-r">
            <h3 className="text-[14px] font-semibold text-zinc-900">General</h3>
            <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">
              Organisation name, document defaults, and numbering format.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col">
            <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2">

              {/* Company Name — full width */}
              <div className="sm:col-span-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Your organisation name"
                />
              </div>

              {/* Visibility */}
              <div>
                <Label htmlFor="visibility">Default Document Visibility</Label>
                <Select
                  id="visibility"
                  value={visibility}
                  onChange={setVisibility}
                  options={[
                    { label: "Private",        value: "private"     },
                    { label: "Department",     value: "department"  },
                    { label: "Company-wide",   value: "company"     },
                  ]}
                />
              </div>

              {/* Approval flow */}
              <div>
                <Label htmlFor="approval-flow">Default Approval Flow</Label>
                <Select
                  id="approval-flow"
                  value={approvalFlow}
                  onChange={setApprovalFlow}
                  options={[
                    { label: "Single Approver",    value: "single" },
                    { label: "Multi-step Approval", value: "multi"  },
                  ]}
                />
              </div>

              {/* Doc number format */}
              <div className="sm:col-span-2">
                <Label htmlFor="doc-format">Document Number Format</Label>
                <Input
                  id="doc-format"
                  value={docFormat}
                  onChange={setDocFormat}
                  placeholder="e.g. DOC-YYYY-####"
                />
                <p className="mt-1.5 text-[11.5px] text-zinc-400">
                  Use <span className="font-mono">YYYY</span> for year and{" "}
                  <span className="font-mono">####</span> for auto-increment number.
                </p>
              </div>
            </div>

            <CardFooter label="Save Changes" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Notifications ─────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

          {/* Left */}
          <div className="border-b border-zinc-100 px-6 py-6 lg:border-b-0 lg:border-r">
            <h3 className="text-[14px] font-semibold text-zinc-900">Notifications</h3>
            <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">
              Choose which email notifications are sent to users.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col">
            <div className="divide-y divide-zinc-100 px-6">

              <div className="py-4">
                <Toggle
                  id="notify-approval"
                  checked={notifyApproval}
                  onChange={setNotifyApproval}
                  label="Approval notifications"
                  description="Send an email when a document is approved."
                />
              </div>

              <div className="py-4">
                <Toggle
                  id="notify-reject"
                  checked={notifyReject}
                  onChange={setNotifyReject}
                  label="Rejection notifications"
                  description="Send an email when a document is rejected."
                />
              </div>

              <div className="py-4">
                <Toggle
                  id="notify-deadline"
                  checked={notifyDeadline}
                  onChange={setNotifyDeadline}
                  label="Deadline reminders"
                  description="Remind approvers 24 hours before a document deadline."
                />
              </div>

              <div className="py-4">
                <Toggle
                  id="notify-summary"
                  checked={notifySummary}
                  onChange={setNotifySummary}
                  label="Daily summary email"
                  description="Send a daily digest of pending approvals each morning."
                />
              </div>
            </div>

            <CardFooter label="Save Notification Settings" />
          </div>
        </div>
      </div>

      {/* ── Section 3: Security ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

          {/* Left */}
          <div className="border-b border-zinc-100 px-6 py-6 lg:border-b-0 lg:border-r">
            <h3 className="text-[14px] font-semibold text-zinc-900">Security</h3>
            <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">
              Session management, authentication, and password policy.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col">
            <div className="space-y-5 px-6 py-6">

              {/* Session timeout */}
              <div>
                <Label htmlFor="session-timeout">Session Timeout</Label>
                <div className="flex items-center gap-3">
                  <Select
                    id="session-timeout"
                    value={sessionTimeout}
                    onChange={setSessionTimeout}
                    options={[
                      { label: "15 minutes", value: "15" },
                      { label: "30 minutes", value: "30" },
                      { label: "60 minutes", value: "60" },
                    ]}
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] text-zinc-400">
                  Users will be signed out after this period of inactivity.
                </p>
              </div>

              {/* 2FA toggle */}
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                <Toggle
                  id="two-factor"
                  checked={twoFactor}
                  onChange={setTwoFactor}
                  label="Two-Factor Authentication"
                  description="Require all users to verify their identity with a second factor when signing in."
                />
              </div>

              {/* Min password length */}
              <div>
                <Label htmlFor="min-pw">Password Minimum Length</Label>
                <div className="flex items-center gap-3">
                  <NumberInput
                    id="min-pw"
                    value={minPwLength}
                    onChange={setMinPwLength}
                    min={6}
                    max={32}
                  />
                  <span className="text-[12.5px] text-zinc-400">characters</span>
                </div>
                <p className="mt-1.5 text-[11.5px] text-zinc-400">
                  Minimum 6, maximum 32 characters.
                </p>
              </div>
            </div>

            <CardFooter label="Save Security Settings" />
          </div>
        </div>
      </div>

      </div>
    </RoleGuard>
  );
}
