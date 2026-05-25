/**
 * Simple PGM (P5) Parser for browser
 */
export async function parsePGM(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  let offset = 0;
  
  function readString() {
    let str = "";
    while (offset < bytes.length) {
      const char = String.fromCharCode(bytes[offset++]);
      if (/\s/.test(char)) {
        if (str.length > 0) break;
        continue;
      }
      str += char;
    }
    return str;
  }

  const magic = readString();
  if (magic !== "P5") {
    throw new Error("Only P5 (binary) PGM is supported for this test.");
  }

  const width = parseInt(readString());
  const height = parseInt(readString());
  const maxVal = parseInt(readString());
  
  // The data starts right after the last whitespace after maxVal
  const data = bytes.slice(offset);
  
  return {
    info: {
      width,
      height,
      resolution: 0.05, // Mock resolution
      origin: { position: { x: 0, y: 0 } }
    },
    data: Array.from(data).map(val => {
      // Map PGM grayscale (0-255) to OccupancyGrid (0, 100, -1)
      // ROS maps: 0 is free (white in PGM), 100 is occupied (black in PGM)
      // Usually PGM from ROS: 254/255 = free, 0 = occupied, 205 = unknown
      if (val >= 250) return 0; // Free
      if (val <= 10) return 100; // Occupied
      return -1; // Unknown
    })
  };
}
