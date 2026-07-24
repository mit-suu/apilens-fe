'use client';

import Link from 'next/link';
import { Crown, Sparkles, CheckCircle, X } from 'lucide-react';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumUpgradeModal({ isOpen, onClose }: PremiumUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-amber-500/10 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20">
              <Crown className="h-6 w-6 fill-current" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/20">
                Premium Feature
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">Swagger &amp; Live Testing</h3>
            </div>
          </div>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Tính năng tự động sinh tài liệu <strong>OpenAPI 3.0 (Swagger)</strong> và <strong>Test Live Endpoints</strong> trực tiếp trên trình duyệt là tính năng cao cấp dành riêng cho tài khoản <strong>Pro</strong> &amp; <strong>Enterprise</strong>.
          </p>

          <div className="space-y-3 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-start gap-2 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Tự động tạo Swagger Spec chuẩn 1-click không gây delay.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Bảo mật tuyệt đối (Sanitize tự động JWT &amp; Secret keys).</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Interactive Live Testing trên Sandbox UI trực tiếp từ Browser.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Export OpenAPI JSON/YAML &amp; Tự động nhúng vào Merge Request.</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-all"
            >
              Bỏ qua
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Nâng cấp ngay
            </Link>
          </div>
        </div>
      </div></>
  );
}

export { PremiumUpgradeModal };
