import http from './axios';
import {
  type Analysis,
  type AuthUser,
  type Branch,
  type Repository,
  type RepositoryScanResult,
  type RepositoryTree,
} from '@/types/global';

export const getCurrentUser = async () => {
  const { data } = await http.get<{ user: AuthUser }>('/auth/me');

  return data.user;
};

export const listRepositories = async () => {
  const { data } = await http.get<{
    repositories: Repository[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>('/repos', {
    params: {
      limit: 100,
    },
  });

  return data.repositories;
};

export const listBranches = async (owner: string, repo: string) => {
  const { data } = await http.get<{ branches: Branch[] }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`
  );

  return data.branches;
};

export const getRepositoryTree = async (
  owner: string,
  repo: string,
  branch: string
) => {
  const { data } = await http.get<RepositoryTree>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree`,
    {
      params: {
        branch,
      },
    }
  );

  return data;
};

export const scanRepositoryUrl = async (payload: {
  repoUrl: string;
  branch?: string;
}) => {
  const { data } = await http.post<RepositoryScanResult>('/repos/scan', payload);

  return data;
};

export const createAnalysis = async (payload: {
  repoFullName: string;
  branch: string;
  filePath: string;
  fileType?: string;
}) => {
  const { data } = await http.post<{ analysis: Analysis }>('/analyses', payload);

  return data.analysis;
};

export const listMyAnalyses = async (params?: {
  page?: number;
  limit?: number;
  repoFullName?: string;
  branch?: string;
}) => {
  const { data } = await http.get<{ analyses: Analysis[] }>('/analyses/me', {
    params: {
      page: params?.page,
      limit: params?.limit,
      repoFullName: params?.repoFullName || undefined,
      branch: params?.branch || undefined,
    },
  });

  return data.analyses;
};

export const getAnalysis = async (analysisId: string) => {
  const { data } = await http.get<{ analysis: Analysis }>(
    `/analyses/${analysisId}`
  );

  return data.analysis;
};

export const rerunAnalysis = async (analysisId: string) => {
  const { data } = await http.post<{ analysis: Analysis }>(
    `/analyses/${analysisId}/rerun`
  );

  return data.analysis;
};

export const exportAnalysisReport = async (
  analysisId: string,
  format: 'pdf' | 'json'
) => {
  const response = await http.get<Blob>(`/analyses/${analysisId}/export`, {
    params: {
      format,
    },
    responseType: 'blob',
  });
  const disposition = response.headers['content-disposition'];
  const fileName = /filename="?([^"]+)"?/i.exec(disposition || '')?.[1];

  return {
    blob: response.data,
    fileName: fileName || `apilens-report.${format}`,
  };
};

export const generateAiFix = async (analysisId: string, smellIndex: number) => {
  const { data } = await http.post<{
    success: boolean;
    originalContent: string;
    fixedContent: string;
    filePath: string;
    smellIndex: number;
  }>(`/analyses/${analysisId}/generate-fix`, {
    smellIndex,
  });

  return data;
};

export const createPullRequest = async (
  analysisId: string,
  smellIndex: number,
  fixedContent: string
) => {
  const { data } = await http.post<{
    success: boolean;
    pullRequestUrl: string;
    branch: string;
  }>(`/analyses/${analysisId}/create-pr`, {
    smellIndex,
    fixedContent,
  });

  return data;
};

export type Order = {
  _id: string;
  userId: string;
  plan: 'pro' | 'enterprise';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentOrderId?: string;
  paymentReferenceCode?: string;
  paymentDescription?: string;
  qrCodeUrl?: string;
  paidAt?: string;
  createdAt: string;
};

export const createCheckoutOrder = async (plan: 'pro' | 'enterprise') => {
  const { data } = await http.post<{ success: boolean; order: Order }>('/orders/checkout', { plan });
  return data.order;
};

export const getOrderStatus = async (orderId: string) => {
  const { data } = await http.get<{ success: boolean; order: Order }>(`/orders/${orderId}/status`);
  return data.order;
};

export const getMyOrders = async () => {
  const { data } = await http.get<{ success: boolean; orders: Order[] }>('/orders/my-orders');
  return data.orders;
};

export const getAdminStats = async () => {
  const { data } = await http.get<{
    success: boolean;
    stats: {
      totalUsers: number;
      totalAnalyses: number;
      totalIssues: number;
      averageScore: number;
      totalRevenue: number;
      paidOrdersCount: number;
      totalAiRequests: number;
      estimatedTokens: number;
      estimatedCostUsd: number;
    };
  }>('/admin/stats');
  return data.stats;
};

export const getAdminUsers = async () => {
  const { data } = await http.get<{ success: boolean; users: AuthUser[] }>('/admin/users');
  return data.users;
};

export const updateAdminUser = async (userId: string, payload: { role?: string; plan?: string }) => {
  const { data } = await http.put<{ success: boolean; user: AuthUser }>(`/admin/users/${userId}`, payload);
  return data.user;
};

export const deleteAdminUser = async (userId: string) => {
  const { data } = await http.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`);
  return data;
};
