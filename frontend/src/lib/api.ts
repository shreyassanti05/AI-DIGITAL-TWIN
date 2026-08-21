// Backend API URL - using port 8001 to avoid conflicts
const API_BASE = 'http://127.0.0.1:8001';

async function fetchApi(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  return response.json();
}

// Stream API
export const streamApi = {
  // Start a new stream
  start: async (params: {
    stream_id: string;
    source: string;
    source_type?: 'webcam' | 'rtsp' | 'file' | 'auto';
    enable_tracking?: boolean;
    enable_weapon_detection?: boolean;
    enable_fire_detection?: boolean;
    enable_violence_detection?: boolean;
    enable_fall_detection?: boolean;
    detection_confidence?: number;
    target_fps?: number;
  }) => {
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('stream_id', params.stream_id);
    queryParams.append('source', params.source);
    if (params.source_type) queryParams.append('source_type', params.source_type);
    if (params.enable_tracking !== undefined) queryParams.append('enable_tracking', String(params.enable_tracking));
    if (params.enable_weapon_detection !== undefined) queryParams.append('enable_weapon_detection', String(params.enable_weapon_detection));
    if (params.enable_fire_detection !== undefined) queryParams.append('enable_fire_detection', String(params.enable_fire_detection));
    if (params.enable_violence_detection !== undefined) queryParams.append('enable_violence_detection', String(params.enable_violence_detection));
    if (params.enable_fall_detection !== undefined) queryParams.append('enable_fall_detection', String(params.enable_fall_detection));
    if (params.detection_confidence !== undefined) queryParams.append('detection_confidence', String(params.detection_confidence));
    if (params.target_fps !== undefined) queryParams.append('target_fps', String(params.target_fps));
    
    return fetchApi(`/api/v1/streams/start?${queryParams.toString()}`, {
      method: 'POST',
    });
  },

  // Stop a stream
  stop: async (streamId: string) => {
    return fetchApi(`/api/v1/streams/stop/${streamId}`, {
      method: 'POST',
    });
  },

  // List all active streams
  list: async () => {
    return fetchApi('/api/v1/streams/list');
  },

  // Get stream status
  status: async (streamId: string) => {
    return fetchApi(`/api/v1/streams/status/${streamId}`);
  },

  // Configure stream
  configure: async (streamId: string, config: {
    enable_weapon_detection?: boolean;
    enable_fire_detection?: boolean;
    enable_violence_detection?: boolean;
    enable_fall_detection?: boolean;
    detection_confidence?: number;
    target_fps?: number;
  }) => {
    return fetchApi(`/api/v1/streams/configure/${streamId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // Upload video file (sends actual file via FormData)
  uploadVideo: async (file: File, options?: {
    stream_id?: string;
    enable_weapon_detection?: boolean;
    enable_fire_detection?: boolean;
    enable_violence_detection?: boolean;
    enable_fall_detection?: boolean;
  }) => {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.stream_id) formData.append('stream_id', options.stream_id);
    if (options?.enable_weapon_detection !== undefined) formData.append('enable_weapon_detection', String(options.enable_weapon_detection));
    if (options?.enable_fire_detection !== undefined) formData.append('enable_fire_detection', String(options.enable_fire_detection));
    if (options?.enable_violence_detection !== undefined) formData.append('enable_violence_detection', String(options.enable_violence_detection));
    if (options?.enable_fall_detection !== undefined) formData.append('enable_fall_detection', String(options.enable_fall_detection));

    const response = await fetch(`${API_BASE}/api/v1/streams/upload-video`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser sets it with boundary for FormData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Upload Error: ${response.status}`);
    }

    return response.json();
  },
};

// Model API
export const modelApi = {
  // List all models
  list: async () => {
    return fetchApi('/api/v1/models/list');
  },

  // Get model info
  info: async (category: string, modelName: string) => {
    return fetchApi(`/api/v1/models/info/${category}/${modelName}`);
  },

  // Load model
  load: async (category: string, modelName: string, device?: string) => {
    return fetchApi(`/api/v1/models/load/${category}/${modelName}`, {
      method: 'POST',
      body: JSON.stringify({ device }),
    });
  },

  // Unload model
  unload: async (category: string, modelName: string) => {
    return fetchApi(`/api/v1/models/unload/${category}/${modelName}`, {
      method: 'POST',
    });
  },

  // Get supported formats
  formats: async () => {
    return fetchApi('/api/v1/models/formats');
  },
};

// Alerts API
export const alertApi = {
  // Get recent incidents
  incidents: async (streamId?: string, severity?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (streamId) params.append('stream_id', streamId);
    if (severity) params.append('severity', severity);
    if (limit) params.append('limit', String(limit));
    return fetchApi(`/api/v1/alerts/incidents?${params.toString()}`);
  },
};

// Health check
export const healthApi = {
  check: async () => {
    return fetchApi('/health');
  },
  apiCheck: async () => {
    return fetchApi('/api/health');
  },
};

// Types
export interface Stream {
  stream_id: string;
  source: string;
  resolution: string;
  fps: number;
  frame_count: number;
  is_active: boolean;
  runtime: number;
}

export interface StreamStatus extends Stream {
  source_url: string;
  error_count: number;
  viewers: number;
}

export interface ModelInfo {
  name: string;
  category: string;
  format: string;
  path: string;
  input_shape?: number[];
  loaded: boolean;
  device: string;
}
