import axios from 'axios';
import { SystemHealth } from '../types/monitoring';
import { FEATURE_FLAGS } from '../../../shared/src/constants/feature-flags';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  // Skip the API call completely and return mock data
  // This effectively disables system monitoring to improve performance
  return {
    status: 'disabled',
    uptime: '0h 0m',
    cpuUsage: 0,
    memoryUsage: 0,
    services: [],
    alerts: []
  };
  
  // Original implementation - commented out
  /*
  try {
    const response = await axios.get<SystemHealth>(`${API_BASE_URL}/api/health`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system health:', error);
    throw new Error('Failed to fetch system health data');
  }
  */
} 