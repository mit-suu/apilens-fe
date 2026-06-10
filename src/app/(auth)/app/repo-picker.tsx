'use client';

import MotionScope from '@/components/MotionScope';
import UserBadge from '@/components/UserBadge';
import {
  createAnalysis,
  getRepositoryTree,
  listBranches,
  listRepositories,
} from '@/libs/api';
import {
  type AuthUser,
  type Branch,
  type DetectedFile,
  type Repository,
  type RepositoryTree,
} from '@/types/global';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const splitRepo = (fullName: string) => {
  const [owner, repo] = fullName.split('/');

  return { owner: owner || '', repo: repo || '' };
};

const fileTypeLabel: Record<DetectedFile['detectedAs'], string> = {
  openapi: 'OpenAPI',
  postman: 'Postman',
  express: 'Express',
};

function AppHeader({ user }: { user: AuthUser }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgba(9,13,20,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            APILens
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="App navigation">
            <Link className="rounded-full border border-[var(--border-strong)] bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white" href="/app">
              Dashboard
            </Link>
            <Link className="rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white" href="/app/history">
              History
            </Link>
          </nav>
        </div>
        <UserBadge user={user} />
      </div>
    </header>
  );
}

function StepIndicator({
  selectedRepo,
  selectedBranch,
  selectedFile,
}: {
  selectedRepo: Repository | null;
  selectedBranch: string;
  selectedFile: DetectedFile | null;
}) {
  const steps = [
    { label: '01 - Repository', active: true },
    { label: '02 - Branch', active: Boolean(selectedRepo) },
    { label: '03 - Analyze', active: Boolean(selectedRepo && selectedBranch && selectedFile) },
  ];

  return (
    <div className="motion-item flex flex-wrap items-center gap-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${
              step.active
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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tree, setTree] = useState<RepositoryTree | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedFile, setSelectedFile] = useState<DetectedFile | null>(null);
  const [search, setSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    listRepositories()
      .then((items) => {
        if (mounted) setRepositories(items);
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to load GitHub repositories.'
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
    setSelectedFile(null);
    setTree(null);
    setLoadingTree(true);

    try {
      const { owner, repo: repoName } = splitRepo(repo.fullName);
      const branchItems = await listBranches(owner, repoName);
      const defaultBranch =
        branchItems.find((branch) => branch.name === repo.defaultBranch)?.name ||
        branchItems[0]?.name ||
        repo.defaultBranch ||
        'main';

      setBranches(branchItems);
      setSelectedBranch(defaultBranch);

      const treePayload = await getRepositoryTree(owner, repoName, defaultBranch);
      setTree(treePayload);
      setSelectedFile(treePayload.detectedFiles[0] || null);
    } catch (caught) {
      setBranches([]);
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to load repository metadata.'
      );
    } finally {
      setLoadingTree(false);
    }
  };

  const changeBranch = async (branch: string) => {
    if (!selectedRepo) return;

    setSelectedBranch(branch);
    setSelectedFile(null);
    setTree(null);
    setLoadingTree(true);
    setError('');

    try {
      const { owner, repo } = splitRepo(selectedRepo.fullName);
      const treePayload = await getRepositoryTree(owner, repo, branch);

      setTree(treePayload);
      setSelectedFile(treePayload.detectedFiles[0] || null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to scan repository tree.'
      );
    } finally {
      setLoadingTree(false);
    }
  };

  const analyze = async () => {
    if (!selectedRepo || !selectedBranch || !selectedFile) return;

    setAnalyzing(true);
    setError('');

    try {
      const analysis = await createAnalysis({
        repoFullName: selectedRepo.fullName,
        branch: selectedBranch,
        filePath: selectedFile.path,
        fileType: selectedFile.detectedAs,
      });

      router.push(`/app/analyzing/${analysis._id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Analysis failed.');
      setAnalyzing(false);
    }
  };

  return (
    <MotionScope>
      <div className="app-shell flex min-h-screen flex-col">
        <AppHeader user={user} />
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
              selectedFile={selectedFile}
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
                  ⌕
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
                      className={`flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-white/[0.055] ${
                        active ? 'bg-white/[0.075]' : ''
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
            </div>

            <div className="glass-panel motion-item rounded-[var(--radius-lg)] p-4 md:p-5">
              {!selectedRepo ? (
                <div className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center">
                  <div className="mb-4 rounded-full border border-[var(--border)] bg-white/[0.04] px-3 py-1 text-xs text-[var(--muted)]">
                    Waiting for repository
                  </div>
                  <h2 className="text-xl font-semibold">Pick a repo to continue</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
                    Branches and analyzable files will appear here once a
                    repository is selected.
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

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-[var(--muted)]" htmlFor="branch">
                        Branch
                      </label>
                      <span className="text-xs text-[var(--subtle)]">
                        {branches.length} found
                      </span>
                    </div>
                    <select
                      id="branch"
                      className="input-surface w-full"
                      value={selectedBranch}
                      onChange={(event) => changeBranch(event.target.value)}
                    >
                      {branches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                          {branch.name === selectedRepo.defaultBranch ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {loadingTree ? (
                    <div className="space-y-2">
                      <p className="text-sm text-[var(--muted)]">
                        Scanning repository tree...
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-white/40" />
                      </div>
                    </div>
                  ) : null}

                  {tree?.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="rounded-[var(--radius-md)] border border-[rgba(251,191,36,0.28)] bg-[rgba(251,191,36,0.1)] p-3 text-sm text-[var(--warning)]"
                    >
                      {warning}
                    </div>
                  ))}

                  {tree && tree.detectedFiles.length === 0 ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 text-sm leading-6 text-[var(--muted)]">
                      <p className="font-medium text-[var(--text)]">
                        No analyzable files found
                      </p>
                      <p className="mt-2">
                        APILens supports Express .js, OpenAPI .yaml/.json, and
                        Postman .json files.
                      </p>
                    </div>
                  ) : null}

                  {tree && tree.detectedFiles.length > 0 ? (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-[var(--muted)]">
                        Analyzable files
                      </h3>
                      <div className="max-h-[260px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)]">
                        {tree.detectedFiles.map((file) => (
                          <button
                            key={file.path}
                            aria-pressed={selectedFile?.path === file.path}
                            className={`flex w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-white/[0.055] ${
                              selectedFile?.path === file.path
                                ? 'bg-white/[0.075]'
                                : ''
                            }`}
                            type="button"
                            onClick={() => setSelectedFile(file)}
                          >
                            <span className="truncate font-mono text-sm">
                              {file.path}
                            </span>
                            <span className="status-pill shrink-0">
                              {fileTypeLabel[file.detectedAs]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.035] p-3">
                    <button
                      className="primary-action w-full"
                      type="button"
                      disabled={!selectedFile || analyzing}
                      onClick={analyze}
                    >
                      {analyzing ? 'Starting analysis...' : 'Analyze selected file'}
                    </button>
                  </div>
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
        <footer className="border-t border-[var(--border)] py-4">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5">
            <span className="text-xs uppercase tracking-widest text-[var(--subtle)]">
              © 2024 APILens
          </span>
            <div className="hidden gap-6 sm:flex">
            {['Documentation', 'Support', 'Privacy'].map((item) => (
              <a
                key={item}
                  className="text-xs text-[var(--subtle)] transition hover:text-[var(--text)]"
                href="#"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
      </div>
    </MotionScope>
  );
}
