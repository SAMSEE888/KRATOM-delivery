import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { calculateHaversineDistance, calculateDeliveryFee } from '../utils/distance';

interface PinMapProps {
  storeLat: number;
  storeLng: number;
  baseDeliveryFee: number;
  baseDistanceKm: number;
  feePerExtraKm: number;
  selectedLat: number;
  selectedLng: number;
  selectedAddress: string;
  onLocationSelect: (lat: number, lng: number, address: string, distanceKm: number, fee: number) => void;
}

export const PinMap: React.FC<PinMapProps> = ({
  storeLat,
  storeLng,
  baseDeliveryFee,
  baseDistanceKm,
  feePerExtraKm,
  selectedLat,
  selectedLng,
  selectedAddress,
  onLocationSelect,
}) => {
  const [lat, setLat] = useState<number>(selectedLat || storeLat + 0.01);
  const [lng, setLng] = useState<number>(selectedLng || storeLng + 0.01);
  const [address, setAddress] = useState<string>(selectedAddress || '');
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const distance = calculateHaversineDistance(storeLat, storeLng, lat, lng);
  const feeInfo = calculateDeliveryFee(distance, baseDeliveryFee, baseDistanceKm, feePerExtraKm);

  useEffect(() => {
    onLocationSelect(lat, lng, address, distance, feeInfo.shippingFee);
  }, [lat, lng, address]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์ของคุณไม่รองรับการระบุพิกัด GPS');
      return;
    }

    setLoadingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setLoadingGps(false);
        if (!address) {
          setAddress(`ตำแหน่ง GPS (${newLat.toFixed(5)}, ${newLng.toFixed(5)})`);
        }
      },
      (error) => {
        setLoadingGps(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('คุณไม่อนุญาตการเข้าถึงตำแหน่ง GPS โปรดเลือกพิกัดจากตัวเลือกด้านล่าง');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('ไม่สามารถระบุพิกัดตำแหน่งในขณะนี้ได้');
            break;
          case error.TIMEOUT:
            setGpsError('การขอรับพิกัด GPS หมดเวลา โปรดลองอีกครั้ง');
            break;
          default:
            setGpsError('เกิดข้อผิดพลาดในการรับพิกัด GPS');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Quick preset locations in Bangkok / Thailand for easy testing
  const presets = [
    { name: 'อนุสาวรีย์ชัยสมรภูมิ (0.5 กม.)', lat: storeLat + 0.004, lng: storeLng + 0.003, addr: 'บริเวณอนุสาวรีย์ชัยสมรภูมิ กรุงเทพฯ' },
    { name: 'พญาไท / อารีย์ (1.8 กม.)', lat: storeLat + 0.015, lng: storeLng + 0.012, addr: 'อาคารพญาไทพลาซ่า ถนนพญาไท' },
    { name: 'ห้วยขวาง / ดินแดง (3.5 กม.)', lat: storeLat + 0.028, lng: storeLng + 0.025, addr: 'ประชาราษฎร์บำเพ็ญ แขวงห้วยขวาง' },
    { name: 'สยามสแควร์ (2.2 กม.)', lat: storeLat - 0.018, lng: storeLng - 0.005, addr: 'ศูนย์การค้าสยามสแควร์ ปทุมวัน' },
  ];

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-slate-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base sm:text-lg">ปักหมุดตำแหน่งจัดส่ง</h3>
            <p className="text-xs text-slate-400">คำนวณระยะทางจากร้านและค่าจัดส่งอัตโนมัติ</p>
          </div>
        </div>
      </div>

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={loadingGps}
        className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
      >
        <Navigation className={`w-5 h-5 ${loadingGps ? 'animate-spin' : ''}`} />
        <span>{loadingGps ? 'กำลังค้นหาตำแหน่ง GPS...' : '📍 ดึงตำแหน่งปัจจุบันของฉัน (GPS Auto-Detect)'}</span>
      </button>

      {gpsError && (
        <div className="flex items-start space-x-2 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Presets Quick Pick */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 flex items-center space-x-1">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>หรือเลือกตำแหน่งจำลองด่วนสำหรับทดสอบ:</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setLat(preset.lat);
                setLng(preset.lng);
                setAddress(preset.addr);
              }}
              className="text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-emerald-500/50 transition-all text-xs text-slate-300 flex items-center justify-between group cursor-pointer"
            >
              <span className="font-medium group-hover:text-emerald-400">{preset.name}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full group-hover:bg-emerald-500/20 group-hover:text-emerald-300">
                เลือก
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Latitude & Longitude Sliders / Controls */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">ปรับพิกัดละติจูด / ลองจิจูดแบบละเอียด:</span>
          <span className="text-emerald-400 font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Latitude (ละติจูด)</span>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || storeLat)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Longitude (ลองจิจูด)</span>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value) || storeLng)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Address Detail Input */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          รายละเอียดที่อยู่ / จุดสังเกตเพิ่มเติม <span className="text-emerald-400">*</span>
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="เช่น บ้านเลขที่ 123/4 หมู่บ้านเขียวขจี ซอย 5 (ฝากไว้ที่ป้อมยาม)"
          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
        />
      </div>

      {/* Distance & Delivery Fee Summary Card */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">ระยะทางจากร้านค้า:</span>
          <span className="text-base font-extrabold text-emerald-400">{distance.toFixed(1)} กม.</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block text-[11px]">ค่าจัดส่งประมาณการ:</span>
          <span className="text-base font-extrabold text-emerald-300">
            {feeInfo.shippingFee} บาท
          </span>
          <span className="text-[10px] text-slate-400 block">
            ({baseDeliveryFee}บ. แรก + {feePerExtraKm}บ./กม.ถัดไป)
          </span>
        </div>
      </div>
    </div>
  );
};
