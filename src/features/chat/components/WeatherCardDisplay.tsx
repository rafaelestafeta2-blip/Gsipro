import React from 'react';
import { WeatherData } from '../../../shared/types';
import { MapPin } from 'lucide-react';

interface WeatherCardDisplayProps {
  weather?: WeatherData;
}

export default function WeatherCardDisplay({ weather }: WeatherCardDisplayProps) {
  if (!weather) return null;
  const isNight = weather.is_day === false;
  const code = weather.weather_code || 0;

  let bgClass = 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700';
  if (isNight) {
    bgClass = 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900';
  } else if (code >= 50) {
    bgClass = 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900';
  }

  return (
    <div className="space-y-2 p-1 w-full max-w-[320px]">
      <div className={`relative rounded-3xl overflow-hidden p-4 shadow-xl border border-white/20 text-white flex flex-col gap-3 ${bgClass}`}>
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={14} className="text-amber-300 flex-shrink-0 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider truncate">
              {weather.city}, {weather.country || 'Portugal'}
            </span>
          </div>
          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-md">
            Ao Vivo
          </span>
        </div>

        <div className="flex items-center justify-between z-10 my-1">
          <div>
            <div className="flex items-start">
              <span className="text-4xl font-black tracking-tight leading-none">
                {weather.temp}
              </span>
              <span className="text-lg font-bold text-amber-200 ml-0.5">°C</span>
            </div>
            <p className="text-[11px] font-bold text-white/90 mt-1">
              {weather.condition}
            </p>
          </div>

          <div className="text-4xl sm:text-5xl drop-shadow-lg animate-pulse transform hover:scale-110 transition-transform">
            {weather.icon}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/20 text-center z-10 bg-black/20 rounded-2xl p-2 backdrop-blur-md">
          <div>
            <span className="text-[8px] uppercase font-bold text-white/60 block">Sensação</span>
            <span className="text-[11px] font-black text-amber-200">{weather.feels_like}°C</span>
          </div>
          <div>
            <span className="text-[8px] uppercase font-bold text-white/60 block">Humidade</span>
            <span className="text-[11px] font-black text-cyan-200">{weather.humidity}%</span>
          </div>
          <div>
            <span className="text-[8px] uppercase font-bold text-white/60 block">Vento</span>
            <span className="text-[11px] font-black text-emerald-200">{weather.wind_speed} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
