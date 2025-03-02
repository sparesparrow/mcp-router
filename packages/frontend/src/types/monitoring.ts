export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'disabled';
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  services: ServiceStatus[];
  alerts: SystemAlert[];
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime?: string;
  lastError?: string;
}

export interface SystemAlert {
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  source?: string;
} 