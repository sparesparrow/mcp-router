import axios from 'axios';
import { SystemHealth } from '../types/monitoring';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  try {
    const response = await axios.get<SystemHealth>(`${API_BASE_URL}/api/health`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system health:', error);
    throw new Error('Failed to fetch system health data');
  }
} 