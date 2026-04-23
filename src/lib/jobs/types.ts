export type JobSource = "manual" | "recman" | "employer_board";

export type EmployerBoardMeta = {
  mappedJobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  listingStatus?: "draft" | "live" | "closed" | "archived";
  hours: string | null;
  rotation: string | null;
  licenseRequired: boolean;
  housingProvided: boolean;
  travelPaid: boolean;
  experienceYearsMin: number | null;
  category: string | null;
};
export type JobSyncStatus = "none" | "pending" | "synced" | "error";
export type JobStatus = "draft" | "active" | "closed" | "archived";
export type JobApplyMethod = "internal" | "external_url" | "email";

export interface JobRecord {
  id: string;
  source: JobSource;
  employerJobId?: string | null;
  employerBoardMeta?: EmployerBoardMeta | null;
  externalId?: string | null;
  title: string;
  slug: string;
  companyName?: string | null;
  hideCompany?: boolean;
  location: string;
  category?: string | null;
  trade?: string | null;
  contractType?: string | null;
  workModel?: string | null;
  languageRequirement?: string | null;
  salary?: string | null;
  summary?: string | null;
  description: string;
  responsibilities?: string[] | string | null;
  requirements?: string[] | string | null;
  benefits?: string[] | string | null;
  startDate?: string | null;
  applicationMethod?: JobApplyMethod;
  applicationUrl?: string | null;
  applicationEmail?: string | null;
  status: JobStatus;
  featured?: boolean;
  publishedAt?: string | null;
  expiryDate?: string | null;
  applicationCount?: number;
  syncStatus?: JobSyncStatus;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Public URL for employer board hero image (Supabase Storage). */
  imageMain?: string | null;
  /** Up to four gallery URLs in slot order (empty strings allowed between slots). */
  imageGallery?: string[] | null;
  /** Total public job detail views (employer board jobs). */
  viewCount?: number | null;
}

export interface JobFilters {
  keyword: string;
  city: string;
  category: string;
  trade: string;
  contractType: string;
  workModel: string;
  languageRequirement: string;
  sortBy: "newest" | "relevance";
}

export interface JobFilterOptions {
  cities: string[];
  categories: string[];
  trades: string[];
  contractTypes: string[];
  workModels: string[];
  languageRequirements: string[];
}

export interface AdminJobsFilters {
  query?: string;
  source?: "all" | JobSource;
  status?: "all" | JobStatus;
  location?: string;
  category?: string;
}
