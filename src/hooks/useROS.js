import { useEffect, useState, useCallback, useRef } from 'react';
import { Ros, Topic } from 'roslib';

export function useROS() {
  const [ros, setRos] = useState(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [systemStats, setSystemStats] = useState({ cpu: 0, gpu: 0, ram: 0, voltage: 12.0, temp: 45 });
  const [locStatus, setLocStatus] = useState('LOCALIZED');

  const addLog = useCallback((message, type = 'info') => {
    setLogs((prev) => [...prev.slice(-49), { id: Date.now(), message, type, time: new Date().toLocaleTimeString() }]);
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const url = `ws://${hostname}:9090`;
    const rosInstance = new Ros({ url });

    rosInstance.on('connection', () => {
      setConnected(true);
      addLog('ROS 브리지에 연결되었습니다.', 'success');
    });

    rosInstance.on('error', (error) => {
      setConnected(false);
      addLog(`ROS 연결 오류: ${error.message || 'rosbridge_server가 실행 중인지 확인하세요.'}`, 'error');
    });

    rosInstance.on('close', () => {
      setConnected(false);
      addLog('ROS 연결이 종료되었습니다.', 'warn');
    });

    setRos(rosInstance);

    // Fetch real system stats from the Jetson
    const statsInterval = setInterval(async () => {
      try {
        const response = await fetch('/stats.json');
        if (response.ok) {
          const data = await response.json();
          setSystemStats(data);
        }
      } catch (error) {
        // Fallback or silent error
      }
    }, 1000);

    return () => {
      rosInstance.close();
      clearInterval(statsInterval);
    };
  }, [addLog]);

  const publishVelocity = useCallback((linear, angular) => {
    if (!ros || !connected) return;
    const cmdVel = new Topic({ ros, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
    cmdVel.publish({
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular }
    });
  }, [ros, connected]);

  const setGoalPose = useCallback((pose) => {
    if (!ros || !connected) return;
    const goalTopic = new Topic({ ros, name: '/goal_pose', messageType: 'geometry_msgs/PoseStamped' });
    goalTopic.publish({
      header: { frame_id: 'map', stamp: { secs: 0, nsecs: 0 } },
      pose: {
        position: { x: pose.x, y: pose.y, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 }
      }
    });
    addLog(`목표 지점 전송됨: x=${pose.x.toFixed(2)}, y=${pose.y.toFixed(2)}`, 'info');
  }, [ros, connected, addLog]);

  const setInitialPose = useCallback((pose) => {
    if (!ros || !connected) return;
    const initTopic = new Topic({ ros, name: '/initialpose', messageType: 'geometry_msgs/PoseWithCovarianceStamped' });
    const covariance = new Array(36).fill(0);
    covariance[0] = 0.25; covariance[7] = 0.25; covariance[35] = 0.06;
    initTopic.publish({
      header: { frame_id: 'map', stamp: { secs: 0, nsecs: 0 } },
      pose: {
        pose: {
          position: { x: pose.x, y: pose.y, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 }
        },
        covariance: covariance
      }
    });
    addLog(`초기 위치 설정됨: x=${pose.x.toFixed(2)}, y=${pose.y.toFixed(2)}`, 'success');
    setLocStatus('LOCALIZED');
  }, [ros, connected, addLog]);

  return { ros, connected, logs, addLog, publishVelocity, setGoalPose, setInitialPose, systemStats, locStatus, setLocStatus };
}
