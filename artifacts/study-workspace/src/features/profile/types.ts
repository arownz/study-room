export interface ConnectedAccount {
  providerId: string;
  accountId: string;
  scope: string | null;
  createdAt: string;
  updatedAt: string;
}

export const USER_ROLES = [
  "student",
  "teacher",
  "researcher",
  "professional",
  "self_learner",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserRoleOption {
  id: UserRole;
  label: string;
  description: string;
}

export const USER_ROLE_OPTIONS: UserRoleOption[] = [
  {
    id: "student",
    label: "Student",
    description: "School, university or bootcamp learner.",
  },
  {
    id: "teacher",
    label: "Teacher / Tutor",
    description: "Teach classes, run study groups or coach learners.",
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Academic, scientific or applied research work.",
  },
  {
    id: "professional",
    label: "Working Professional",
    description: "Studying for work, certifications or skills growth.",
  },
  {
    id: "self_learner",
    label: "Self-Learner",
    description: "Pursuing personal interests and lifelong learning.",
  },
];

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole | string;
  roleSelected: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  accounts: ConnectedAccount[];
}

export interface ProfileUpdateInput {
  name?: string;
  avatar?: string | null;
  role?: UserRole;
  roleSelected?: boolean;
}

export interface ParsedName {
  firstName: string;
  lastName: string;
}

export function splitFullName(fullName: string): ParsedName {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function joinName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function getInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return fallback;
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || fallback;
}

export function isProviderConnected(
  accounts: ConnectedAccount[] | undefined,
  providerId: string,
): boolean {
  return Boolean(accounts?.some((account) => account.providerId === providerId));
}

export function findProviderAccount(
  accounts: ConnectedAccount[] | undefined,
  providerId: string,
): ConnectedAccount | undefined {
  return accounts?.find((account) => account.providerId === providerId);
}
