/**
 * MapViewport.jsx - Fixed Syntax Error & Polished UI
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Topic } from 'roslib';
import { parsePGM } from '../utils/pgmParser';

export function MapViewport({ 
  ros, connected, setGoalPose, setInitialPose, 
  mockMapUrl, addLog, homePose, setHomePose, 
  isSettingInitialPose, setIsSettingInitialPose,
  locStatus, setLocStatus
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const metricsRef = useRef({ scale: 1, mapW: 0, mapH: 0 });
  
  const [mapData, setMapData] = useState(null);
  const [robotPose, setRobotPose] = useState({ x: 0, y: 0, yaw: 0 });
  const [goal, setGoal] = useState(null);
  const [path, setPath] = useState([]);
  const [localizationProgress, setLocalizationProgress] = useState(null);
  
  const simInterval = useRef(null);

  useEffect(() => {
    if (mockMapUrl) {
      parsePGM(mockMapUrl).then((data) => {
        const { width, height, resolution, origin } = data.info;
        setMapData(data);
        setRobotPose({ 
          x: origin.position.x + (width * resolution) / 2, 
          y: origin.position.y + (height * resolution) / 2, 
          yaw: 0 
        }); 
        setGoal(null); setPath([]);
      }).catch(console.error);
      return;
    }
    if (!ros || !connected) return;
    const mapTopic = new Topic({ ros, name: '/map', messageType: 'nav_msgs/OccupancyGrid' });
    const poseTopic = new Topic({ ros, name: '/robot_pose', messageType: 'geometry_msgs/Pose' });
    const pathTopic = new Topic({ ros, name: '/plan', messageType: 'nav_msgs/Path' });
    mapTopic.subscribe(setMapData);
    poseTopic.subscribe((message) => {
      const q = message.orientation;
      const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
      setRobotPose({ x: message.position.x, y: message.position.y, yaw: yaw });
    });
    pathTopic.subscribe((message) => {
      setPath(message.poses.map(p => ({ x: p.pose.position.x, y: p.pose.position.y })));
    });
    return () => { mapTopic.unsubscribe(); poseTopic.unsubscribe(); pathTopic.unsubscribe(); };
  }, [ros, connected, mockMapUrl]);

  const startSimulation = useCallback((targetX, targetY) => {
    if (simInterval.current) clearInterval(simInterval.current);
    const segments = 40;
    const startX = robotPose.x; const startY = robotPose.y;
    const targetYaw = Math.atan2(targetY - startY, targetX - startX);
    setGoal({ x: targetX, y: targetY });
    let step = 0;
    simInterval.current = setInterval(() => {
      if (step >= segments) {
        clearInterval(simInterval.current);
        if (addLog) addLog("목표 지점에 도착했습니다.", "success");
        setGoal(null); setPath([]); return;
      }
      const ratio = step / segments;
      const curX = startX + (targetX - startX) * ratio;
      const curY = startY + (targetY - startY) * ratio;
      setRobotPose({ x: curX, y: curY, yaw: targetYaw });
      setPath([{x: curX, y: curY}, {x: targetX, y: targetY}]);
      step++;
    }, 50);
  }, [robotPose.x, robotPose.y, addLog]);

  useEffect(() => {
    const handleGoHome = (e) => {
      if (localizationProgress !== null) return;
      startSimulation(e.detail.x, e.detail.y);
    };
    window.addEventListener('trigger-go-home', handleGoHome);
    return () => window.removeEventListener('trigger-go-home', handleGoHome);
  }, [startSimulation, localizationProgress]);

  const drawMap = useCallback(() => {
    if (!mapData || !canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const { width: mapW, height: mapH, resolution, origin } = mapData.info;
    const data = mapData.data;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const padding = 60;
    const scale = Math.min((rect.width - padding) / mapW, (rect.height - padding) / mapH);
    metricsRef.current = { scale, mapW, mapH };
    canvas.width = mapW * scale * dpr;
    canvas.height = mapH * scale * dpr;
    canvas.style.width = `${mapW * scale}px`;
    canvas.style.height = `${mapH * scale}px`;
    ctx.scale(dpr * scale, dpr * scale);
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, mapW, mapH);
    const toMapX = (rx) => (rx - origin.position.x) / resolution;
    const toCanvasY = (ry) => mapH - 1 - (ry - origin.position.y) / resolution;

    ctx.beginPath();
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (data[y * mapW + x] === 0) ctx.rect(x, mapH - 1 - y, 1.1, 1.1);
      }
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'; ctx.fill();
    ctx.beginPath();
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (data[y * mapW + x] === 100) ctx.rect(x, mapH - 1 - y, 1.1, 1.1);
      }
    }
    ctx.fillStyle = '#00d2ff'; ctx.fill();
    if (path.length > 1) {
      ctx.beginPath(); ctx.setLineDash([0.5, 0.5]);
      ctx.moveTo(toMapX(path[0].x), toCanvasY(path[0].y));
      for (let i = 1; i < path.length; i++) ctx.lineTo(toMapX(path[i].x), toCanvasY(path[i].y));
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.6)'; ctx.lineWidth = 2 / scale; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.save();
    ctx.translate(toMapX(robotPose.x), toCanvasY(robotPose.y));
    ctx.rotate(-robotPose.yaw);
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 3.5); ctx.closePath();
    ctx.fillStyle = (locStatus === 'LOST') ? '#ff3b30' : (locStatus === 'UNCERTAIN' ? '#ff9500' : 'white');
    ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle; ctx.fill();
    ctx.restore();
    if (homePose) {
      const hx = toMapX(homePose.x); const hy = toCanvasY(homePose.y);
      const hSize = 12 / scale;
      ctx.save(); ctx.translate(hx, hy);
      ctx.beginPath(); ctx.arc(0, 0, 18 / scale, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 149, 0, 0.2)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -hSize); ctx.lineTo(hSize, -hSize/4); ctx.lineTo(hSize, hSize); ctx.lineTo(-hSize, hSize); ctx.lineTo(-hSize, -hSize/4); ctx.closePath();
      ctx.fillStyle = '#FF9500'; ctx.shadowBlur = 15; ctx.shadowColor = '#FF9500'; ctx.fill();
      ctx.fillStyle = '#0a0a0c'; ctx.fillRect(-hSize/4, hSize/4, hSize/2, hSize*0.75);
      ctx.restore();
    }
  }, [mapData, robotPose, path, goal, homePose, locStatus]);

  useEffect(() => { drawMap(); window.addEventListener('resize', drawMap); return () => window.removeEventListener('resize', drawMap); }, [drawMap]);

  const handleCanvasClick = (e) => {
    if (localizationProgress !== null || !mapData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { width: mapW, height: mapH, resolution, origin } = mapData.info;
    const scale = rect.width / mapW;
    const mapX = (e.clientX - rect.left) / scale;
    const mapY = mapH - ((e.clientY - rect.top) / scale);
    const rosX = origin.position.x + mapX * resolution;
    const rosY = origin.position.y + mapY * resolution;

    if (isSettingInitialPose) {
      if (setInitialPose) setInitialPose({ x: rosX, y: rosY });
      setLocalizationProgress(0);
      let p = 0;
      const timer = setInterval(() => {
        p += Math.random() * 20 + 5;
        if (p >= 100) {
          clearInterval(timer); setLocalizationProgress(null);
          if (mockMapUrl) { setRobotPose(prev => ({ ...prev, x: rosX, y: rosY })); if (setLocStatus) setLocStatus('LOCALIZED'); }
          if (addLog) addLog("시스템 위치 초기화 완료", "success");
        } else { setLocalizationProgress(Math.floor(p)); }
      }, 150);
      setIsSettingInitialPose(false);
    } else {
      if (setGoalPose) setGoalPose({ x: rosX, y: rosY });
      if (mockMapUrl) {
        if (addLog) addLog(`좌표 (${rosX.toFixed(2)}, ${rosY.toFixed(2)}) 이동 중`, 'info');
        startSimulation(rosX, rosY);
      }
    }
  };

  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => {
    e.preventDefault();
    if (!mapData || localizationProgress !== null || !canvasRef.current) return;
    const isHome = e.dataTransfer.getData("application/wave-rover-home");
    if (isHome !== "set-home") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { width: mapW, height: mapH, resolution, origin } = mapData.info;
    const scale = rect.width / mapW;
    const mapX = (e.clientX - rect.left) / scale;
    const mapY = mapH - ((e.clientY - rect.top) / scale);
    const rosX = origin.position.x + mapX * resolution;
    const rosY = origin.position.y + mapY * resolution;
    if (setHomePose) setHomePose({ x: rosX, y: rosY });
    if (addLog) addLog(`복귀 주소 설정 완료`, 'success');
  };

  return (
    <div ref={containerRef} onDragOver={onDragOver} onDrop={onDrop} className={`relative flex-1 bg-brand-dark overflow-hidden flex items-center justify-center ${isSettingInitialPose ? 'cursor-crosshair' : 'cursor-default'}`}>
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="rounded-none outline-none" />
      {localizationProgress !== null && (
        <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-brand-navy/90 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 min-w-[280px]">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="white" strokeWidth="4" className="opacity-5" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="#FF9500" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - localizationProgress / 100)}`} className="transition-all duration-300 ease-out" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-mono font-bold text-white">{localizationProgress}%</span>
            </div>
            <div className="flex flex-col items-center gap-1"><h4 className="text-sm font-bold text-white tracking-tight">위치 보정 중...</h4><p className="text-[10px] text-white/40 uppercase tracking-widest">명령 일시 제한됨</p></div>
          </div>
        </div>
      )}
      <div className="absolute top-10 left-6 flex flex-col gap-3 pointer-events-none z-10">
        <div className="bg-brand-dark/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
          <div className="w-2 h-2 bg-brand-blue rounded-full shadow-[0_0_8px_rgba(0,210,255,0.8)] animate-pulse" />
          <span className="text-[11px] font-bold text-white/70 tracking-widest uppercase">{mockMapUrl ? '내비게이션 시뮬레이션' : '시스템 맵 라이브'}</span>
        </div>
      </div>
      <div className="absolute bottom-8 left-8 flex items-center gap-4 pointer-events-none z-10">
        <div className="relative w-16 h-16 bg-brand-navy/80 backdrop-blur-2xl rounded-full border border-white/10 flex items-center justify-center shadow-2xl">
          <div className="absolute inset-1 border border-dashed border-white/5 rounded-full" />
          <div className="relative w-full h-full transition-transform duration-300 ease-out flex items-center justify-center" style={{ transform: `rotate(${(robotPose.yaw * 180) / Math.PI}deg)` }}>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[18px] border-b-red-500 mb-6 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>
          <div className="absolute w-2 h-2 bg-white rounded-full border-2 border-brand-navy" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Robot Heading</span>
          <span className="text-sm font-mono font-medium text-white/90">{Math.round(((robotPose.yaw * 180) / Math.PI + 360) % 360)}°</span>
        </div>
      </div>
    </div>
  );
}
