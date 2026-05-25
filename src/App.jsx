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

  return (
    <div className="flex flex-col h-screen bg-brand-dark text-white selection:bg-brand-blue/30 overflow-hidden">
      {/* Top Header */}
      <StatusHeader connected={connected} stats={systemStats} locStatus={locStatus} />

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left: Map Viewport */}
        <MapViewport 
          ros={ros} 
          connected={connected} 
          setGoalPose={setGoalPose} 
          setInitialPose={setInitialPose}
          mockMapUrl={useMockMap ? '/test_map.pgm' : null}
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
          setGoalPose={setGoalPose}
          addLog={addLog}
          useMockMap={useMockMap}
          setUseMockMap={setUseMockMap}
          homePose={homePose}
          isSettingInitialPose={isSettingInitialPose}
          setIsSettingInitialPose={setIsSettingInitialPose}
          currentMap={currentMap}
          setCurrentMap={setCurrentMap}
        />
      </main>

      {/* Footer / Info Bar (Optional) */}
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
