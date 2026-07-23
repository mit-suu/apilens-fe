'use client';

import { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import {
  getCurrentUser,
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from '@/libs/api';
import { type AuthUser } from '@/types/global';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  DollarSign,
  Layers,
  Zap,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const [stats, setStats] = useState<{
    totalUsers: number;
    totalAnalyses: number;
    totalIssues: number;
    averageScore: number;
    totalRevenue: number;
    paidOrdersCount: number;
    totalAiRequests: number;
    estimatedTokens: number;
    estimatedCostUsd: number;
  } | null>(null);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Strict Route Guard check: only mit-suu or admin role
        const isMitSuu = currentUser.providers?.username === 'mit-suu';
        const isAdmin = currentUser.role === 'admin';

        if (!isMitSuu && !isAdmin) {
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }

        const [adminStats, adminUsers] = await Promise.all([getAdminStats(), getAdminUsers()]);
        setStats(adminStats);
        setUsers(adminUsers || []);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setIsUnauthorized(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handlePlanChange = async (userId: string, newPlan: string) => {
    try {
      const updated = await updateAdminUser(userId, { plan: newPlan });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setActionMessage(`Đã cập nhật gói thành ${newPlan.toUpperCase()}`);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (e) {
      alert('Failed to update user plan');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setActionMessage('Đã xóa người dùng khỏi hệ thống');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-sm text-gray-400">Verifying Admin Access Guard...</p>
        </div>
      </div>
    );
  }

  // Render 403 Forbidden Page if not mit-suu or admin
  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">403 — Restricted Area</h1>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          Admin Console chỉ dành riêng cho tài khoản <span className="font-mono text-amber-400 font-bold">username === "mit-suu"</span>. Bạn không có quyền truy cập trang này.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all"
        >
          Quay lại User Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-[#0b0f19] text-white selection:bg-amber-500 selection:text-slate-950">
      {user && <AppHeader user={user} activeTab="admin" />}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {actionMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400 text-center animate-fade-in">
            {actionMessage}
          </div>
        )}

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-5 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Tổng Người Dùng</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats?.totalUsers || 0}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-5 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Tổng Scans System</span>
              <Layers className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-extrabold text-cyan-400">{stats?.totalAnalyses || 0}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-5 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Tổng Lỗi Phát Hiện</span>
              <ShieldAlert className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-3xl font-extrabold text-rose-400">{stats?.totalIssues || 0}</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-5 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Doanh Thu Payment</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">
              {(stats?.totalRevenue || 0).toLocaleString()} VND
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#121827] p-5 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">AI Usage Total</span>
              <Zap className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-3xl font-extrabold text-purple-400">
              ${(stats?.estimatedCostUsd || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* User Management Section */}
        <div className="rounded-2xl border border-gray-800 bg-[#121827] p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Quản Lý Người Dùng & Gán Gói</h2>
              <p className="text-xs text-gray-400">Danh sách tài khoản toàn bộ hệ thống APILens</p>
            </div>
            <span className="text-xs text-gray-400 font-mono">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-800 bg-gray-900/80 text-gray-400 uppercase">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email / Github</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Gói Hiện Tại (Plan)</th>
                  <th className="p-3">Credits / Tháng</th>
                  <th className="p-3">Ngày Tham Gia</th>
                  <th className="p-3 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <img src={u.avatarUrl || 'https://github.com/github.png'} className="h-6 w-6 rounded-full" alt="" />
                      <span>{u.name || 'Anonymous'}</span>
                    </td>
                    <td className="p-3 text-gray-400 font-mono">{u.email || u.providers?.username || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : u.plan === 'pro' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        {u.plan || 'FREE'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-300">
                      {(u.credits !== undefined ? u.credits : 500).toLocaleString()} / {(u.maxCredits || 500).toLocaleString()}
                    </td>
                    <td className="p-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-2">
                      {/* Select Plan override */}
                      <select
                        value={u.plan || 'free'}
                        onChange={(e) => handlePlanChange(u.id, e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="free">Set FREE</option>
                        <option value="pro">Set PRO</option>
                        <option value="enterprise">Set ENTERPRISE</option>
                      </select>

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors"
                        title="Xóa người dùng"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
