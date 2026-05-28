import React from 'react';
import { useROS } from './hooks/useROS';
import { StatusHeader } from './components/StatusHeader';
import { MapViewport } from './components/MapViewport';
import { ControlPanel } from './components/ControlPanel';
import './App.css';

function App() {
  const { ros, connected, logs, addLog, publishVelocity, setGoalPose, setInitialPose, systemStats, locStatus, setLocStatus } = useROS();
  const [useMockMap, setUseMockMap] = React.useState(false);
  const [homePose, setHomePose] = React.useState(null);
  const [isSettingInitialPose, setIsSettingInitialPose] = React.useState(false);
  const [currentMap, setCurrentMap] = React.useState('DEVSIGN');
  
  // New state for tracking command status
  const [commandStatus, setCommandStatus] = React.useState({ id: null, type: 'IDLE', message: '' });

  // Unified command execution logic
  const executeCommand = React.useCallback(async (cmd, data) => {
    const cmdId = Date.now();
    
    // UI Feedback for priority command
    const isUrgent = cmd === 'EMERGENCY_STOP';
    setCommandStatus({ 
      id: cmdId, 
      type: isUrgent ? 'ERROR' : 'PENDING', 
      message: isUrgent ? '긴급 정지 실행됨!' : `"${cmd}" 처리 중...` 
    });
    addLog(`명령 전송: ${cmd}`, isUrgent ? 'error' : 'info');

    try {
      // Logic for each command type
      switch (cmd) {
        case 'INIT_POSE':
          setInitialPose(data);
          break;
        case 'MOVE_TO':
          setGoalPose(data);
          break;
        case 'RETURN_HOME':
          if (!homePose) throw new Error('복귀 위치가 설정되지 않았습니다.');
          setGoalPose(homePose);
          break;
        case 'EMERGENCY_STOP':
          publishVelocity(0, 0);
          // If in simulation mode, clear intervals or stop motion
          window.dispatchEvent(new CustomEvent('emergency-stop-triggered'));
          break;
        default:
          throw new Error('알 수 없는 명령입니다.');
      }

      // Emergency stop is immediate success
      if (isUrgent) {
        setTimeout(() => {
          setCommandStatus(prev => prev.id === cmdId ? { id: null, type: 'IDLE', message: '' } : prev);
        }, 5000);
        return;
      }

      // Simulation: Assume success after 1 second (replace with real bridge feedback later)
      setTimeout(() => {
        setCommandStatus({ id: cmdId, type: 'SUCCESS', message: `"${cmd}" 성공` });
        addLog(`명령 성공: ${cmd}`, 'success');
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setCommandStatus(prev => prev.id === cmdId ? { id: null, type: 'IDLE', message: '' } : prev);
        }, 3000);
      }, 1000);

    } catch (error) {
      setCommandStatus({ id: cmdId, type: 'ERROR', message: error.message });
      addLog(`명령 실패: ${error.message}`, 'error');
    }
  }, [setInitialPose, setGoalPose, homePose, addLog, publishVelocity]);

  // Determine which map URL to use
  const getMapUrl = () => {
    if (!useMockMap) return null;
    if (currentMap === 'DEVSIGN') return '/devsign.pgm';
    return null;
  };

  return (
    <div className="flex flex-col h-screen bg-brand-dark text-white selection:bg-brand-blue/30 overflow-hidden">
      {/* Top Header - Pass commandStatus */}
      <StatusHeader 
        connected={connected} 
        stats={systemStats} 
        locStatus={locStatus} 
        commandStatus={commandStatus}
      />

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Map Viewport */}
        <MapViewport 
          ros={ros} 
          connected={connected} 
          setGoalPose={(pose) => executeCommand('MOVE_TO', pose)} 
          setInitialPose={(pose) => executeCommand('INIT_POSE', pose)}
          mockMapUrl={getMapUrl()}
          addLog={addLog}
          homePose={homePose}
          setHomePose={setHomePose}
          isSettingInitialPose={isSettingInitialPose}
          setIsSettingInitialPose={setIsSettingInitialPose}
          locStatus={locStatus}
          setLocStatus={setLocStatus}
          currentMapName={currentMap}
        />

        {/* Right Sidebar: Control Panel */}
        <ControlPanel 
          connected={connected} 
          logs={logs} 
          publishVelocity={publishVelocity} 
          setGoalPose={(pose) => executeCommand('MOVE_TO', pose)}
          addLog={addLog}
          useMockMap={useMockMap}
          setUseMockMap={setUseMockMap}
          homePose={homePose}
          isSettingInitialPose={isSettingInitialPose}
          setIsSettingInitialPose={setIsSettingInitialPose}
          currentMap={currentMap}
          setCurrentMap={setCurrentMap}
          executeCommand={executeCommand}
        />
      </main>

      {/* Footer */}
      <footer className="h-6 bg-brand-blue/5 border-t border-white/5 flex items-center justify-between px-4 text-[9px] text-white/20 uppercase tracking-[0.2em]">
        <span>Wave Rover OS v2.4.0-상태: 안정</span>
        <div className="flex gap-4">
          <span>위도: 36.2342</span>
          <span>경도: 127.1241</span>
          <span>고도: 42m</span>
        </div>
        <span>ROS 2 Humble / Galactic 브리지</span>
      </footer>
    </div>
  );
}

export default App;
