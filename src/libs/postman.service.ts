import { type OpenApiSpec } from './swagger.service';

/**
 * Converts OpenAPI 3.0 Specification into Postman Collection v2.1.0 JSON format.
 */
export const convertOpenApiToPostman = (openApiSpec: OpenApiSpec) => {
  const title = openApiSpec.info?.title || 'APILens Collection';
  const description = openApiSpec.info?.description || 'Exported from APILens OpenAPI 3.0 Spec';

  const items: Array<{
    name: string;
    request: {
      method: string;
      header: Array<{ key: string; value: string; type: string }>;
      url: {
        raw: string;
        host: string[];
        path: string[];
      };
      description?: string;
      body?: {
        mode: string;
        raw: string;
        options: { raw: { language: string } };
      };
    };
    response: Array<Record<string, unknown>>;
  }> = [];

  const paths = openApiSpec.paths || {};

  Object.entries(paths).forEach(([pathStr, methodsObj]) => {
    if (!methodsObj || typeof methodsObj !== 'object') return;

    Object.entries(methodsObj).forEach(([methodStr, op]) => {
      const methodUpper = methodStr.toUpperCase();
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].includes(methodUpper)) return;

      const cleanPath = pathStr.replace(/{([a-zA-Z0-9_]+)}/g, ':$1');
      const pathSegments = cleanPath.split('/').filter(Boolean);

      const postmanItem = {
        name: `${methodUpper} ${pathStr} - ${op.summary || 'Endpoint'}`,
        request: {
          method: methodUpper,
          header: [
            {
              key: 'Content-Type',
              value: 'application/json',
              type: 'text',
            },
          ],
          url: {
            raw: `{{baseUrl}}${cleanPath}`,
            host: ['{{baseUrl}}'],
            path: pathSegments,
          },
          description: op.description || op.summary || '',
          body: undefined as undefined | {
            mode: string;
            raw: string;
            options: { raw: { language: string } };
          },
        },
        response: [] as Array<Record<string, unknown>>,
      };

      if (op.requestBody?.content?.['application/json']?.schema?.example) {
        postmanItem.request.body = {
          mode: 'raw',
          raw: JSON.stringify(op.requestBody.content['application/json'].schema.example, null, 2),
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      }

      if (op.responses) {
        Object.entries(op.responses).forEach(([statusCode, resObj]) => {
          const resTyped = resObj as { description?: string; content?: Record<string, { schema?: { example?: unknown } }> };
          const exampleData = resTyped?.content?.['application/json']?.schema?.example;
          postmanItem.response.push({
            name: `${statusCode} ${resTyped.description || 'Response'}`,
            originalRequest: postmanItem.request,
            status: statusCode === '201' ? 'Created' : statusCode === '200' ? 'OK' : 'Response',
            code: parseInt(statusCode, 10) || 200,
            _postman_previewlanguage: 'json',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            body: exampleData ? JSON.stringify(exampleData, null, 2) : '',
          });
        });
      }

      items.push(postmanItem);
    });
  });

  return {
    info: {
      name: title,
      description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      {
        key: 'baseUrl',
        value: openApiSpec.servers?.[0]?.url || 'http://localhost:5000',
        type: 'string',
      },
    ],
    item: items,
  };
};
