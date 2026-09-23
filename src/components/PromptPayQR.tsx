import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, ShieldCheck, Smartphone, DollarSign } from 'lucide-react';
import { generatePromptPayPayload } from '../utils/promptpay';

interface PromptPayQRProps {
  phone: string;
  amount: number;
  storeName?: string;
}

export const PromptPayQR: React.FC<PromptPayQRProps> = ({ phone, amount, storeName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const payload = generatePromptPayPayload(phone, amount);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            console.error('QR code generation error:', error);
            setQrError('ไม่สามารถสร้าง QR Code ได้');
          }
        }
      );
    }
  }, [payload]);

  const copyToClipboard = (text: string, type: 'phone' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-center shadow-2xl space-y-4">
      <div className="flex items-center justify-center space-x-2 text-emerald-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <span className="font-bold text-sm tracking-wide text-white">ชำระเงินผ่าน PromptPay QR Code</span>
      </div>

      {/* PromptPay Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-emerald-950/60 to-blue-900/40 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-xs">
            PP
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">พร้อมเพย์ (PromptPay)</p>
            <p className="text-[10px] text-slate-400">{storeName || 'ร้านค้าทางการ'}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
            ระบุยอดอัตโนมัติ
          </span>
        </div>
      </div>

      {/* QR Canvas Container */}
      <div className="bg-white p-3.5 rounded-2xl inline-block shadow-inner border-2 border-emerald-400/50 relative group">
        <canvas ref={canvasRef} className="mx-auto rounded-lg" />
        {qrError && <p className="text-xs text-red-600 mt-2">{qrError}</p>}
      </div>

      <p className="text-xs text-slate-300 font-medium flex items-center justify-center space-x-1">
        <QrCode className="w-4 h-4 text-emerald-400" />
        <span>สแกนด้วยแอปธนาคารได้ทุกธนาคารในประเทศไทย</span>
      </p>

      {/* Manual Copy Account & Amount Details */}
      <div className="space-y-2 text-xs text-left">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">เบอร์พร้อมเพย์รับเงิน:</span>
              <span className="font-mono font-bold text-sm text-white">{phone}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(phone, 'phone')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer"
          >
            {copiedPhone ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกเบอร์</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">ยอดเงินที่ต้องชำระสุทธิ:</span>
              <span className="font-mono font-extrabold text-base text-emerald-400">
                ฿{amount.toFixed(2)} บาท
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(amount.toFixed(2), 'amount')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer"
          >
            {copiedAmount ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">คัดลอกยอด</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกยอด</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
