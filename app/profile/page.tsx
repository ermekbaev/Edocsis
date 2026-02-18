"use client";

import { useState } from "react";

// ─── Mock user ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  fullName:   "Adil Kaliyev",
  email:      "a.kaliyev@edocsis.com",
  role:       "ADMIN",
  department: "Product",
  phone:      "+7 701 234 5678",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  return off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[12.5px] font-medium text-zinc-700 mb-1.5">
      {children}
    </label>
  );
}

function Input({
  id, type = "text", value, onChange, placeholder, disabled, readOnly,
}: {
  id: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400
        focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        read-only:bg-zinc-100 read-only:text-zinc-500 read-only:cursor-default read-only:focus:border-zinc-200"
    />
  );
}

function PasswordInput({
  id, value, onChange, placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-9 text-[13px] text-zinc-900 placeholder:text-zinc-400
          focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-zinc-400 hover:text-zinc-600 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <EyeIcon off={show} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  // ── Personal info state ──
  const [fullName,   setFullName]   = useState(MOCK_USER.fullName);
  const [email,      setEmail]      = useState(MOCK_USER.email);
  const [department, setDepartment] = useState(MOCK_USER.department);
  const [phone,      setPhone]      = useState(MOCK_USER.phone);

  // ── Password state ──
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");

  const pwValid =
    currentPw.length > 0 &&
    newPw.length >= 8 &&
    newPw === confirmPw;

  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw;

  // Initials for avatar
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-260 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          My Profile
        </h2>
        <p className="mt-1 text-[14px] text-zinc-500">
          Manage your personal information.
        </p>
      </div>

      {/* ── Section 1: Personal Information ─────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

          {/* ── Left: section label + avatar ── */}
          <div className="flex flex-col gap-5 border-b border-zinc-100 px-6 py-6 lg:border-b-0 lg:border-r">
            <div>
              <h3 className="text-[14px] font-semibold text-zinc-900">
                Personal Information
              </h3>
              <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">
                Update your name, contact details, and department.
              </p>
            </div>

            {/* Avatar + upload */}
            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xl font-semibold text-white select-none">
                {initials}
              </div>
              <div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[12.5px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300"
                >
                  <CameraIcon />
                  Upload Photo
                </button>
                <p className="mt-1.5 text-[11.5px] text-zinc-400">
                  JPG, PNG or WebP. Max 2 MB.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: form fields ── */}
          <div className="flex flex-col">
            <div className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2">

              {/* Full Name */}
              <div>
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="profile-email">Email Address</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@company.com"
                />
              </div>

              {/* Role — read-only */}
              <div>
                <Label htmlFor="profile-role">Role</Label>
                <div className="flex h-9 items-center">
                  <span className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-0.5 text-[11px] font-semibold text-white">
                    {MOCK_USER.role}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Role is managed by your administrator.
                </p>
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="profile-dept">
                  Department{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </Label>
                <Input
                  id="profile-dept"
                  value={department}
                  onChange={setDepartment}
                  placeholder="e.g. Engineering"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="profile-phone">
                  Phone{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            {/* Card footer */}
            <div className="mt-auto flex items-center justify-end border-t border-zinc-100 bg-zinc-50 px-6 py-4 rounded-br-xl">
              <button
                type="button"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Security ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

          {/* ── Left: section label ── */}
          <div className="border-b border-zinc-100 px-6 py-6 lg:border-b-0 lg:border-r">
            <h3 className="text-[14px] font-semibold text-zinc-900">Security</h3>
            <p className="mt-1 text-[12.5px] text-zinc-400 leading-relaxed">
              Update your password. Use at least 8 characters.
            </p>
          </div>

          {/* ── Right: password fields ── */}
          <div className="flex flex-col">
            <div className="space-y-4 px-6 py-6">

              {/* Current password */}
              <div className="max-w-sm">
                <Label htmlFor="pw-current">Current Password</Label>
                <PasswordInput
                  id="pw-current"
                  value={currentPw}
                  onChange={setCurrentPw}
                  placeholder="Enter current password"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* New password */}
                <div>
                  <Label htmlFor="pw-new">New Password</Label>
                  <PasswordInput
                    id="pw-new"
                    value={newPw}
                    onChange={setNewPw}
                    placeholder="Min. 8 characters"
                  />
                  {newPw.length > 0 && newPw.length < 8 && (
                    <p className="mt-1.5 text-[11.5px] text-amber-600">
                      Password must be at least 8 characters.
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <Label htmlFor="pw-confirm">Confirm New Password</Label>
                  <PasswordInput
                    id="pw-confirm"
                    value={confirmPw}
                    onChange={setConfirmPw}
                    placeholder="Repeat new password"
                  />
                  {pwMismatch && (
                    <p className="mt-1.5 text-[11.5px] text-rose-600">
                      Passwords do not match.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card footer */}
            <div className="mt-auto flex items-center justify-end border-t border-zinc-100 bg-zinc-50 px-6 py-4 rounded-br-xl">
              <button
                type="button"
                disabled={!pwValid}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
