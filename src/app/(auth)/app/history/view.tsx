'use client';

import MotionScope from '@/components/MotionScope';
import UserBadge from '@/components/UserBadge';
import { listMyAnalyses, listRepositories } from '@/libs/api';
import { type Analysis, type AuthUser, type Repository } from '@/types/global';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 20;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const statusTone: Record<
  Analysis['status'],
  { label: string; className: string }
> = {
  done: {
    label: 'Done',
    className: 'border-[rgba(74,222,128,0.28)] bg-[rgba(74,222,128,0.1)] text-[var(--success)]',
  },
  pending: {
    label: 'Running',
    className: 'border-[rgba(125,211,252,0.28)] bg-[rgba(125,211,252,0.1)] text-[var(--accent)]',
  },
  failed: {
    label: 'Failed',
    className: 'border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] text-[var(--danger)]',
  },
};

const scoreTone = (score: number) => {
  if (score >= 90) return 'border-[rgba(74,222,128,0.48)] text-[var(--success)]';
  if (score >= 75) return 'border-[rgba(125,211,252,0.4)] text-[var(--accent)]';
  if (score >= 50) return 'border-[rgba(251,191,36,0.42)] text-[var(--warning)]';

  return 'border-[rgba(251,113,133,0.42)] text-[var(--danger)]';
};

const scoreGrade = (score: number) => {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';

  return 'D';
};

const shortId = (id: string) => id.slice(-7);

function HistorySkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading history">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.035]"
        />
      ))}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="quiet-panel motion-item flex min-h-[360px] flex-col items-center justify-center rounded-[var(--radius-lg)] p-8 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.04]">
        <span className="text-2xl">↗</span>
      </div>
      <h2 className="text-2xl font-semibold tracking-[-0.025em]">
        No scans yet
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
        Your completed API analyses will appear here, grouped by repository and
        ready to reopen.
      </p>
      <Link className="primary-action mt-6" href="/app">
        Start first analysis
      </Link>
    </div>
  );
}

export default function HistoryView({ user }: { user: AuthUser }) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError('');
    listMyAnalyses({ page: 1, limit: PAGE_SIZE })
      .then((items) => {
        if (!mounted) return;
        setAnalyses(items);
        setPage(1);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((caught) => {
        if (!mounted) return;
        setError(
          caught instanceof Error ? caught.message : 'Unable to load scan history.'
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const loadMore = async () => {
    const nextPage = page + 1;

    setLoadingMore(true);
    setError('');

    try {
      const items = await listMyAnalyses({ page: nextPage, limit: PAGE_SIZE });

      setAnalyses((current) => [...current, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to load older scans.'
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // 1. Fetch all repositories of the user
      let allRepos: Repository[] = [];
      let repoPage = 1;
      const repoLimit = 100;
      while (true) {
        const items = await listRepositories({ page: repoPage, limit: repoLimit });
        allRepos = [...allRepos, ...items];
        if (items.length < repoLimit) break;
        repoPage += 1;
      }

      // Create a lookup map for repo stats
      const repoMap = new Map<string, Repository>();
      allRepos.forEach((r) => {
        repoMap.set(r.fullName, r);
      });

      // 2. Fetch all user analyses (history)
      let allAnalyses: Analysis[] = [];
      let analysisPage = 1;
      const analysisLimit = 100;
      while (true) {
        const items = await listMyAnalyses({ page: analysisPage, limit: analysisLimit });
        allAnalyses = [...allAnalyses, ...items];
        if (items.length < analysisLimit) break;
        analysisPage += 1;
      }

      // 3. Construct rows for Excel export
      // Each row represents a smell/issue detected in the history
      const rows = [];
      for (const analysis of allAnalyses) {
        if (analysis.status !== 'done') continue;

        const repoInfo = repoMap.get(analysis.repoFullName);
        const stargazers = repoInfo?.stargazers_count ?? 0;
        const forks = repoInfo?.forks_count ?? 0;
        const watchers = repoInfo?.watchers_count ?? 0;
        const openIssues = repoInfo?.open_issues_count ?? 0;
        const lang = repoInfo?.language ?? 'N/A';

        if (analysis.smells && analysis.smells.length > 0) {
          for (const smell of analysis.smells) {
            rows.push({
              'Repository': analysis.repoFullName,
              'Branch': analysis.branch,
              'API / File Path': analysis.filePath,
              'Rule ID': smell.ruleId || 'N/A',
              'Rule Name': smell.smellName || 'N/A',
              'Severity': smell.severity || 'N/A',
              'Endpoint': smell.endpoints && smell.endpoints.length > 0
                ? smell.endpoints.join(', ')
                : 'N/A',
              'Số sao': stargazers,
              'Số fork': forks,
              'Số watcher': watchers,
              'Số issue mở': openIssues,
              'Ngôn ngữ chính': lang,
            });
          }
        } else {
          rows.push({
            'Repository': analysis.repoFullName,
            'Branch': analysis.branch,
            'API / File Path': analysis.filePath,
            'Rule ID': 'N/A',
            'Rule Name': 'No design smells detected',
            'Severity': 'N/A',
            'Endpoint': 'N/A',
            'Số sao': stargazers,
            'Số fork': forks,
            'Số watcher': watchers,
            'Số issue mở': openIssues,
            'Ngôn ngữ chính': lang,
          });
        }
      }

      if (rows.length === 0) {
        alert('Không có dữ liệu lịch sử hợp lệ để xuất.');
        return;
      }

      // 4. Generate and write the Excel workbook
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử phân tích');

      // Auto-fit column widths
      const maxLens = rows.reduce<Record<string, number>>((acc, row) => {
        Object.entries(row).forEach(([key, val]) => {
          const length = String(val ?? '').length;
          acc[key] = Math.max(acc[key] || 10, length, key.length);
        });
        return acc;
      }, {});

      worksheet['!cols'] = Object.keys(maxLens).map((key) => ({
        wch: (maxLens[key] || 10) + 2,
      }));

      XLSX.writeFile(workbook, 'apilens-history-report.xlsx');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const repoNames = useMemo(
    () => Array.from(new Set(analyses.map((analysis) => analysis.repoFullName))),
    [analyses]
  );

  const visibleAnalyses = useMemo(() => {
    if (!selectedRepo) return analyses;

    return analyses.filter((analysis) => analysis.repoFullName === selectedRepo);
  }, [analyses, selectedRepo]);

  const groupedAnalyses = useMemo(() => {
    return visibleAnalyses.reduce<Record<string, Analysis[]>>((groups, analysis) => {
      const group = groups[analysis.repoFullName] || [];

      group.push(analysis);
      groups[analysis.repoFullName] = group;

      return groups;
    }, {});
  }, [visibleAnalyses]);

  const latestScan = analyses[0];
  const completedCount = analyses.filter((analysis) => analysis.status === 'done').length;
  const averageScore =
    completedCount > 0
      ? Math.round(
          analyses
            .filter((analysis) => analysis.status === 'done')
            .reduce((total, analysis) => total + analysis.score, 0) / completedCount
        )
      : 0;

  return (
    <MotionScope>
      <div className="app-shell flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(9,13,20,0.78)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                APILens
              </Link>
              <nav className="hidden items-center gap-2 md:flex" aria-label="App navigation">
                <Link className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white" href="/app">
                  Dashboard
                </Link>
                <Link className="rounded-full border border-[var(--border-strong)] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white" href="/app/history">
                  History
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link className="secondary-action hidden sm:inline-flex" href="/app">
                New analysis
              </Link>
              <UserBadge user={user} />
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl flex-grow gap-6 px-5 py-8 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="motion-item hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <div className="quiet-panel rounded-[var(--radius-lg)] p-4">
                <p className="eyebrow mb-4">Recent repositories</p>
                <div className="space-y-1">
                  <button
                    className={`flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                      selectedRepo ? 'text-[var(--muted)]' : 'bg-white/[0.06] text-white'
                    }`}
                    type="button"
                    onClick={() => setSelectedRepo('')}
                  >
                    <span>All repositories</span>
                    <span className="text-xs text-[var(--subtle)]">{analyses.length}</span>
                  </button>
                  {repoNames.map((repo) => {
                    const count = analyses.filter(
                      (analysis) => analysis.repoFullName === repo
                    ).length;
                    const active = selectedRepo === repo;

                    return (
                      <button
                        key={repo}
                        className={`flex w-full items-center gap-2 rounded-[var(--radius-sm)] border-l-2 px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                          active
                            ? 'border-white bg-white/[0.06] text-white'
                            : 'border-transparent text-[var(--muted)]'
                        }`}
                        type="button"
                        onClick={() => setSelectedRepo(repo)}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
                        <span className="min-w-0 flex-1 truncate">{repo}</span>
                        <span className="text-xs text-[var(--subtle)]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="quiet-panel rounded-[var(--radius-lg)] p-4">
                <p className="eyebrow mb-4">Summary</p>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--muted)]">Scans</dt>
                    <dd className="font-medium text-white">{analyses.length}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--muted)]">Average score</dt>
                    <dd className="font-medium text-white">{averageScore || '-'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--muted)]">Latest</dt>
                    <dd className="max-w-[130px] truncate font-medium text-white">
                      {latestScan ? latestScan.repoFullName : '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="motion-item mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="eyebrow mb-3">Scan history</p>
                <h1 className="text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
                  API analysis timeline
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Review past repository scans, compare scores, and reopen any
                  generated report without running a new analysis.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full md:w-auto">
                <button
                  className="secondary-action w-full sm:w-auto flex items-center justify-center gap-2 font-medium"
                  type="button"
                  disabled={exporting}
                  onClick={handleExportExcel}
                >
                  {exporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export Excel</span>
                    </>
                  )}
                </button>
                <Link className="primary-action w-full sm:w-auto text-center" href="/app">
                  Analyze repository
                </Link>
              </div>
            </div>

            <div className="motion-item mb-5 lg:hidden">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--subtle)]" htmlFor="history-repo-filter">
                Repository
              </label>
              <select
                id="history-repo-filter"
                className="input-surface w-full"
                value={selectedRepo}
                onChange={(event) => setSelectedRepo(event.target.value)}
              >
                <option value="">All repositories</option>
                {repoNames.map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <div className="motion-item mb-5 rounded-[var(--radius-md)] border border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] p-4 text-sm text-[var(--danger)]" role="alert">
                {error}
              </div>
            ) : null}

            {loading ? <HistorySkeleton /> : null}

            {!loading && analyses.length === 0 ? <EmptyHistory /> : null}

            {!loading && analyses.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedAnalyses).map(([repo, items]) => (
                  <section key={repo} className="motion-item">
                    <div className="mb-3 flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold tracking-[-0.02em] text-white">
                          {repo}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {items.length} scan{items.length === 1 ? '' : 's'} in this view
                        </p>
                      </div>
                      <span className="status-pill w-fit">
                        Latest {items[0] ? formatDate(items[0].createdAt) : '-'}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-strong)]">
                      {items.map((analysis) => (
                        <Link
                          key={analysis._id}
                          className="group grid gap-4 border-b border-[var(--border)] p-4 transition last:border-b-0 hover:bg-white/[0.055] md:grid-cols-[minmax(0,1fr)_120px_120px_140px]"
                          href={`/app/analyses/${analysis._id}`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <time className="font-mono text-sm text-white" dateTime={analysis.createdAt}>
                                {formatDate(analysis.createdAt)}
                              </time>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusTone[analysis.status].className}`}>
                                {statusTone[analysis.status].label}
                              </span>
                            </div>
                            <p className="mt-2 truncate font-mono text-xs text-[var(--muted)]">
                              {analysis.filePath}
                            </p>
                            <p className="mt-1 text-xs text-[var(--subtle)]">
                              Analysis id: {shortId(analysis._id)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-[var(--muted)] md:justify-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                            <span className="truncate font-mono">{analysis.branch}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold ${scoreTone(analysis.score)}`}>
                              {analysis.status === 'done' ? analysis.score : '-'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {analysis.status === 'done' ? scoreGrade(analysis.score) : 'Pending'}
                              </p>
                              <p className="text-xs text-[var(--subtle)]">
                                {analysis.smellCount} smells
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 md:justify-end">
                            <span className="text-xs text-[var(--muted)]">
                              {analysis.endpointCount} endpoints
                            </span>
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)] transition group-hover:border-[var(--border-strong)] group-hover:text-white">
                              Open report
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}

                {hasMore ? (
                  <div className="motion-item flex justify-center pt-2">
                    <button
                      className="secondary-action"
                      type="button"
                      disabled={loadingMore}
                      onClick={loadMore}
                    >
                      {loadingMore ? 'Loading older scans...' : 'Load older entries'}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </MotionScope>
  );
}
