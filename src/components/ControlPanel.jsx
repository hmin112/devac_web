import React, { useState, useRef, useEffect } from 'react';

export function ControlPanel({ 
  connected, logs, publishVelocity, setGoalPose, addLog, 
  useMockMap, setUseMockMap, homePose, isSettingInitialPose, 
  setIsSettingInitialPose, currentMap, setCurrentMap, executeCommand
}) {
  const [command, setCommand] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleVLACommand = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    // Simulate VLA action through executeCommand
    executeCommand('VLA_ACTION', { text: command });
    setCommand('');
  };

  const handleEmergencyStop = () => {
    executeCommand('EMERGENCY_STOP');
  };

  const goHome = () => {
    if (!homePose) {
      addLog('복귀 주소가 설정되지 않았습니다. 버튼을 지도로 드래그하여 설정하세요.', 'warn');
      return;
    }
    
    executeCommand('RETURN_HOME');

    // Trigger simulation if in mock mode via custom event
    if (useMockMap && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trigger-go-home', { detail: homePose }));
    }
  };

  const handleLoadMap = () => {
    if (currentMap === 'DEVSIGN') {
      setUseMockMap(true);
      addLog('DEVSIGN 지도를 로드합니다.', 'success');
    } else {
      addLog(`${currentMap} 지도는 현재 준비 중입니다.`, 'warn');
    }
  };

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/wave-rover-home', 'set-home');
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-96 h-[calc(100vh-73px)] bg-brand-navy border-l border-white/5 flex flex-col overflow-hidden">
      {/* VLA Input */}
      <div className="p-6 pt-10 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">명령 센터</h3>
          <span className="text-[9px] text-white/20 italic">Vision-Language-Action 모델 기반</span>
        </div>
        <form onSubmit={handleVLACommand} className="space-y-3">
          <div className="relative group">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="예: 책상으로 이동해줘"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-all placeholder:text-white/20"
            />
            <button 
              type="submit"
              className="absolute right-2 top-2 p-1.5 bg-brand-blue rounded-lg text-black hover:scale-105 active:scale-95 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Actions */}
      <div className="p-6 border-b border-white/5">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">빠른 실행</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Set Initial Pose Button */}
          <button 
            onClick={() => setIsSettingInitialPose(!isSettingInitialPose)}
            className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-2xl transition-all group ${isSettingInitialPose ? 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isSettingInitialPose ? 'bg-orange-500/20' : 'bg-white/5'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSettingInitialPose ? 'text-orange-500' : 'text-white/70'}><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
            </div>
            <span className={`text-[11px] font-medium ${isSettingInitialPose ? 'text-orange-500' : 'text-white/70'}`}>위 치 초기화</span>
          </button>

          {/* Map Load Button */}
          <button 
            onClick={handleLoadMap}
            className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-2xl transition-colors group ${useMockMap && currentMap === 'DEVSIGN' ? 'bg-brand-blue/20 border-brand-blue/50 shadow-[0_0_15px_rgba(0,210,255,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${useMockMap && currentMap === 'DEVSIGN' ? 'bg-brand-blue/20' : 'bg-white/5'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={useMockMap && currentMap === 'DEVSIGN' ? 'text-brand-blue' : 'text-white/70'}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
            </div>
            <span className={`text-xs font-medium ${useMockMap && currentMap === 'DEVSIGN' ? 'text-brand-blue' : 'text-white/70'}`}>맵 로드</span>
          </button>

          <div className="flex flex-col gap-2">
            <button 
              onClick={goHome}
              draggable
              onDragStart={onDragStart}
              className={`w-full flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group cursor-grab active:cursor-grabbing ${!homePose ? 'opacity-50' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <span className="text-xs font-medium text-white/70">복귀</span>
            </button>
          </div>
          
          <button 
            onClick={handleEmergencyStop}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <span className="text-xs font-medium text-red-500">긴급 정지</span>
          </button>
        </div>

        {/* Map Selection Bar */}
        <div className="mt-6">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">지도 선택</h3>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
            {['DEVSIGN', '4층 복도', 'CAC'].map((mapName) => (
              <button
                key={mapName}
                onClick={() => {
                  setCurrentMap(mapName);
                  if (mapName !== 'DEVSIGN') setUseMockMap(false);
                  addLog(`지도가 변경되었습니다: ${mapName}`, 'info');
                }}
                className={`flex-1 py-2 px-1 text-[10px] font-bold rounded-lg transition-all ${
                  currentMap === mapName 
                  ? 'bg-brand-blue text-black shadow-lg' 
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {mapName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Log */}
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex justify-between">
          시스템 로그
          <span className="animate-pulse lowercase font-normal opacity-50">실시간</span>
        </h3>
        <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="mb-2 flex gap-2">
              <span className="text-white/20 whitespace-nowrap">[{log.time}]</span>
              <span className={`
                ${log.type === 'error' ? 'text-red-400' : ''}
                ${log.type === 'success' ? 'text-green-400' : ''}
                ${log.type === 'warn' ? 'text-yellow-400' : ''}
                ${log.type === 'info' ? 'text-brand-blue/70' : ''}
              `}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </aside>
  );
}
