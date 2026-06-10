import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0d1117] px-6 text-center text-[#e6edf3]">
      <h2 className="text-2xl font-semibold">404 Not Found</h2>
      <Link
        href="/"
        className="rounded-lg border border-[#30363d] px-5 py-3 text-sm font-medium transition hover:border-[#8b949e] hover:bg-[#21262d]"
      >
        Return Home
      </Link>
    </div>
  );
}
