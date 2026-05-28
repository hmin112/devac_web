import React from 'react';

export function StatusHeader({ connected, stats, locStatus, commandStatus }) {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-brand-navy/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-blue/20 rounded-xl flex items-center justify-center">
          <div className="w-4 h-4 bg-brand-blue rounded-full animate-pulse" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight leading-none">Wave Rover</h1>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">자율 주행 시스템</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'}`} />
          <span className="text-sm font-bold tracking-tighter text-white/70">{connected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
        
        <div className="h-6 w-px bg-white/10" />

        {/* Command Execution Status */}
        {commandStatus && commandStatus.type !== 'IDLE' && (
          <>
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter text-center w-full">명령 상태</span>
              <div className={`text-[10px] font-bold px-3 py-1 rounded-lg flex items-center gap-2 ${
                commandStatus.type === 'PENDING' ? 'bg-brand-blue/20 text-brand-blue animate-pulse' :
                commandStatus.type === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {commandStatus.type === 'PENDING' && <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-ping" />}
                {commandStatus.message}
              </div>
            </div>
            <div className="h-6 w-px bg-white/10" />
          </>
        )}

        {/* Localization Status */}
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">위치 인식 상태</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            locStatus === 'LOCALIZED' ? 'bg-green-500/20 text-green-400' :
            locStatus === 'UNCERTAIN' ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400 animate-pulse'
          }`}>
            {locStatus === 'LOCALIZED' ? '인식 중' : (locStatus === 'UNCERTAIN' ? '불안정' : (locStatus === 'LOST' ? '위 치 상실' : '알 수 없음'))}
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* Jetson Metrics */}
        <div className="flex items-center gap-6">
          {/* CPU */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">CPU</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-medium text-white/90">{stats?.cpu || 0}%</span>
              <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-blue transition-all duration-500" style={{ width: `${stats?.cpu || 0}%` }} />
              </div>
            </div>
          </div>

          {/* GPU */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">GPU</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-medium text-white/90">{stats?.gpu || 0}%</span>
              <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${stats?.gpu || 0}%` }} />
              </div>
            </div>
          </div>

          {/* RAM */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">RAM</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-medium text-white/90">{stats?.ram || 0}%</span>
              <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 transition-all duration-500" style={{ width: `${stats?.ram || 0}%` }} />
              </div>
            </div>
          </div>

          {/* Voltage */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Voltage</span>
            <span className="text-sm font-mono font-medium text-brand-blue">{stats?.voltage || '0.0'}V</span>
          </div>

          {/* Temp */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-white/30 uppercase font-bold tracking-tighter">Temp</span>
            <span className="text-sm font-mono font-medium text-white/90">{stats?.temp || 0}°C</span>
          </div>
        </div>
      </div>
    </header>
  );
}
