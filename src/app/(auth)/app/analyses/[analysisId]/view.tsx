'use client';

import MotionScope from '@/components/MotionScope';
import UserBadge from '@/components/UserBadge';
import { exportAnalysisReport, getAnalysis, rerunAnalysis } from '@/libs/api';
import { type Analysis, type AuthUser, type Smell } from '@/types/global';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';

const severityStyle: Record<
  Smell['severity'],
  { border: string; badge: string; text: string }
> = {
  Critical: {
    border: 'border-l-[#ffb4ab]',
    badge: 'bg-[#93000a] text-[#ffdad6]',
    text: 'text-[#ffb4ab]',
  },
  Medium: {
    border: 'border-l-[#f3dfd2]',
    badge: 'bg-[#353535] text-[#f3dfd2]',
    text: 'text-[#f3dfd2]',
  },
  Low: {
    border: 'border-l-[#8e9194]',
    badge: 'bg-[#353535] text-[#c4c7ca]',
    text: 'text-[#c4c7ca]',
  },
};

const scoreColor = (score: number) => {
  if (score < 50) return '#ffb4ab';
  if (score < 80) return '#ffb400';

  return '#4ade80';
};

const getCategoryValue = (
  analysis: Analysis,
  key: string,
  fallback: number
) => {
  const value = analysis.categoryScores?.[key];

  return typeof value === 'number' ? value : fallback;
};

type ExportFormat = 'pdf' | 'json';
type ExportState = 'idle' | 'exporting' | 'done';
type SuggestionBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string; nested: boolean };

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value: string | number | undefined | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderInlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

const markdownToPdfHtml = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let listType: 'ol' | 'ul' | null = null;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const closeList = () => {
    if (!listType) return;

    html.push(`</${listType}>`);
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      closeList();

      if (inCodeBlock) {
        html.push(
          `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
        );
        codeLines = [];
      }

      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = (heading[1] ?? '').length + 2;
      html.push(
        `<h${level}>${renderInlineMarkdown(heading[2] ?? '')}</h${level}>`
      );
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }

      html.push(`<li>${renderInlineMarkdown(unordered[1] ?? '')}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }

      html.push(`<li>${renderInlineMarkdown(ordered[1] ?? '')}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  }

  closeList();

  if (inCodeBlock && codeLines.length) {
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  return html.join('\n');
};

const buildReportFileName = (analysis: Analysis, extension: ExportFormat) =>
  `${safeFileName(`${analysis.repoFullName}-${analysis.filePath}`) || 'apilens-report'}.${extension}`;

const exportAnalysisJson = (analysis: Analysis) => {
  downloadBlob(
    new Blob([JSON.stringify(analysis, null, 2)], {
      type: 'application/json;charset=utf-8',
    }),
    buildReportFileName(analysis, 'json')
  );
};

const buildPdfHtml = (analysis: Analysis) => {
  const categories = Object.entries(analysis.categoryScores || {});

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(buildReportFileName(analysis, 'pdf'))}</title>
    <style>
      body {
        margin: 0;
        background: #ffffff;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
      }

      main {
        max-width: 860px;
        margin: 0 auto;
        padding: 40px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }

      h2 {
        margin: 28px 0 12px;
        font-size: 16px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      p {
        line-height: 1.55;
      }

      .muted {
        color: #4b5563;
      }
const normalizeSuggestionText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/\s+##\s+/g, '\n## ')
    .replace(/\s+###\s+/g, '\n### ')
    .trim();

const parseSuggestionBlocks = (value: string): SuggestionBlock[] => {
  const normalized = normalizeSuggestionText(value);

  if (!normalized) return [];

  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  const blocks: SuggestionBlock[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = trimmed.match(/^#{2,3}\s+(.+)$/);
    const bullet = line.match(/^(\s*)[-*]\s+(.+)$/);

    if (heading) {
      blocks.push({
        type: 'heading',
        text: heading[1] || '',
      });
      continue;
    }

    if (bullet) {
      blocks.push({
        type: 'bullet',
        text: bullet[2] || '',
        nested: (bullet[1] || '').length > 0,
      });
      continue;
    }

    blocks.push({
      type: 'paragraph',
      text: trimmed.replace(/^#+\s*/, ''),
    });
  }

  return blocks;
};

const renderInlineText = (value: string) => {
  const parts = value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded border border-[var(--border)] bg-white/[0.055] px-1.5 py-0.5 font-mono text-xs text-white"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

function AiSuggestionMarkdown({ value }: { value: string }) {
  const blocks = parseSuggestionBlocks(value);

  if (blocks.length === 0) return null;

      .markdown {
        line-height: 1.6;
      }

      .markdown h3,
      .markdown h4,
      .markdown h5 {
        margin: 16px 0 8px;
      }

      .markdown ul,
      .markdown ol {
        margin: 8px 0 12px 22px;
        padding: 0;
      }

      .markdown li {
        margin: 5px 0;
      }

      .markdown code {
        background: #f3f4f6;
        border-radius: 4px;
        padding: 2px 4px;
        font-family: Consolas, Monaco, monospace;
        font-size: 0.9em;
      }

      .markdown pre {
        background: #111827;
        border-radius: 8px;
        color: #f9fafb;
        overflow-x: auto;
        padding: 12px;
      }

      @media print {
        main {
          padding: 24px;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="label">APILens Analysis Result</p>
      <h1>Endpoint Integrity Report</h1>
      <p class="muted">${escapeHtml(analysis.repoFullName)} · ${escapeHtml(
        analysis.branch
      )} · ${escapeHtml(analysis.filePath)}</p>

      <section class="grid">
        <div class="card"><div class="label">Score</div><div class="value">${escapeHtml(
          analysis.score
        )}</div></div>
        <div class="card"><div class="label">Endpoints</div><div class="value">${escapeHtml(
          analysis.endpointCount
        )}</div></div>
        <div class="card"><div class="label">Smells</div><div class="value">${escapeHtml(
          analysis.smellCount
        )}</div></div>
        <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(
          analysis.status
        )}</div></div>
      </section>

      ${
        categories.length
          ? `<h2>Category Scores</h2>
      <table>
        <thead><tr><th>Category</th><th>Score</th></tr></thead>
        <tbody>
          ${categories
            .map(
              ([category, score]) =>
                `<tr><td>${escapeHtml(category)}</td><td>${escapeHtml(score)}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>`
          : ''
      }

      <h2>Detected Issues</h2>
      ${
        analysis.smells.length
          ? `<table>
        <thead><tr><th>Severity</th><th>Issue</th><th>Description</th><th>Suggestion</th></tr></thead>
        <tbody>
          ${analysis.smells
            .map(
              (smell) => `<tr>
                <td class="severity">${escapeHtml(smell.severity)}</td>
                <td>${escapeHtml(smell.smellName)}</td>
                <td>${escapeHtml(smell.description)}</td>
                <td>${escapeHtml(smell.suggestion || 'No suggestion')}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>`
          : '<p>No design smells detected.</p>'
      }

      <h2>AI Remediation Plan</h2>
      <div class="markdown">${markdownToPdfHtml(
        analysis.aiSuggestion || 'No remediation plan is required.'
      )}</div>
    </main>
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;
};
  return (
    <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[#0b1017] p-4">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div
              key={`${block.type}-${block.text}-${index}`}
              className={index === 0 ? '' : 'border-t border-[var(--border)] pt-4'}
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {block.text}
              </h3>
            </div>
          );
        }

        if (block.type === 'bullet') {
          return (
            <div
              key={`${block.type}-${block.text}-${index}`}
              className={`flex gap-3 text-sm leading-6 text-[var(--muted)] ${
                block.nested ? 'ml-5' : ''
              }`}
            >
              <span className="mt-[0.65rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <p>{renderInlineText(block.text)}</p>
            </div>
          );
        }

        return (
          <p
            key={`${block.type}-${block.text}-${index}`}
            className="text-sm leading-7 text-[var(--muted)]"
          >
            {renderInlineText(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function ExportSwitch({ analysis }: { analysis: Analysis }) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [exportState, setExportState] = useState<ExportState>('idle');
  const isAnimating = exportState !== 'idle';

  const handleExport = async () => {
    if (isAnimating) return;

    setExportState('exporting');

    window.setTimeout(async () => {
      try {
        const result = await exportAnalysisReport(analysis._id, format);

        downloadBlob(result.blob, result.fileName);

        setExportState('done');
      } catch (caught) {
        setExportState('idle');
        window.alert(
          caught instanceof Error ? caught.message : 'Unable to export report.'
        );
        return;
      }

      window.setTimeout(() => setExportState('idle'), 1600);
    }, 900);
  };

  return (
    <ExportSwitchWrapper data-state={exportState}>
      <div className="export-choice" aria-label="Export format">
        {(['pdf', 'json'] as const).map((option) => (
          <button
            key={option}
            aria-pressed={format === option}
            className="format-button"
            disabled={isAnimating}
            type="button"
            onClick={() => setFormat(option)}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        className="export-label"
        disabled={isAnimating}
        type="button"
        onClick={handleExport}
      >
        <input
          checked={isAnimating}
          className="export-input"
          readOnly
          type="checkbox"
        />
        <span className="export-circle">
          <svg
            aria-hidden="true"
            className="export-icon"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 19V5m0 14-4-4m4 4 4-4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <span className="export-square" />
        </span>
        <span className="export-title">
          {exportState === 'done'
            ? 'Exported'
            : `Export ${format.toUpperCase()}`}
        </span>
        <span className="sr-only">Export report as {format.toUpperCase()}</span>
      </button>
    </ExportSwitchWrapper>
  );
}

const ExportSwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;

  .export-choice {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.04);
  }

  .format-button {
    min-width: 3rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1;
    padding: 0.625rem 0.75rem;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
  }

  .format-button:hover:not(:disabled),
  .format-button:focus-visible,
  .format-button[aria-pressed='true'] {
    background: rgba(125, 211, 252, 0.14);
    color: var(--text);
  }

  .format-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .format-button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .export-label {
    position: relative;
    display: flex;
    width: 168px;
    min-height: 48px;
    align-items: center;
    border: 2px solid rgb(91, 91, 240);
    border-radius: 999px;
    background-color: transparent;
    color: #fff;
    cursor: pointer;
    overflow: hidden;
    padding: 4px;
    transition:
      border-color 0.4s ease,
      opacity 0.2s ease,
      width 0.4s ease;
  }

  .export-label::before {
    content: '';
    position: absolute;
    inset: 0;
    width: 8px;
    height: 8px;
    margin: auto;
    border-radius: 100%;
    background-color: #fff;
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s ease;
  }

  .export-label:disabled {
    cursor: wait;
  }

  .export-input {
    display: none;
  }

  .export-title {
    position: absolute;
    right: 18px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1;
    text-align: center;
    transition: all 0.4s ease;
    white-space: nowrap;
  }

  .export-circle {
    position: relative;
    display: flex;
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 50%;
    background-color: rgb(91, 91, 240);
    box-shadow: 0 0 0 0 rgb(255, 255, 255);
    transition: all 0.4s ease;
  }

  .export-circle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    background-color: #3333a8;
    transition: all 0.4s ease;
  }

  .export-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 26px;
    color: #fff;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
  }

  .export-square {
    position: absolute;
    top: 50%;
    left: 50%;
    aspect-ratio: 1;
    width: 13px;
    border-radius: 2px;
    background-color: #fff;
    opacity: 0;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
    visibility: hidden;
  }

  &[data-state='exporting'] .export-label,
  &[data-state='done'] .export-label {
    width: 54px;
  }

  &[data-state='exporting'] .export-label::before {
    animation: exportRotate 1.9s ease-in-out 0.2s forwards;
  }

  &[data-state='exporting'] .export-circle {
    animation: exportPulse 1s forwards;
    rotate: 180deg;
  }

  &[data-state='exporting'] .export-circle::before {
    animation: exportInstalling 0.9s ease-in-out forwards;
  }

  &[data-state='exporting'] .export-icon,
  &[data-state='done'] .export-icon {
    opacity: 0;
    visibility: hidden;
  }

  &[data-state='exporting'] .export-square {
    opacity: 1;
    visibility: visible;
  }

  &[data-state='exporting'] .export-title {
    opacity: 0;
    visibility: hidden;
  }

  &[data-state='done'] .export-label {
    width: 150px;
    border-color: rgb(35, 174, 35);
  }

  &[data-state='done'] .export-circle {
    opacity: 0;
    visibility: hidden;
  }

  &[data-state='done'] .export-title {
    right: 46px;
    opacity: 1;
    visibility: visible;
  }

  @media (max-width: 640px) {
    width: 100%;
    flex-wrap: wrap;

    .export-choice,
    .export-label {
      flex: 1 1 auto;
    }

    .export-label {
      justify-content: flex-start;
      min-width: 168px;
    }
  }

  @keyframes exportPulse {
    0% {
      scale: 0.95;
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
    }

    70% {
      scale: 1;
      box-shadow: 0 0 0 16px rgba(255, 255, 255, 0);
    }

    100% {
      scale: 0.95;
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
  }

  @keyframes exportInstalling {
    from {
      height: 0;
    }

    to {
      height: 100%;
    }
  }

  @keyframes exportRotate {
    0% {
      opacity: 1;
      transform: rotate(-90deg) translate(25px) rotate(0);
      visibility: visible;
    }

    99% {
      opacity: 1;
      transform: rotate(270deg) translate(25px) rotate(270deg);
      visibility: visible;
    }

    100% {
      opacity: 0;
      visibility: hidden;
    }
  }
`;

function ScoreRing({ score }: { score: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(score, 0) / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-full w-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          fill="transparent"
          r={radius}
          stroke="#21262d"
          strokeWidth="8"
        />
        <circle
          className="score-ring"
          cx="64"
          cy="64"
          fill="transparent"
          r={radius}
          stroke={scoreColor(score)}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth="8"
        />
      </svg>
      <span className="absolute text-3xl font-semibold text-white">
        {score}
      </span>
    </div>
  );
}

function Radar({ analysis }: { analysis: Analysis }) {
  const naming = getCategoryValue(analysis, 'Naming', 70);
  const http = getCategoryValue(analysis, 'HTTP Design', 65);
  const docs = getCategoryValue(analysis, 'Documentation', 60);
  const security = getCategoryValue(analysis, 'Security', 75);
  const response = getCategoryValue(analysis, 'Response', 68);
  const points = [
    `100,${100 - naming * 0.75}`,
    `${100 + http * 0.75},100`,
    `100,${100 + docs * 0.75}`,
    `${100 - security * 0.75},100`,
  ].join(' ');

  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-[#30363d] bg-[#0e0e0e]/30 p-4">
      <svg className="h-full w-full opacity-80" viewBox="0 0 200 200">
        <polygon
          className="radar-grid"
          fill="none"
          points="100,20 180,100 100,180 20,100"
        />
        <polygon
          className="radar-grid"
          fill="none"
          points="100,40 160,100 100,160 40,100"
        />
        <polygon
          className="radar-grid"
          fill="none"
          points="100,60 140,100 100,140 60,100"
        />
        <line className="radar-grid" x1="100" x2="100" y1="20" y2="180" />
        <line className="radar-grid" x1="20" x2="180" y1="100" y2="100" />
        <polygon
          fill="rgba(255,255,255,0.1)"
          points={points}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>
      <span className="absolute top-2 text-xs text-[#8b949e]">NAMING</span>
      <span className="absolute bottom-2 text-xs text-[#8b949e]">DOCS</span>
      <span className="absolute left-2 -rotate-90 text-xs text-[#8b949e]">
        SECURITY
      </span>
      <span className="absolute right-2 rotate-90 text-xs text-[#8b949e]">
        HTTP
      </span>
      <span className="sr-only">Response score {response}</span>
    </div>
  );
}

function RemediationMarkdown({ children }: { children: string }) {
  return (
    <MarkdownContent>
      <ReactMarkdown
        components={{
          a: ({ children: linkChildren, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer">
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </MarkdownContent>
  );
}

const MarkdownContent = styled.div`
  color: var(--muted);
  font-size: 0.875rem;
  line-height: 1.75;

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }

  p {
    margin: 0.65rem 0;
  }

  h1,
  h2,
  h3,
  h4 {
    margin: 1rem 0 0.45rem;
    color: var(--text);
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1.35;
  }

  ul,
  ol {
    margin: 0.65rem 0 0.85rem;
    padding-left: 1.15rem;
  }

  ul {
    list-style: disc;
  }

  ol {
    list-style: decimal;
  }

  li {
    margin: 0.35rem 0;
    padding-left: 0.15rem;
  }

  li::marker {
    color: #7dd3fc;
  }

  strong {
    color: var(--text);
    font-weight: 700;
  }

  em {
    color: #d7dae0;
  }

  code {
    border: 1px solid var(--border);
    border-radius: 5px;
    background: rgba(125, 211, 252, 0.08);
    color: #dbeafe;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
    font-size: 0.84em;
    padding: 0.12rem 0.35rem;
  }

  pre {
    margin: 0.85rem 0;
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: #070b11;
    padding: 0.85rem;
  }

  pre code {
    border: 0;
    background: transparent;
    color: #e5e7eb;
    padding: 0;
  }

  blockquote {
    margin: 0.85rem 0;
    border-left: 2px solid #7dd3fc;
    color: #d7dae0;
    padding-left: 0.85rem;
  }

  a {
    color: #7dd3fc;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;

export default function ResultDashboard({ user }: { user: AuthUser }) {
  const params = useParams<{ analysisId: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState('');
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    if (!params.analysisId) return;

    getAnalysis(params.analysisId)
      .then((result) => {
        setAnalysis(result);
        setSelectedIndex(0);
      })
      .catch((caught) => {
        setError(
          caught instanceof Error ? caught.message : 'Unable to load result.'
        );
      });
  }, [params.analysisId]);

  const selectedSmell = useMemo(() => {
    if (!analysis?.smells.length) return null;

    return analysis.smells[selectedIndex] || analysis.smells[0] || null;
  }, [analysis, selectedIndex]);

  const handleRerun = async () => {
    if (!analysis || rerunning) return;

    setRerunning(true);
    setError('');

    try {
      const nextAnalysis = await rerunAnalysis(analysis._id);

      router.push(`/app/analyzing/${nextAnalysis._id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to rerun analysis.'
      );
      setRerunning(false);
    }
  };

  if (error) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-[var(--radius-lg)] border border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] p-5 text-[var(--danger)]">
          <p>{error}</p>
          <Link href="/app" className="mt-4 inline-block underline">
            Back to repo picker
          </Link>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-[var(--muted)]">
        <div className="glass-panel rounded-[var(--radius-lg)] p-6">
          Loading report...
        </div>
      </div>
    );
  }

  return (
    <MotionScope>
      <div className="app-shell flex min-h-screen flex-col">
        <nav className="border-b border-[var(--border)]">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                APILens
              </Link>
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white"
                  href="/app"
                >
                  Dashboard
                </Link>
                <Link
                  className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white"
                  href="/app/history"
                >
                  History
                </Link>
                <span className="rounded-full border border-[var(--border-strong)] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white">
                  Report
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/app" className="secondary-action">
                New analysis
              </Link>
              <UserBadge user={user} />
            </div>
          </div>
        </nav>

        <main className="mx-auto w-full max-w-7xl flex-grow px-5 py-8">
          <div className="motion-item mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow mb-3">Analysis result</p>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
                Endpoint Integrity Report
              </h1>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {analysis.repoFullName} · {analysis.branch} ·{' '}
                {analysis.filePath}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="secondary-action"
                disabled={rerunning}
                onClick={handleRerun}
                type="button"
              >
                {rerunning ? 'Rerunning...' : 'Rerun analysis'}
              </button>
              <ExportSwitch analysis={analysis} />
              <Link href="/app" className="primary-action">
                Analyze another repo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="glass-panel motion-item rounded-[var(--radius-lg)] p-5 lg:col-span-4">
              <div className="flex items-center gap-6">
                <ScoreRing score={analysis.score} />
                <div className="flex-grow space-y-2">
                  <div className="flex justify-between border-b border-[var(--border)] py-2">
                    <span className="text-xs uppercase text-[var(--subtle)]">
                      Endpoints
                    </span>
                    <span className="font-mono text-sm text-[var(--text)]">
                      {analysis.endpointCount}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)] py-2">
                    <span className="text-xs uppercase text-[var(--subtle)]">
                      Smells
                    </span>
                    <span className="font-mono text-sm text-[var(--text)]">
                      {analysis.smellCount}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border)] py-2">
                    <span className="text-xs uppercase text-[var(--subtle)]">
                      Status
                    </span>
                    <span className="font-mono text-xs text-[var(--text)]">
                      {analysis.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Radar analysis={analysis} />
              </div>

              <div className="mt-6 space-y-3">
                <h2 className="eyebrow">Detected Issues</h2>
                <div className="issue-scroll max-h-[400px] space-y-2 overflow-y-auto pr-1">
                  {analysis.smells.length === 0 ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                      No design smells detected. Your selected file passed the
                      current rule set.
                    </div>
                  ) : null}

                  {analysis.smells.map((smell, index) => {
                    const style = severityStyle[smell.severity];

                    return (
                      <button
                        key={`${smell.ruleId}-${index}`}
                        aria-pressed={selectedIndex === index}
                        className={`w-full rounded-[var(--radius-md)] border border-l-2 border-[var(--border)] bg-white/[0.035] p-4 text-left transition hover:border-[var(--border-strong)] hover:bg-white/[0.055] ${style.border} ${
                          selectedIndex === index ? 'ring-1 ring-white/20' : ''
                        }`}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                      >
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <span className="text-lg font-medium text-white">
                            {smell.smellName}
                          </span>
                          <span
                            className={`rounded px-1 py-[2px] text-xs ${style.badge}`}
                          >
                            {smell.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-[#c4c7ca]">
                          {smell.endpoints[0] || analysis.filePath}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="motion-item space-y-5 lg:col-span-8">
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[#0b1017]">
                <div className="flex items-center justify-between border-b border-[var(--border)] bg-white/[0.035] px-4 py-3">
                  <span className="text-xs uppercase tracking-widest text-[var(--subtle)]">
                    Trace Logs : {analysis.filePath}
                  </span>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--danger)]" />
                    <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                    <div className="h-2 w-2 rounded-full bg-[var(--border-strong)]" />
                  </div>
                </div>
                <div className="space-y-1 overflow-x-auto p-4 font-mono text-sm leading-6">
                  {analysis.endpoints.slice(0, 12).map((endpoint, index) => {
                    const active = selectedSmell?.endpoints.includes(
                      `${endpoint.method || ''} ${endpoint.path || ''}`.trim()
                    );

                    return (
                      <div
                        key={`${endpoint.method}-${endpoint.path}-${index}`}
                        className={`flex gap-6 rounded px-2 py-0.5 transition ${
                          active
                            ? 'bg-[rgba(251,113,133,0.14)] text-[var(--danger)]'
                            : 'text-[var(--text)] hover:bg-white/[0.035]'
                        }`}
                      >
                        <span className="w-8 select-none text-right text-[var(--subtle)]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span>
                          {endpoint.method || 'GET'} {endpoint.path || '/'}{' '}
                          <span className="text-[#8b949e]">
                            line {endpoint.lineNumber || '-'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-panel relative overflow-hidden rounded-[var(--radius-lg)] p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="eyebrow text-[var(--text)]">
                    AI Remediation Plan
                  </h2>
                  {selectedSmell ? (
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        severityStyle[selectedSmell.severity].badge
                      }`}
                    >
                      {selectedSmell.severity}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-4 text-sm leading-7">
                  <p className="text-[var(--text)]">
                    {selectedSmell?.description ||
                      'APILens did not detect actionable issues in the selected file.'}
                  </p>
                  <div className="border-l border-[var(--border)] pl-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-[var(--subtle)]">
                      Suggestion
                    </p>
                    <RemediationMarkdown>
                      {selectedSmell?.suggestion ||
                        analysis.aiSuggestion ||
                        'No remediation plan is required.'}
                    </RemediationMarkdown>
                  </div>
                  {analysis.aiSuggestion ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[#0b1017] p-4">
                      <RemediationMarkdown>
                        {analysis.aiSuggestion}
                      </RemediationMarkdown>
                    </div>
                  ) : null}
                </div>
                    Suggestion
                  </p>
                    <p className="text-[var(--muted)]">
                    {selectedSmell?.suggestion ||
                      analysis.aiSuggestion ||
                      'No remediation plan is required.'}
                  </p>
                </div>
                {analysis.aiSuggestion ? (
                  <AiSuggestionMarkdown value={analysis.aiSuggestion} />
                ) : null}
              </div>
            </section>
          </div>
        </main>
      </div>
    </MotionScope>
  );
}
