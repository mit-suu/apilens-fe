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
        security?: Array<Record<string, string[]>>;
      }
    >
  >;
};

export const generateSwaggerSpec = async (payload: {
  analysisId?: string;
  code?: string;
  endpoints?: Array<{ method?: string; path?: string; description?: string }>;
  serverUrl?: string;
  repoFullName?: string;
  branch?: string;
  filePath?: string;
}) => {
  const { data } = await http.post<{ success: boolean; spec: OpenApiSpec }>(
    '/swagger/generate',
    payload
  );
  return data.spec;
};

export const exportPostmanCollection = async (spec: OpenApiSpec) => {
  const { data } = await http.post<{ success: boolean; collection: Record<string, unknown> }>(
    '/swagger/export/postman',
    { spec }
  );
  return data.collection;
};
