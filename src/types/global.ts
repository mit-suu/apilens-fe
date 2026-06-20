export type AuthUser = {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  providers: {
    github: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type Repository = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  updatedAt: string;
};

export type Branch = {
  name: string;
  protected: boolean;
  sha?: string;
};

export type DetectedFile = {
  path: string;
  type: 'file';
  detectedAs: 'openapi' | 'postman' | 'express';
  size: number;
};

export type RepositoryTree = {
  repoFullName?: string;
  branch: string;
  totalFiles: number;
  detectedFiles: DetectedFile[];
  grouped: {
    openapi: DetectedFile[];
    postman: DetectedFile[];
    express: DetectedFile[];
  };
  warnings: string[];
};

export type RepositoryScanResult = RepositoryTree & {
  repository: Repository;
  repoFullName: string;
  endpoints: Endpoint[];
  filesScanned: number;
};

export type Endpoint = {
  method?: string;
  path?: string;
  sourceFile?: string;
  lineNumber?: number;
};

export type Smell = {
  ruleId?: string;
  smellName: string;
  severity: 'Critical' | 'Medium' | 'Low';
  category?: string;
  endpoints: string[];
  lineNumbers: number[];
  description: string;
  suggestion?: string;
};

export type Analysis = {
  _id: string;
  repoFullName: string;
  branch: string;
  filePath: string;
  fileType?: 'openapi' | 'postman' | 'express';
  status: 'pending' | 'done' | 'failed';
  score: number;
  endpointCount: number;
  smellCount: number;
  severitySummary: {
    critical: number;
    medium: number;
    low: number;
  };
  categoryScores?: Record<string, number>;
  endpoints: Endpoint[];
  smells: Smell[];
  warnings: string[];
  aiSuggestion: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};
