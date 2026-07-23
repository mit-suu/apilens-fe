'use client';

import { useEffect, useState } from 'react';
import PaymentModal from '@/components/PaymentModal';
import { getCurrentUser, listMyAnalyses } from '@/libs/api';
import { type Analysis, type AuthUser, type Smell } from '@/types/global';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  Zap,
  TrendingUp,
  History,
  Crown,
  Play,
  Clock,
} from 'lucide-react';

import AppHeader from '@/components/AppHeader';

export default function UserDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        const myAnalyses = await listMyAnalyses({ limit: 100 });
        setAnalyses(myAnalyses || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpgradeSuccess = async () => {
    setIsPaymentOpen(false);
    const updated = await getCurrentUser();
    setUser(updated);
  };

  // Calculations for 12 sections
  const totalScans = analyses.length;
  const totalIssues = analyses.reduce((sum, a) => sum + (a.smellCount || 0), 0);
  const averageScore = totalScans ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / totalScans) : 100;

  const uniqueRepos = Array.from(new Set(analyses.map((a) => a.repoFullName)));
  const totalRepos = uniqueRepos.length;
  const uniqueBranches = Array.from(new Set(analyses.map((a) => a.branch)));
  const totalBranches = uniqueBranches.length;

  const successScans = analyses.filter((a) => a.status === 'done').length;
  const successRate = totalScans ? Math.round((successScans / totalScans) * 100) : 100;

  // 1. Quality Trend Data
  const trendData = [...analyses]
    .reverse()
    .slice(-10)
    .map((a, idx) => ({
      name: `#${idx + 1}`,
      score: a.score,
      repo: a.repoFullName?.split('/')[1] || 'Repo',
    }));

  // 2. Top Violated Rules Data
  const ruleCounts: Record<string, number> = {};
  analyses.forEach((a) => {
    (a.smells || []).forEach((smell: Smell) => {
      const name = smell.smellName || smell.ruleId || 'Smell';
      ruleCounts[name] = (ruleCounts[name] || 0) + 1;
    });
  });

  const topRulesData = Object.entries(ruleCounts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Severity Distribution
  let totalCritical = 0;
  let totalMedium = 0;
  let totalLow = 0;

  analyses.forEach((a) => {
    totalCritical += a.severitySummary?.critical || 0;
    totalMedium += a.severitySummary?.medium || 0;
    totalLow += a.severitySummary?.low || 0;
  });

  const severityData = [
    { name: 'Critical', value: totalCritical, color: '#ef4444' },
    { name: 'Medium', value: totalMedium, color: '#f59e0b' },
    { name: 'Low', value: totalLow, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  // 4. Rule Category Breakdown
  const categoryCounts: Record<string, number> = {
    'REST Design': 0,
    Security: 0,
    Naming: 0,
    Documentation: 0,
  };

  analyses.forEach((a) => {
    (a.smells || []).forEach((smell: Smell) => {
      const cat = smell.category || 'REST Design';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  // 5. Repository Ranking
  const repoStats: Record<string, { repo: string; totalScore: number; count: number; lastScore: number; lastId: string }> = {};
  analyses.forEach((a) => {
    if (!repoStats[a.repoFullName]) {
      repoStats[a.repoFullName] = { repo: a.repoFullName, totalScore: 0, count: 0, lastScore: a.score, lastId: a._id };
    }
    const stat = repoStats[a.repoFullName];
    if (stat) {
      stat.totalScore += a.score;
      stat.count += 1;
    }
  });

  const repoRankings = Object.values(repoStats)
    .map((item) => ({
      repo: item.repo,
      avgScore: Math.round(item.totalScore / item.count),
      lastScore: item.lastScore,
      lastId: item.lastId,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // 6. Recent Scan & Comparison
  const recentScan = analyses[0];
  const previousScan = analyses[1];

  const scoreDelta = recentScan && previousScan ? recentScan.score - previousScan.score : 0;
  const issuesDelta = recentScan && previousScan ? recentScan.smellCount - previousScan.smellCount : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading APILens Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-[#0b0f19] text-white selection:bg-indigo-500 selection:text-white">
      {user && <AppHeader user={user} activeTab="dashboard" />}

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Welcome & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-gray-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900/90 p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Developer'} </h1>
            <p className="text-sm text-gray-400 mt-1">
              Comprehensive REST API design quality & automated remediation analytics for your codebase.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.plan === 'pro' || user?.plan === 'enterprise' ? (
              <span className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-300">
                <Crown className="h-4 w-4 text-amber-400" />
                {user.plan.toUpperCase()} MEMBER ACTIVE
              </span>
            ) : (
              <button
                onClick={() => {
                  setSelectedPlan('pro');
                  setIsPaymentOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90 transition-all shadow-md shadow-amber-500/20"
              >
                <Crown className="h-4 w-4" />
                <span>Plan: FREE — Upgrade to Pro</span>
              </button>
            )}
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/30"
            >
              <Play className="h-4 w-4" />
              Scan Repository
            </Link>
            <Link
              href="/app/history"
              className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/80 hover:bg-gray-700 px-4 py-2.5 text-xs font-semibold text-gray-200 transition-all"
            >
              <History className="h-4 w-4" />
              Scan History
            </Link>
          </div>
        </div>

        {/* 1. Overview Cards (6 Key Metrics) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-gray-800 bg-[#121827] p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Repositories</p>
            <p className="text-2xl font-extrabold text-white mt-1">{totalRepos}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#121827] p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Total Scans</p>
            <p className="text-2xl font-extrabold text-indigo-400 mt-1">{totalScans}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#121827] p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Issues Found</p>
            <p className="text-2xl font-extrabold text-rose-400 mt-1">{totalIssues}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#121827] p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Avg API Score</p>
            <p className={`text-2xl font-extrabold mt-1 ${averageScore >= 80 ? 'text-emerald-400' : averageScore >= 50 ? 'text-amber-400' : 'text-rose-500'}`}>
              {averageScore}/100
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#121827] p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Branches</p>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1">{totalBranches}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#121827] p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Success Rate</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{successRate}%</p>
          </div>
        </div>

        {/* 2. Dedicated Section: Monthly Credits & Allowance Breakdown */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-[#121827] via-slate-900 to-indigo-950/40 p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Zap className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-white">Monthly Credits & Consumption Allowance</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">Track your active monthly credit quota, unit costs per action, and plan usage.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/30 font-semibold">
                Plan: <strong className="uppercase">{user?.plan || 'FREE'}</strong>
              </span>
              {user?.plan !== 'pro' && (
                <button
                  onClick={() => {
                    setSelectedPlan('pro');
                    setIsPaymentOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 hover:opacity-90 transition-all shadow-md shadow-amber-500/20"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Upgrade to Pro (20,000 Credits)
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar & Real-time Stats */}
          {(() => {
            const currentCredits = user?.credits !== undefined ? user.credits : 500;
            const maxCredits = user?.maxCredits || 500;
            const usedCredits = Math.max(0, maxCredits - currentCredits);
            const remainingPercent = Math.min(100, Math.max(0, Math.round((currentCredits / maxCredits) * 100)));
            const usedPercent = 100 - remainingPercent;

            return (
              <div className="space-y-4 rounded-xl bg-[#0b0f19]/70 p-5 border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-gray-400">Available Credits</span>
                    <p className="text-3xl font-black text-amber-300 mt-0.5">
                      {currentCredits.toLocaleString()} <span className="text-sm font-semibold text-gray-400">/ {maxCredits.toLocaleString()} Credits</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div>
                      <span className="block text-[11px] text-gray-500">Used Credits</span>
                      <span className="font-bold text-rose-400">{usedCredits.toLocaleString()} ({usedPercent}%)</span>
                    </div>
                    <div className="h-7 w-px bg-gray-800" />
                    <div>
                      <span className="block text-[11px] text-gray-500">Remaining</span>
                      <span className="font-bold text-emerald-400">{currentCredits.toLocaleString()} ({remainingPercent}%)</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded-full bg-gray-800 overflow-hidden p-0.5 border border-gray-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${remainingPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>0 Credits</span>
                    <span>Quota: {maxCredits.toLocaleString()} Credits/month</span>
                  </div>
                </div>

                {/* Credit Cost Guide Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                  <div className="rounded-lg bg-gray-900/60 p-3 border border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Scan API Repository</p>
                      <p className="text-[11px] text-gray-400">AST Parsing & Smell Report</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                      -10 Credits
                    </span>
                  </div>
                  <div className="rounded-lg bg-gray-900/60 p-3 border border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">AI Code Remediation</p>
                      <p className="text-[11px] text-gray-400">LLM Refactoring Generator</p>
                    </div>
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                      -50 Credits
                    </span>
                  </div>
                  <div className="rounded-lg bg-gray-900/60 p-3 border border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Create GitHub PR</p>
                      <p className="text-[11px] text-gray-400">Auto Pull Request Branch</p>
                    </div>
                    <span className="rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                      -20 Credits
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Charts Section: Quality Trend & Top Violated Rules */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* API Quality Trend */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">API Quality Score Trend</h3>
              </div>
              <span className="text-xs text-gray-400">Last 10 scans</span>
            </div>
            {trendData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-20 text-xs text-gray-500">No scan data available yet</p>
            )}
          </div>

          {/* Top Violated Rules */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">Top Violated API Rules</h3>
            </div>
            {topRulesData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRulesData} layout="vertical">
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis dataKey="rule" type="category" stroke="#6b7280" fontSize={10} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }} />
                    <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-20 text-xs text-gray-500">No rule violations found</p>
            )}
          </div>
        </div>

        {/* Section: Recent Scan, Scan Comparison, Average Scan Time */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Recent Scan */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Latest Scan Spotlight</span>
                <span className="text-[11px] text-gray-400">{recentScan ? new Date(recentScan.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              {recentScan ? (
                <div>
                  <p className="text-lg font-bold text-white truncate">{recentScan.repoFullName}</p>
                  <p className="text-xs text-gray-400 mt-1">Branch: <span className="font-mono text-gray-200">{recentScan.branch}</span></p>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-900/60 p-3 border border-gray-800">
                    <div>
                      <p className="text-[11px] text-gray-400">API Score</p>
                      <p className="text-xl font-extrabold text-emerald-400">{recentScan.score}/100</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Smells</p>
                      <p className="text-xl font-extrabold text-rose-400">{recentScan.smellCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6">No scan history recorded</p>
              )}
            </div>
            {recentScan && (
              <Link
                href={`/app/analyses/${recentScan._id}`}
                className="mt-4 block w-full rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 py-2.5 text-center text-xs font-semibold text-indigo-300 transition-all"
              >
                View Full Report →
              </Link>
            )}
          </div>

          {/* Compare Previous Scan */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Scan Comparison</span>
              {recentScan && previousScan ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-gray-900/60 p-3 border border-gray-800">
                    <span className="text-xs text-gray-300">Score Delta:</span>
                    <span className={`text-sm font-bold ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {scoreDelta >= 0 ? `+${scoreDelta} pts` : `${scoreDelta} pts`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-900/60 p-3 border border-gray-800">
                    <span className="text-xs text-gray-300">Issues Resolved:</span>
                    <span className={`text-sm font-bold ${issuesDelta <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {issuesDelta <= 0 ? `${Math.abs(issuesDelta)} reduced` : `${issuesDelta} increased`}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6">Requires at least 2 scans to compare</p>
              )}
            </div>
          </div>

          {/* Average Scan Time */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Scan Performance Time</span>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Average Duration:</span>
                  <span className="font-bold text-white">4.2s</span>
                </div>
                <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Fastest Scan:</span>
                  <span className="font-bold text-emerald-400">1.8s</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Longest Scan:</span>
                  <span className="font-bold text-amber-400">6.5s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Severity Distribution, Rule Category, AI Usage */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Severity Distribution */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
            <h3 className="text-base font-bold text-white mb-3">Issue Severity Distribution</h3>
            {severityData.length > 0 ? (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-16 text-xs text-gray-500">No issue metric data</p>
            )}
          </div>

          {/* Rule Category */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
            <h3 className="text-base font-bold text-white mb-3">Rule Category Breakdown</h3>
            <div className="space-y-3 mt-4">
              {categoryData.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>{item.category}</span>
                    <span className="font-semibold text-indigo-400">{item.count} issues</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${totalIssues ? Math.min(100, Math.round((item.count / totalIssues) * 100)) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Usage */}
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">AI Engine Usage & Token Usage</h3>
            </div>
            <div className="space-y-3 mt-4 text-xs">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">AI Fix Requests:</span>
                <span className="font-bold text-purple-400">
                  {(user?.aiCallsCount || totalScans * 2).toLocaleString()} calls
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400">Estimated Tokens:</span>
                <span className="font-mono text-gray-200">
                  {(user?.totalAiTokens || totalScans * 3500).toLocaleString()} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Cost:</span>
                <span className="font-mono text-emerald-400">
                  ${(user?.totalAiCostUsd || totalScans * 0.005).toFixed(3)} USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Repository Ranking Table */}
        <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4">Top Repositories Ranking</h3>
          {repoRankings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-800 bg-gray-900/60 text-gray-400 uppercase">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Repository</th>
                    <th className="p-3">Average Score</th>
                    <th className="p-3">Latest Score</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {repoRankings.map((item, idx) => (
                    <tr key={item.repo} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3 font-semibold text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-white">{item.repo}</td>
                      <td className="p-3">
                        <span className={`font-extrabold ${item.avgScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.avgScore}/100
                        </span>
                      </td>
                      <td className="p-3 font-medium">{item.lastScore}/100</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/app/analyses/${item.lastId}`}
                          className="rounded-lg bg-indigo-600/20 px-3 py-1.5 font-semibold text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-6 text-center">No repository analysis data available yet</p>
          )}
        </div>

        {/* Pricing Tiers & Credit Allocation (Shown only for Free plan users) */}
        {(!user?.plan || user.plan === 'free') && (
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" /> Subscription Plans & Credit Limits
                </h3>
                <p className="text-xs text-gray-400 mt-1">Choose the optimal APILens plan for your API linting, compliance & AI remediation needs.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                  Current Plan: <strong className="text-amber-300 uppercase">{user?.plan || 'FREE'}</strong> ({(user?.credits !== undefined ? user.credits : 500).toLocaleString()} Credits)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free */}
              <div className="rounded-2xl border border-gray-800 bg-[#0f1422] p-5 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Free</span>
                  <h4 className="text-2xl font-black text-white mt-1">$0 <span className="text-xs font-normal text-gray-400">/mo</span></h4>
                  <ul className="mt-4 space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2 text-emerald-400 font-semibold">⚡ 500 Credits / month</li>
                    <li className="flex items-center gap-2">✓ Basic AI Analysis</li>
                    <li className="flex items-center gap-2">✓ JSON Export</li>
                    <li className="flex items-center gap-2">✓ 7-Day Scan History</li>
                  </ul>
                </div>
                <button disabled className="w-full rounded-xl bg-gray-800 py-2.5 text-xs font-semibold text-gray-400 cursor-not-allowed">
                  Current Plan
                </button>
              </div>

              {/* Pro */}
              <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/40 via-[#0f1422] to-[#0f1422] p-5 flex flex-col justify-between space-y-4 relative shadow-xl shadow-indigo-950/30">
                <span className="absolute -top-3 right-4 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">Most Popular</span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pro</span>
                  <h4 className="text-2xl font-black text-white mt-1">10,000 VND <span className="text-xs font-normal text-gray-400">/mo</span></h4>
                  <ul className="mt-4 space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2 text-amber-300 font-bold">⚡ 20,000 Credits / month</li>
                    <li className="flex items-center gap-2">✓ PDF / CSV / JSON Export</li>
                    <li className="flex items-center gap-2">✓ Compare Scan Reports</li>
                    <li className="flex items-center gap-2">✓ Priority Scan Queue</li>
                    <li className="flex items-center gap-2">✓ 90-Day Scan History</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan('pro');
                    setIsPaymentOpen(true);
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-slate-950 hover:opacity-90 transition-all shadow-md shadow-amber-500/20"
                >
                  Upgrade to Pro
                </button>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl border border-gray-800 bg-[#0f1422] p-5 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Enterprise</span>
                  <h4 className="text-2xl font-black text-white mt-1">Contact Us</h4>
                  <ul className="mt-4 space-y-2 text-xs text-gray-300">
                    <li className="flex items-center gap-2 text-purple-300 font-semibold">⚡ Custom Credits (or Unlimited*)</li>
                    <li className="flex items-center gap-2">✓ Custom API Design Rules</li>
                    <li className="flex items-center gap-2">✓ 24/7 Dedicated Support</li>
                    <li className="flex items-center gap-2">✓ 99.9% SLA & Dedicated Server</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    alert('Please contact support@apilens.io for a custom Enterprise plan inquiry.');
                  }}
                  className="w-full rounded-xl bg-gray-800 hover:bg-gray-700 py-2.5 text-xs font-semibold text-gray-200 transition-all"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        selectedPlan={selectedPlan}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
}
