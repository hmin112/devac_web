import json
import time
import os
import glob
from jtop import jtop

STATS_PATH = '/home/devac/devac_web/public/stats.json'
MAP_SOURCE_DIR = '/home/devac/mapping_map/'
MAP_PUBLIC_PATH = '/home/devac/devac_web/public/devsign.pgm'

def update_map():
    try:
        # mapping_map 폴더에서 가장 최근에 수정된 .pgm 파일을 찾음
        pgm_files = glob.glob(os.path.join(MAP_SOURCE_DIR, '*.pgm'))
        
        if pgm_files:
            # 가장 최신 파일 선택
            latest_map = max(pgm_files, key=os.path.getmtime)
            
            # 파일이 변경되었거나 public에 없을 경우에만 복사
            if not os.path.exists(MAP_PUBLIC_PATH) or \
               os.path.getmtime(latest_map) > os.path.getmtime(MAP_PUBLIC_PATH):
                with open(latest_map, 'rb') as src, open(MAP_PUBLIC_PATH, 'wb') as dst:
                    dst.write(src.read())
                print(f"Map updated from: {latest_map}")
        else:
            # 소스 폴더에 .pgm 파일이 하나도 없으면 public 맵 삭제
            if os.path.exists(MAP_PUBLIC_PATH):
                os.remove(MAP_PUBLIC_PATH)
                print("No map files found in source. Public map removed.")
    except Exception as e:
        print(f"Map update error: {e}")

def main():
    if not os.path.exists(os.path.dirname(STATS_PATH)):
        os.makedirs(os.path.dirname(STATS_PATH))
    
    print("Jetson Stats & Map Server Started...")
    
    with jtop() as jetson:
        while jetson.ok():
            # 맵 파일 상태 체크 및 동기화
            update_map()
            
            s = jetson.stats
            p = jetson.power
            
            # CPU 평균
            cpu_keys = [k for k in s.keys() if k.startswith('CPU')]
            cpu_vals = [s[k] for k in cpu_keys if s[k] is not None]
            cpu_avg = sum(cpu_vals) / len(cpu_vals) if cpu_vals else 0
            
            # 전압 (mV -> V)
            v = p['tot']['volt']/1000.0 if (p and 'tot' in p) else 0
            
            data = {
                'cpu': round(float(cpu_avg), 1),
                'gpu': round(float(s.get('GPU', 0)), 1),
                'ram': round(float(s.get('RAM', 0) * 100), 1),
                'voltage': round(float(v), 2),
                'temp': round(float(s.get('Temp CPU', s.get('Temp AO', 0))), 1)
            }
            
            with open(STATS_PATH, 'w') as f:
                json.dump(data, f)
            
            time.sleep(1)

if __name__ == '__main__':
    main()
