export interface AdminJobDto {
  id: string;
  slug: string;
  source: "manual" | "recman";
  externalId?: string | null;
  title: string;
  location: string;
  category?: string | null;
  trade?: string | null;
  contractType?: string | null;
  workModel?: string | null;
  salary?: string | null;
  summary?: string | null;
  description: string;
  responsibilities?: string[] | string | null;
  requirements?: string[] | string | null;
  benefits?: string[] | string | null;
  startDate?: string | null;
  applicationMethod?: "internal" | "external_url" | "email";
  applicationUrl?: string | null;
  applicationEmail?: string | null;
  status: "draft" | "active" | "closed" | "archived";
  featured?: boolean;
  publishedAt?: string | null;
  expiryDate?: string | null;
  syncStatus?: "none" | "pending" | "synced" | "error";
}

export interface AdminJobFormValues {
  title: string;
  companyName: string;
  hideCompany: boolean;
  location: string;
  category: string;
  trade: string;
  contractType: string;
  workModel: "Recruitment" | "Bemanning" | "Permanent";
  languageRequirement: string;
  salary: string;
  summary: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  startDate: string;
  applicationMethod: "internal" | "external_url" | "email";
  applicationUrl: string;
  applicationEmail: string;
  status: "draft" | "active" | "closed" | "archived";
  featured: boolean;
  expiryDate: string;
}

export const locationOptions = [
  "Oslo",
  "Bergen",
  "Trondheim",
  "Stavanger",
  "Kristiansand",
  "Tromso",
  "Alesund",
  "Drammen",
];

export const categoryOptions = [
  "Construction",
  "Electrical",
  "Welding",
  "Mechanical",
  "Transport",
  "Industry",
  "Facility Services",
];

export const typeOptions = ["Recruitment", "Bemanning", "Permanent"] as const;

export const statusOptions = ["draft", "active", "closed", "archived"] as const;
