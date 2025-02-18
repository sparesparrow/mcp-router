# Technical Integration Details

This document provides technical implementation details for the integration between Python, TypeScript, and React components in the System Context Monitor.

## Type Definitions

### Shared Interfaces (TypeScript)

```typescript
// frontend/src/types/shared.ts
export interface SystemContext {
    id: string;
    timestamp: number;
    metrics: SystemMetrics;
    status: SystemStatus;
}

export interface SystemMetrics {
    cpu_usage: number;
    memory_usage: number;
    network_stats: NetworkStats;
}

export type SystemStatus = 'active' | 'idle' | 'error';
```

### Python Models (Pydantic)

```python
# services/monitoring/models.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SystemContext(BaseModel):
    id: str
    timestamp: datetime
    metrics: SystemMetrics
    status: SystemStatus

class SystemMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    network_stats: NetworkStats

class SystemStatus(str, Enum):
    ACTIVE = 'active'
    IDLE = 'idle'
    ERROR = 'error'
```

## WebSocket Integration

### Frontend WebSocket Client (TypeScript)

```typescript
// frontend/src/services/websocket.ts
export class WebSocketClient {
    private ws: WebSocket;
    private messageHandlers: Map<string, MessageHandler>;

    constructor(url: string) {
        this.ws = new WebSocket(url);
        this.messageHandlers = new Map();
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.ws.onmessage = (event) => this.handleMessage(event);
        this.ws.onerror = (error) => this.handleError(error);
    }

    public send(message: WebSocketMessage) {
        this.ws.send(JSON.stringify(message));
    }
}
```

### Backend WebSocket Manager (Python)

```python
# services/transport/websocket.py
from fastapi import WebSocket
from typing import List, Dict

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_map: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.connection_map[client_id] = websocket

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)
```

## API Integration

### Frontend API Client (TypeScript)

```typescript
// frontend/src/services/api.ts
export class APIClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getSystemMetrics(): Promise<SystemMetrics> {
        const response = await fetch(`${this.baseUrl}/api/metrics`);
        return await response.json();
    }

    async updateContext(context: Partial<SystemContext>): Promise<void> {
        await fetch(`${this.baseUrl}/api/context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context)
        });
    }
}
```

### Backend API Routes (Python)

```python
# services/api/routes.py
from fastapi import APIRouter, Depends
from typing import List

router = APIRouter()

@router.get("/api/metrics")
async def get_metrics(
    service: MonitoringService = Depends(get_monitoring_service)
) -> SystemMetrics:
    return await service.get_current_metrics()

@router.post("/api/context")
async def update_context(
    context: SystemContext,
    service: ContextService = Depends(get_context_service)
) -> None:
    await service.update_context(context)
```

## React Component Integration

### Monitoring Panel Component

```typescript
// frontend/src/components/MonitoringPanel.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAPI } from '../hooks/useAPI';
import { SystemMetrics } from '../types/shared';

export const MonitoringPanel: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const ws = useWebSocket();
    const api = useAPI();

    useEffect(() => {
        // Initial metrics load
        api.getSystemMetrics().then(setMetrics);

        // Subscribe to real-time updates
        ws.subscribe('metrics', (data) => setMetrics(data));

        return () => ws.unsubscribe('metrics');
    }, []);

    return (
        <div className="monitoring-panel">
            {metrics && (
                <>
                    <MetricsDisplay metrics={metrics} />
                    <ChartComponent data={metrics} />
                </>
            )}
        </div>
    );
};
```

## Service Integration

### Monitoring Service (Python)

```python
# services/monitoring/service.py
from typing import Optional
from datetime import datetime

class MonitoringService:
    def __init__(self, websocket_manager: WebSocketManager):
        self.ws_manager = websocket_manager
        self.metrics_collector = MetricsCollector()
        self.data_processor = DataProcessor()

    async def start_monitoring(self):
        while True:
            try:
                raw_metrics = await self.metrics_collector.collect()
                processed_metrics = self.data_processor.process(raw_metrics)
                await self.ws_manager.broadcast({
                    'type': 'metrics',
                    'data': processed_metrics
                })
            except Exception as e:
                await self.handle_monitoring_error(e)
```

## Error Handling Integration

### Frontend Error Boundary (React)

```typescript
// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorDisplay error={this.state.error} />;
        }
        return this.props.children;
    }
}
```

### Backend Error Handler (Python)

```python
# services/api/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Union

async def global_error_handler(
    request: Request,
    exc: Union[Exception, HTTPException]
) -> JSONResponse:
    error_id = generate_error_id()
    
    await log_error(error_id, exc, request)
    
    return JSONResponse(
        status_code=getattr(exc, 'status_code', 500),
        content={
            'error_id': error_id,
            'message': str(exc),
            'type': exc.__class__.__name__
        }
    )
```

## State Management Integration

### Frontend State Store (TypeScript)

```typescript
// frontend/src/store/index.ts
import create from 'zustand';
import { SystemContext, SystemMetrics } from '../types/shared';

interface AppState {
    context: SystemContext | null;
    metrics: SystemMetrics | null;
    setContext: (context: SystemContext) => void;
    updateMetrics: (metrics: SystemMetrics) => void;
}

export const useStore = create<AppState>((set) => ({
    context: null,
    metrics: null,
    setContext: (context) => set({ context }),
    updateMetrics: (metrics) => set({ metrics })
}));
```

### Backend State Manager (Python)

```python
# services/context/state.py
from typing import Dict, Any
from redis import Redis

class StateManager:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def get_state(self, key: str) -> Dict[str, Any]:
        state_data = await self.redis.get(key)
        return json.loads(state_data) if state_data else {}

    async def update_state(self, key: str, data: Dict[str, Any]) -> None:
        await self.redis.set(key, json.dumps(data))
```

These technical details complement the visual diagrams by providing concrete implementation examples for each integration point in the system. 