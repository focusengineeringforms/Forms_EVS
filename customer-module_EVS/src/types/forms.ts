import type { QuestionType } from "./questionTypes";

export interface GridOption {
  rows: string[];
  columns: string[];
}

export interface ShowWhen {
  questionId: string;
  value: string | number;
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  nextSectionId?: string;
  questions: FollowUpQuestion[];
  isSubsection?: boolean;
  parentSectionId?: string;
  weightage?: number;
  merging?: string;
  followUpConfig?: Record<
    string,
    {
      hasFollowUp: boolean;
      required: boolean;
      linkedSectionId?: string;
      linkedFormId?: string;
      goToSection?: string;
    }
  >;
}

export interface FollowUpQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
  allowedFileTypes?: string[];
  gridOptions?: GridOption;
  min?: number;
  max?: number;
  step?: number;
  showWhen?: ShowWhen;
  parentId?: string;
  imageUrl?: string;
  description?: string;
  sectionId?: string;
  subParam1?: string;
  subParam2?: string;
  followUpQuestions?: FollowUpQuestion[];
  branchingRules?: Array<{
    optionLabel: string;
    targetSectionId: string;
    isOtherOption?: boolean;
  }>;
  followUpConfig?: Record<
    string,
    {
      hasFollowUp: boolean;
      required: boolean;
      linkedFormId?: string;
      linkedSectionId?: string;
      goToSection?: string;
    }
  >;
}

export interface Question {
  id: string;
  _id?: string;
  title: string;
  description: string;
  logoUrl?: string;
  imageUrl?: string;
  sections: Section[];
  followUpQuestions: FollowUpQuestion[];
  followUpSections?: Section[];
  followUpForms?: Array<{
    _id: string;
    id: string;
    title: string;
    description?: string;
    linkedTo?: string;
  }>;
  parentFormId?: string;
  parentFormTitle?: string;
  locationEnabled?: boolean;
}

export interface Response {
  id: string;
  questionId: string;
  answers: Record<string, any>;
  timestamp?: string;
  fallbackTimestamp?: string;
  parentResponseId?: string;
  inviteId?: string;
  assignedTo?: string;
  assignedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  status?: "pending" | "verified" | "rejected";
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source?: "browser" | "ip" | "manual" | "unknown";
    capturedAt?: string;
    displayName?: string;
  };
  submissionMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    browser?: string;
    device?: string;
    os?: string;
    location?: {
      country?: string;
      countryCode?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      timezone?: string;
      isp?: string;
    };
    capturedLocation?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      source?: "browser" | "ip" | "manual" | "unknown";
      capturedAt?: string;
    };
    submittedAt?: string;
  };
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  avatar?: string;
  userId: string;
  username?: string;
}
