'use client';

import React, { useState } from 'react';
import {
  Play,
  Copy,
  Download,
  Check,
  Server,
  Globe,
  Code2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Send,
  Loader2,
  Cpu,
} from 'lucide-react';
import { type OpenApiSpec, executeSandboxedEndpoint } from '@/libs/swagger.service';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

export interface SwaggerParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie' | string;
  required?: boolean;
  schema?: { type?: string };
  description?: string;
}

export interface SwaggerOperation {
  summary?: string;
  description?: string;
  parameters?: SwaggerParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<
      string,
      {
        schema?: {
          type?: string;
          example?: unknown;
        };
      }
    >;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<
        string,
        {
          schema?: {
            example?: unknown;
          };
        }
      >;
    }
  >;
}

interface SwaggerPlaygroundProps {
  spec: OpenApiSpec;
  code?: string;
}

export default function SwaggerPlayground({ spec, code }: SwaggerPlaygroundProps) {
  const [copied, setCopied] = useState(false);
  const initialUrl = (spec.servers?.[0]?.url && !spec.servers[0].url.includes(':3000'))
    ? spec.servers[0].url
    : 'http://localhost:5000';
  const [targetServer, setTargetServer] = useState(initialUrl);
  const [openEndpoints, setOpenEndpoints] = useState<Record<string, boolean>>({});
  
  // Mode: 'sandbox' (runs code in APILens VM sandbox) vs 'live' (calls external server)
  const [testMode, setTestMode] = useState<'sandbox' | 'live'>('sandbox');

  // Interactive testing state per path+method key
  const [testInputs, setTestInputs] = useState<Record<string, { headers: string; body: string; query: string }>>({});
  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        status?: number;
        data?: unknown;
        timeMs?: number;
        error?: string;
        engine?: string;
        loading?: boolean;
      }
    >
  >({});

  const toggleEndpoint = (key: string) => {
    setOpenEndpoints((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopySpec = () => {
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec.info?.title || 'swagger-spec'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInputChange = (key: string, field: 'headers' | 'body' | 'query', value: string) => {
    setTestInputs((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { headers: '', body: '', query: '' }),
        [field]: value,
      },
    }));
  };

  const executeApiTest = async (path: string, method: string, key: string, defaultBody?: unknown) => {
    setTestResults((prev) => ({ ...prev, [key]: { loading: true } }));
    const startTime = performance.now();

    const input = testInputs[key] || { headers: '', body: defaultBody ? JSON.stringify(defaultBody, null, 2) : '', query: '' };

    // Mode 1: Sandboxed Real Execution Engine (APILens Backend VM)
    if (testMode === 'sandbox') {
      try {
        let parsedBody: unknown = undefined;
        if (input.body) {
          try {
            parsedBody = JSON.parse(input.body);
          } catch {
            parsedBody = input.body;
          }
        } else if (defaultBody) {
          parsedBody = defaultBody;
        }

        let parsedHeaders: Record<string, string> = {};
        if (input.headers) {
          try {
            parsedHeaders = JSON.parse(input.headers);
          } catch {
            // Ignore header parse error
          }
        }

        const res = await executeSandboxedEndpoint({
          code,
          method,
          path,
          body: parsedBody,
          headers: parsedHeaders,
        });

        setTestResults((prev) => ({
          ...prev,
          [key]: {
            status: res.status,
            data: res.body,
            timeMs: res.executionTimeMs,
            engine: res.engine,
            loading: false,
          },
        }));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Sandboxed execution failed';
        setTestResults((prev) => ({
          ...prev,
          [key]: {
            status: 500,
            error: errorMessage,
            timeMs: Math.round(performance.now() - startTime),
            engine: 'APILens Ephemeral Sandbox (Error)',
            loading: false,
          },
        }));
      }
      return;
    }

    // Mode 2: Live External Target Server Execution
    try {
      let fullUrl = `${targetServer.replace(/\/$/, '')}${path}`;

      if (input.query) {
        const queryParams = new URLSearchParams(input.query).toString();
        if (queryParams) {
          fullUrl += `?${queryParams}`;
        }
      }

      let parsedHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (input.headers) {
        try {
          parsedHeaders = { ...parsedHeaders, ...JSON.parse(input.headers) };
        } catch {
          // Ignore invalid header json
        }
      }

      const options: RequestInit = {
        method: method.toUpperCase(),
        headers: parsedHeaders,
      };

      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && input.body) {
        options.body = input.body;
      }

      const response = await fetch(fullUrl, options);
      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      let responseData: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      setTestResults((prev) => ({
        ...prev,
        [key]: {
          status: response.status,
          data: responseData,
          timeMs,
          engine: 'External Target Server',
          loading: false,
        },
      }));
    } catch (err: unknown) {
      const endTime = performance.now();
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to target server';
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          status: 0,
          error: `${errorMessage}. (Đảm bảo server của Repo bạn đang khởi chạy ở cổng ${targetServer}, hoặc chọn chế độ '⚡ Sandboxed Execution' bên trên để test trực tiếp trong bộ nhớ).`,
          timeMs: Math.round(endTime - startTime),
          engine: 'External Target Server (Connection Error)',
          loading: false,
        },
      }));
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toLowerCase()) {
      case 'get':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'post':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'put':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'delete':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const paths = Object.entries(spec.paths || {});

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl text-slate-100 space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{spec.info?.title || 'API Spec'}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> OpenAPI {spec.openapi}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{spec.info?.description || ''}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySpec}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied JSON' : 'Copy Spec'}
          </button>
          <button
            type="button"
            onClick={handleDownloadSpec}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Spec
          </button>
        </div>
      </div>

      {/* Target Server Config */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        <Server className="w-5 h-5 text-amber-400 shrink-0" />
        <span className="text-xs font-medium text-slate-400 shrink-0">Target Server URL:</span>
        <input
          type="text"
          value={targetServer}
          onChange={(e) => setTargetServer(e.target.value)}
          placeholder="http://localhost:5000"
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
        />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTargetServer('http://localhost:5000')}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              targetServer === 'http://localhost:5000'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            :5000
          </button>
          <button
            type="button"
            onClick={() => setTargetServer('http://localhost:5000/api/v1')}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              targetServer === 'http://localhost:5000/api/v1'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            /api/v1
          </button>
        </div>
        <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
          <Globe className="w-3.5 h-3.5" /> Client Sandbox
        </span>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {paths.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">No endpoints found in specification.</div>
        ) : (
          paths.flatMap(([pathStr, methodsObj]) => {
            if (!methodsObj || typeof methodsObj !== 'object') return [];
            
            return Object.entries(methodsObj)
              .filter(([methodKey]) => HTTP_METHODS.has(methodKey.toLowerCase()))
              .map(([methodStr, rawOp]) => {
                const op = rawOp as SwaggerOperation;
                const key = `${methodStr}:${pathStr}`;
                const isOpen = !!openEndpoints[key];
                const testResult = testResults[key];
                const defaultBody = op.requestBody?.content?.['application/json']?.schema?.example;

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all"
                  >
                    {/* Endpoint Header Button */}
                    <button
                      type="button"
                      onClick={() => toggleEndpoint(key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getMethodBadgeClass(
                            methodStr
                          )}`}
                        >
                          {methodStr}
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-200">{pathStr}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">{op.summary || ''}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Expanded Endpoint Playground */}
                    {isOpen && (
                      <div className="p-4 border-t border-slate-800 bg-slate-900/60 space-y-4 text-xs">
                        {/* Description */}
                        <p className="text-slate-300">{op.description || op.summary || ''}</p>

                        {/* Parameters Table */}
                        {op.parameters && op.parameters.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-slate-400 flex items-center gap-1.5">
                              <Code2 className="w-4 h-4" /> Parameters
                            </h4>
                            <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                                  <tr>
                                    <th className="p-2.5">Name</th>
                                    <th className="p-2.5">In</th>
                                    <th className="p-2.5">Type</th>
                                    <th className="p-2.5">Required</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                  {op.parameters.map((p, idx) => (
                                    <tr key={idx}>
                                      <td className="p-2.5 font-mono text-amber-400">{p.name}</td>
                                      <td className="p-2.5 text-slate-400">{p.in}</td>
                                      <td className="p-2.5 text-slate-400">{p.schema?.type || 'string'}</td>
                                      <td className="p-2.5">
                                        {p.required ? (
                                          <span className="text-rose-400 font-medium">Yes</span>
                                        ) : (
                                          <span className="text-slate-500">No</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Interactive Try It Out Form */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-amber-400 flex items-center gap-1.5">
                                <Play className="w-4 h-4 fill-current" /> Execution Engine:
                              </h4>
                              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setTestMode('sandbox')}
                                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                    testMode === 'sandbox' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <Cpu className="w-3 h-3 text-amber-400" />
                                  ⚡ APILens Sandbox VM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTestMode('live')}
                                  className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                                    testMode === 'live' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  🌐 External Live Server
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => executeApiTest(pathStr, methodStr, key, defaultBody)}
                              disabled={testResult?.loading}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
                            >
                              {testResult?.loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              Execute Code Real
                            </button>
                          </div>

                          {/* Request Body Input if POST/PUT */}
                          {['post', 'put', 'patch'].includes(methodStr.toLowerCase()) && (
                            <div className="space-y-1">
                              <label className="text-slate-400 font-medium">Request Body (JSON):</label>
                              <textarea
                                rows={4}
                                placeholder={defaultBody ? JSON.stringify(defaultBody, null, 2) : '{\n  "key": "value"\n}'}
                                value={testInputs[key]?.body ?? (defaultBody ? JSON.stringify(defaultBody, null, 2) : '')}
                                onChange={(e) => handleInputChange(key, 'body', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          )}

                          {/* Custom Headers Input */}
                          <div className="space-y-1">
                            <label className="text-slate-400 font-medium">Custom Headers (JSON optional):</label>
                            <input
                              type="text"
                              placeholder='{"Authorization": "Bearer token"}'
                              value={testInputs[key]?.headers || ''}
                              onChange={(e) => handleInputChange(key, 'headers', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Response View */}
                          {testResult && !testResult.loading && (
                            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-400">Response Status:</span>
                                  {testResult.engine && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                      <Cpu className="w-3 h-3" /> {testResult.engine}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400">{testResult.timeMs} ms</span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-md font-mono font-bold ${
                                      testResult.status && testResult.status >= 200 && testResult.status < 300
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}
                                  >
                                    {testResult.status || 'ERROR'}
                                  </span>
                                </div>
                              </div>

                              {testResult.error ? (
                                <p className="text-rose-400 font-mono text-xs leading-relaxed">{testResult.error}</p>
                              ) : (
                                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-60">
                                  {typeof testResult.data === 'string'
                                    ? testResult.data
                                    : JSON.stringify(testResult.data, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
          })
        )}
      </div>
    </div>
  );
}

export { SwaggerPlayground };
