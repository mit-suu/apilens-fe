'use client';

import ApilensFooter from '@/components/ApilensFooter';
import MotionScope from '@/components/MotionScope';
import AppHeader from '@/components/AppHeader';
import {
  getRepositoryTree,
  listBranches,
  listRepositories,
  scanRepositoryUrl,
} from '@/libs/api';
import {
  type AuthUser,
  type Branch,
  type DetectedFile,
  type Repository,
} from '@/types/global';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

const splitRepo = (fullName: string) => {
  const [owner, repo] = fullName.split('/');

  return { owner: owner || '', repo: repo || '' };
};

const getErrorMessage = (caught: unknown, fallback: string) => {
  if (
    caught
    && typeof caught === 'object'
    && 'response' in caught
    && caught.response
    && typeof caught.response === 'object'
    && 'data' in caught.response
  ) {
    const data = caught.response.data as { error?: { message?: string } };

    if (data.error?.message) {
      return data.error.message;
    }
  }

  return caught instanceof Error ? caught.message : fallback;
};

function StepIndicator({
  selectedRepo,
  selectedBranch,
}: {
  selectedRepo: Repository | null;
  selectedBranch: string;
}) {
  const steps = [
    { label: '01 - Repository', active: true },
    { label: '02 - Branch', active: Boolean(selectedRepo) },
    { label: '03 - Analyze', active: Boolean(selectedRepo && selectedBranch) },
  ];

  return (
    <div className="motion-item flex flex-wrap items-center gap-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${step.active
              ? 'border border-[var(--border-strong)] bg-white/[0.06] text-white'
              : 'border border-[var(--border)] text-[var(--subtle)]'
              }`}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <div className="hidden h-px w-6 bg-[var(--border)] sm:block" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function RepoPicker({ user }: { user: AuthUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sourceMode, setSourceMode] = useState<'repos' | 'url'>(
    searchParams.get('source') === 'url' ? 'url' : 'repos'
  );
  const [search, setSearch] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [scanningUrl, setScanningUrl] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DetectedFile | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    let mounted = true;

    listRepositories()
      .then((items) => {
        if (mounted) setRepositories(items);
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(
            getErrorMessage(caught, 'Unable to load GitHub repositories.')
          );
        }
      })
      .finally(() => {
        if (mounted) setLoadingRepos(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRepos = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return repositories;

    return repositories.filter((repo) =>
      repo.fullName.toLowerCase().includes(term)
    );
  }, [repositories, search]);

  const loadRepoDetails = async (repo: Repository) => {
    setError('');
    setSelectedRepo(repo);
    setSelectedBranch('');
    setFiles([]);
    setSelectedFile(null);
    setBranches([]);
    setLoadingBranches(true);

    try {
      const { owner, repo: repoName } = splitRepo(repo.fullName);
      const branchItems = await listBranches(owner, repoName);

      setBranches(branchItems);

      if (branchItems.length === 0) {
        setError('No branches found for the selected repository.');
      }
    } catch (caught) {
      setBranches([]);
      setError(
        getErrorMessage(caught, 'Unable to load repository metadata.')
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  const changeBranch = async (branchName: string) => {
    if (!selectedRepo) return;

    setSelectedBranch(branchName);
    setSelectedFile(null);
    setFiles([]);
    setLoadingFiles(true);
    setError('');

    try {
      const { owner, repo } = splitRepo(selectedRepo.fullName);
      const tree = await getRepositoryTree(owner, repo, branchName);
      setFiles(tree.detectedFiles || []);
      if (tree.detectedFiles && tree.detectedFiles.length > 0) {
        setSelectedFile(tree.detectedFiles[0] || null);
      } else {
        setError('No analyzable files found on the selected branch.');
      }
    } catch (caught) {
      setFiles([]);
      setError(
        getErrorMessage(caught, 'Unable to load repository tree.')
      );
    } finally {
      setLoadingFiles(false);
    }
  };

  const resetBranchSelection = () => {
    setSelectedBranch('');
    setSelectedFile(null);
    setFiles([]);
    setError('');
  };

  const handleScanRepoUrl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUrl = repoUrl.trim();

    if (!trimmedUrl || scanningUrl) return;

    setError('');
    setScanningUrl(true);
    setLoadingBranches(true);
    setLoadingFiles(true);
    setSelectedRepo(null);
    setSelectedBranch('');
    setSelectedFile(null);
    setFiles([]);
    setBranches([]);

    try {
      const result = await scanRepositoryUrl({ repoUrl: trimmedUrl });
      const repo = result.repository;
      const detectedFiles = result.detectedFiles || [];
      const { owner, repo: repoName } = splitRepo(repo.fullName);

      setSelectedRepo(repo);
      setSelectedBranch(result.branch);
      setBranches([
        {
          name: result.branch,
          protected: false,
        },
      ]);
      setFiles(detectedFiles);
      setSelectedFile(detectedFiles[0] || null);

      if (detectedFiles.length === 0) {
        setError('No analyzable files found in this GitHub repository.');
      }

      try {
        const branchItems = await listBranches(owner, repoName);

        if (branchItems.length > 0) {
          setBranches(branchItems);
        }
      } catch {
        setBranches([
          {
            name: result.branch,
            protected: false,
          },
        ]);
      }
    } catch (caught) {
      setSelectedRepo(null);
      setSelectedBranch('');
      setFiles([]);
      setSelectedFile(null);
      setBranches([]);
      setError(
        getErrorMessage(caught, 'Unable to scan the GitHub repository URL.')
      );
    } finally {
      setScanningUrl(false);
      setLoadingFiles(false);
      setLoadingBranches(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!selectedRepo || !selectedBranch || !selectedFile) return;

    setAnalyzing(true);

    const params = new URLSearchParams({
      repoFullName: selectedRepo.fullName,
      branch: selectedBranch,
      filePath: selectedFile.path,
      fileType: selectedFile.detectedAs,
    });

    router.push(`/app/analyzing?${params.toString()}`);
  };
  return (
    <MotionScope>
      <div className="app-shell flex min-h-screen flex-col">
        <AppHeader
          activeTab="scan"
          onSourceModeChange={setSourceMode}
          sourceMode={sourceMode}
          user={user}
        />
        <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-6 px-5 py-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="motion-item">
              <p className="eyebrow mb-3">Repository setup</p>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
                Choose the source to analyze
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Select a GitHub repository, branch, and one supported API file.
                We only show files APILens can parse.
              </p>
            </div>
            <StepIndicator
              selectedRepo={selectedRepo}
              selectedBranch={selectedBranch}
            />
          </div>

          {error ? (
            <div
              className="motion-item rounded-[var(--radius-md)] border border-[rgba(251,113,133,0.32)] bg-[rgba(251,113,133,0.1)] p-4 text-sm text-[var(--danger)]"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
            <div className="glass-panel motion-item rounded-[var(--radius-lg)] p-4">
              {sourceMode === 'url' ? (
                <form
                  className="flex min-h-[360px] flex-col justify-center"
                  onSubmit={handleScanRepoUrl}
                >
                  <p className="eyebrow mb-3">GitHub URL</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    Scan by repository link
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Paste a public repository link, or a private repository link if your GitHub account has access.
                  </p>
                  <label className="mt-6 mb-3 block text-sm font-medium text-[var(--muted)]" htmlFor="repo-url">
                    Repository URL
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="repo-url"
                      className="input-surface min-w-0 flex-1"
                      disabled={scanningUrl || analyzing}
                      onChange={(event) => setRepoUrl(event.target.value)}
                      placeholder="https://github.com/owner/repo"
                      value={repoUrl}
                    />
                    <button
                      className="secondary-action shrink-0 disabled:cursor-not-allowed"
                      disabled={!repoUrl.trim() || scanningUrl || analyzing}
                      type="submit"
                    >
                      {scanningUrl ? 'Scanning...' : 'Scan URL'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <label className="mb-3 block text-sm font-medium text-[var(--muted)]" htmlFor="repo-search">
                    Search repositories
                  </label>
                  <div className="relative">
                    <input
                      id="repo-search"
                      className="input-surface w-full pl-10"
                      placeholder="Search by owner or repository..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--subtle)]">
                      /
                    </span>
                  </div>

                  <div className="mt-4 max-h-[55vh] min-h-[280px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                    {loadingRepos ? (
                      <div className="space-y-2 p-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-14 animate-pulse rounded-[var(--radius-sm)] bg-white/[0.045]"
                          />
                        ))}
                      </div>
                    ) : null}

                    {!loadingRepos && filteredRepos.length === 0 ? (
                      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                        <p className="text-sm font-medium">No repositories found</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          Try another search term or review GitHub OAuth
                          permissions.
                        </p>
                      </div>
                    ) : null}

                    {filteredRepos.map((repo) => {
                      const active = selectedRepo?.id === repo.id;

                      return (
                        <button
                          key={repo.id}
                          aria-pressed={active}
                          className={`flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-white/[0.055] ${active ? 'bg-white/[0.075]' : ''
                            }`}
                          type="button"
                          onClick={() => loadRepoDetails(repo)}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text)]">
                              {repo.fullName}
                            </p>
                            <p className="mt-1 text-xs text-[var(--subtle)]">
                              Updated {new Date(repo.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="status-pill shrink-0">
                            {repo.private ? 'Private' : 'Public'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="glass-panel motion-item rounded-[var(--radius-lg)] p-4 md:p-5">
              {!selectedRepo ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 rounded-full border border-[var(--border)] bg-white/[0.04] px-3 py-1 text-xs text-[var(--muted)]">
                    Waiting for repository
                  </div>
                  <h2 className="text-xl font-semibold">Pick a repo to continue</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
                    Branches will appear here once a repository is selected.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-[460px] flex-col gap-5">
                  <div>
                    <p className="eyebrow mb-2">Selected repository</p>
                    <h2 className="truncate text-2xl font-semibold tracking-[-0.03em]">
                      {selectedRepo.fullName}
                    </h2>
                  </div>

                  {!selectedBranch ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-[var(--muted)]">
                          Branch
                        </h3>
                        <span className="text-xs text-[var(--subtle)]">
                          {branches.length} found
                        </span>
                      </div>
                      <div className="max-h-[340px] min-h-[240px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                        {loadingBranches ? (
                          <div className="space-y-2 p-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <div
                                key={index}
                                className="h-12 animate-pulse rounded-[var(--radius-sm)] bg-white/[0.045]"
                              />
                            ))}
                          </div>
                        ) : null}

                        {!loadingBranches && branches.length === 0 ? (
                          <div className="flex min-h-[240px] items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
                            No branches available.
                          </div>
                        ) : null}

                        {branches.map((branch) => {
                          const active = selectedBranch === branch.name;

                          return (
                            <button
                              key={branch.name}
                              aria-pressed={active}
                              className={`group flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-white/[0.055] disabled:cursor-wait disabled:opacity-70 ${active ? 'bg-white/[0.075]' : ''
                                }`}
                              disabled={analyzing}
                              type="button"
                              onClick={() => changeBranch(branch.name)}
                            >
                              <span className="min-w-0 truncate font-mono text-sm text-[var(--text)]">
                                {branch.name}
                                {branch.name === selectedRepo.defaultBranch
                                  ? ' (default)'
                                  : ''}
                              </span>
                              <span className="translate-x-[-6px] text-sm text-[var(--subtle)] opacity-0 transition group-hover:translate-x-0 group-hover:text-white group-hover:opacity-100">
                                -&gt;
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        Click a branch to select it and choose an API file.
                      </p>
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-4">
                      <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.02] px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[var(--muted)]">Selected branch:</span>
                          <span className="font-mono font-semibold text-white truncate max-w-[180px]">
                            {selectedBranch}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition shrink-0"
                          onClick={resetBranchSelection}
                          disabled={analyzing}
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col mt-1">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-[var(--muted)]">
                            Select API File
                          </h3>
                          <span className="text-xs text-[var(--subtle)]">
                            {files.length} found
                          </span>
                        </div>
                        <div className="max-h-[240px] min-h-[160px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-black/20">
                          {loadingFiles ? (
                            <div className="space-y-2 p-3">
                              {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                  key={index}
                                  className="h-12 animate-pulse rounded-[var(--radius-sm)] bg-white/[0.045]"
                                />
                              ))}
                            </div>
                          ) : null}

                          {!loadingFiles && files.length === 0 ? (
                            <div className="flex min-h-[160px] flex-col items-center justify-center px-6 text-center text-sm text-[var(--muted)]">
                              <span>No analyzable files found on this branch.</span>
                              <button
                                type="button"
                                onClick={resetBranchSelection}
                                className="mt-2 text-xs text-indigo-400 hover:underline"
                              >
                                Try another branch
                              </button>
                            </div>
                          ) : null}

                          {!loadingFiles &&
                            files.map((file) => {
                              const active = selectedFile?.path === file.path;

                              let badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                              if (file.detectedAs === 'openapi') {
                                badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                              } else if (file.detectedAs === 'postman') {
                                badgeClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                              }

                              const sizeKB = (file.size / 1024).toFixed(1);

                              return (
                                <button
                                  key={file.path}
                                  aria-pressed={active}
                                  className={`flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-white/[0.055] disabled:opacity-50 ${active ? 'bg-white/[0.075]' : ''
                                    }`}
                                  disabled={analyzing}
                                  type="button"
                                  onClick={() => setSelectedFile(file)}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-mono text-sm text-white">
                                      {file.path.split('/').pop()}
                                    </p>
                                    <p className="mt-0.5 truncate font-mono text-xs text-[var(--subtle)]">
                                      {file.path}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-mono text-[var(--subtle)]">
                                      {sizeKB} KB
                                    </span>
                                    <span className={`rounded border px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badgeClass}`}>
                                      {file.detectedAs}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      <button
                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-4 py-3 font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        onClick={handleStartAnalysis}
                        disabled={!selectedFile || analyzing || loadingFiles}
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Đang quét...</span>
                          </>
                        ) : (
                          'Start Analysis'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <p className="motion-item text-center text-sm text-[var(--muted)]">
            Do not see your repository?{' '}
            <a
              className="text-[var(--text)] underline-offset-4 hover:underline"
              href="https://github.com/settings/connections/applications"
              rel="noreferrer"
              target="_blank"
            >
              Check GitHub permissions
            </a>
          </p>
        </main>
        <ApilensFooter />
      </div>
    </MotionScope>
  );
}
