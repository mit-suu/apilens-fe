import http from './axios';

export type OpenApiSpec = {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<
    string,
    Record<
      string,
      {
        summary?: string;
        description?: string;
        parameters?: Array<{
          name: string;
          in: 'path' | 'query' | 'header';
          required?: boolean;
          schema?: { type: string };
          description?: string;
        }>;
        requestBody?: {
          required?: boolean;
          content?: {
            'application/json'?: {
              schema?: {
                type: string;
                example?: Record<string, unknown>;
              };
            };
          };
        };
        responses?: Record<string, { description?: string; content?: Record<string, unknown> }>;
      }
    >
  >;
};

export type ExecutionResult = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  executionTimeMs: number;
  engine: string;
};

export const generateSwaggerSpec = async (payload: {
  analysisId?: string;
  code?: string;
  endpoints?: Array<{ method?: string; path?: string; description?: string }>;
  serverUrl?: string;
}) => {
  const { data } = await http.post<{ success: boolean; spec: OpenApiSpec }>(
    '/swagger/generate',
    payload
  );
  return data.spec;
};

export const executeSandboxedEndpoint = async (payload: {
  code?: string;
  method: string;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}) => {
  const { data } = await http.post<{ success: boolean; result: ExecutionResult }>(
    '/swagger/execute',
    payload
  );
  return data.result;
};
