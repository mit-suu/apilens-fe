'use client';

import { useEffect, useState } from 'react';
import { createCheckoutOrder, getOrderStatus, type Order } from '@/libs/api';
import { Loader2, CheckCircle2, XCircle, QrCode, ShieldCheck, Copy, Check } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: 'pro' | 'enterprise';
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, selectedPlan, onSuccess }: PaymentModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOrder(null);
      setError('');
      return;
    }

    const initOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const createdOrder = await createCheckoutOrder(selectedPlan);
        setOrder(createdOrder);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to create payment order');
      } finally {
        setLoading(false);
      }
    };

    initOrder();
  }, [isOpen, selectedPlan]);

  // Polling order status every 3 seconds if status is pending
  useEffect(() => {
    if (!order || order.status !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const updated = await getOrderStatus(order._id);
        if (updated.status === 'paid') {
          setOrder(updated);
          clearInterval(interval);
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order, onSuccess]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const planName = selectedPlan === 'pro' ? 'Pro Plan (20.000 Credits)' : 'Enterprise Plan';
  const planPrice = selectedPlan === 'pro' ? '10,000 VND' : 'Liên hệ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[#121827] p-6 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
            <QrCode className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Nâng cấp {planName}</h3>
          <p className="text-xs text-gray-400 mt-1">20.000 Credits / tháng · PDF/CSV Export · Priority Queue</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-sm text-gray-400">Đang khởi tạo mã QR thanh toán...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400 mb-4">
            <XCircle className="mx-auto h-6 w-6 mb-2" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={onClose}
              className="mt-3 rounded-lg bg-gray-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
            >
              Đóng
            </button>
          </div>
        )}

        {order && !loading && (
          <div className="space-y-4">
            {order.status === 'paid' ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <CheckCircle2 className="h-16 w-16 text-emerald-400 animate-bounce" />
                <h4 className="text-2xl font-bold text-emerald-400">Thanh toán thành công!</h4>
                <p className="text-sm text-gray-300">
                  Gói <span className="font-semibold text-white">{planName}</span> của bạn đã được kích hoạt.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-center bg-white p-3 rounded-xl shadow-inner border border-gray-200">
                  {order.qrCodeUrl ? (
                    <img
                      src={order.qrCodeUrl}
                      alt="VietQR Payment Code"
                      className="h-56 w-56 object-contain"
                    />
                  ) : (
                    <div className="h-56 w-56 flex items-center justify-center text-gray-800">
                      QR Code Unavailable
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-xl bg-gray-900/60 p-3.5 border border-gray-800 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Số tiền:</span>
                    <span className="font-bold text-emerald-400 text-sm">{planPrice}</span>
                  </div>

                  <div className="flex justify-between items-center text-gray-300 pt-1 border-t border-gray-800">
                    <span>Nội dung CK:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-amber-300">
                      <span>{order.paymentDescription}</span>
                      <button
                        onClick={() => copyToClipboard(order.paymentDescription || '')}
                        className="p-1 hover:text-white transition-colors"
                        title="Copy nội dung"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 animate-pulse py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang chờ giao dịch từ ngân hàng...</span>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                  <span>Hệ thống tự động kích hoạt gói sau khi nhận khoản tiền</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
