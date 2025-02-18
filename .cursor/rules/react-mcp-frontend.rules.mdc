---
description: Standards for implementing Model Context Protocol (MCP) frontend components in React
globs: ["frontend/**/*.{ts,js,tsx,jsx}"]
priority: 25
dependencies: ["02-typescript.rules.md"]
---

# React MCP Frontend Implementation Standards

## Core Principles

### Component Architecture
- Use functional components with hooks
- Implement proper state management
- Follow component composition patterns
- Maintain clean component hierarchy

### TypeScript Integration
- Use strict TypeScript configuration
- Define proper interfaces and types
- Leverage union types and generics
- Maintain type safety across components

### UI/UX Standards
- Follow accessibility guidelines
- Implement responsive design
- Use consistent styling patterns
- Provide clear user feedback

## Implementation Standards

### Component Structure
```typescript
// Good: Well-structured component
interface MCPManagerProps {
  initialServers?: Server[];
  onServerConnect: (server: Server) => Promise<void>;
  theme?: 'light' | 'dark';
}

const MCPManager: React.FC<MCPManagerProps> = ({
  initialServers = [],
  onServerConnect,
  theme = 'dark'
}) => {
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = useCallback(async (server: Server) => {
    setIsConnecting(true);
    try {
      await onServerConnect(server);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [onServerConnect]);

  return (
    <div className={`theme-${theme}`}>
      {/* Component JSX */}
    </div>
  );
};

// Bad: Poor structure
const BadComponent = (props) => { // ❌ No type definitions
  const [data, setData] = useState(); // ❌ No type for state
  
  const handle = () => { // ❌ No error handling
    props.onAction(data);
  };
  
  return <div onClick={handle}>{data}</div>; // ❌ No accessibility
};
```

### State Management
```typescript
// Good: Proper state management
interface MCPState {
  servers: Server[];
  activeServer: Server | null;
  connections: Connection[];
  error: Error | null;
}

const useMCPState = () => {
  const [state, dispatch] = useReducer(mcpReducer, initialState);
  
  const connectToServer = useCallback(async (server: Server) => {
    dispatch({ type: 'CONNECT_START', payload: server });
    try {
      const connection = await createConnection(server);
      dispatch({ type: 'CONNECT_SUCCESS', payload: connection });
    } catch (error) {
      dispatch({ type: 'CONNECT_ERROR', payload: error });
    }
  }, []);

  return { state, connectToServer };
};

// Bad: Poor state management
const BadState = () => {
  const [data, setData] = useState([]); // ❌ No type safety
  const [error, setError] = useState(); // ❌ Undefined error type
  
  const update = () => setData([...data]); // ❌ Unnecessary update
};
```

### API Integration
```typescript
// Good: Type-safe API integration
interface MCPClient {
  connect(server: Server): Promise<Connection>;
  sendMessage(message: Message): Promise<Response>;
  disconnect(): Promise<void>;
}

const useMCPClient = (config: MCPConfig): MCPClient => {
  const client = useMemo(() => new MCPClient(config), [config]);
  
  useEffect(() => {
    return () => {
      client.disconnect().catch(console.error);
    };
  }, [client]);
  
  return client;
};

// Bad: Unsafe API handling
const badApi = {
  connect: (server) => { // ❌ No types
    fetch(server.url) // ❌ No error handling
      .then(res => res.json())
      .then(setData); // ❌ Global state mutation
  }
};
```

### Error Handling
```typescript
// Good: Comprehensive error handling
interface MCPError extends Error {
  code: string;
  details?: Record<string, unknown>;
}

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return (
      <div role="alert" className="error-boundary">
        <h2>Something went wrong</h2>
        <pre>{error.message}</pre>
        <button onClick={() => setError(null)}>Try again</button>
      </div>
    );
  }
  
  return children;
};

// Bad: Poor error handling
const BadError = () => {
  try {
    // ... code
  } catch (e) { // ❌ Untyped error
    console.log(e); // ❌ Poor error reporting
  }
};
```

### Performance Optimization
```typescript
// Good: Optimized components
const MCPConnection = memo(({ 
  server,
  onConnect 
}: MCPConnectionProps) => {
  const handleConnect = useCallback(() => {
    onConnect(server);
  }, [server, onConnect]);
  
  const status = useMemo(() => 
    computeStatus(server),
    [server]
  );
  
  return (
    <button
      onClick={handleConnect}
      disabled={status === 'connecting'}
    >
      {status}
    </button>
  );
});

// Bad: Unoptimized code
const BadComponent = ({ data }) => {
  const value = heavyComputation(data); // ❌ No memoization
  
  return data.map(item => ( // ❌ No key prop
    <div>{item}</div>
  ));
};
```

### Accessibility
```typescript
// Good: Accessible components
const MCPToolbar = () => {
  return (
    <div
      role="toolbar"
      aria-label="MCP Tools"
      className="mcp-toolbar"
    >
      <button
        aria-label="Connect to server"
        onClick={handleConnect}
      >
        <Icon name="connect" aria-hidden="true" />
        Connect
      </button>
      <select
        aria-label="Select server"
        onChange={handleServerSelect}
      >
        {servers.map(server => (
          <option key={server.id} value={server.id}>
            {server.name}
          </option>
        ))}
      </select>
    </div>
  );
};

// Bad: Inaccessible components
const BadToolbar = () => (
  <div> // ❌ No ARIA attributes
    <button onClick={click}> // ❌ No labels
      <img src="icon.png" /> // ❌ No alt text
    </button>
  </div>
);
```

### Styling
```typescript
// Good: Consistent styling
const useStyles = createStyles((theme) => ({
  container: {
    display: 'flex',
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  
  button: {
    '&:hover': {
      backgroundColor: theme.colors.primary,
    },
    
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
}));

// Bad: Inconsistent styling
const BadStyles = {
  div: { // ❌ No theme integration
    background: 'white', // ❌ Hardcoded colors
    padding: '10px', // ❌ Magic numbers
  },
};
```

## Testing Requirements

### Component Testing
```typescript
// Good: Comprehensive tests
describe('MCPManager', () => {
  it('should connect to server', async () => {
    const onConnect = jest.fn();
    const { getByRole } = render(
      <MCPManager onConnect={onConnect} />
    );
    
    const button = getByRole('button', { name: /connect/i });
    await userEvent.click(button);
    
    expect(onConnect).toHaveBeenCalled();
  });
  
  it('should handle errors', async () => {
    const error = new Error('Connection failed');
    const onConnect = jest.fn().mockRejectedValue(error);
    
    const { getByRole, findByText } = render(
      <MCPManager onConnect={onConnect} />
    );
    
    const button = getByRole('button', { name: /connect/i });
    await userEvent.click(button);
    
    expect(await findByText(/failed/i)).toBeInTheDocument();
  });
});

// Bad: Poor testing
test('component', () => {
  const comp = shallow(<Comp />); // ❌ No user interactions
  expect(comp).toExist(); // ❌ Shallow assertions
});
```

## Documentation

### Component Documentation
```typescript
/**
 * MCP Manager component for handling server connections and tool execution.
 * 
 * @example
 * ```tsx
 * <MCPManager
 *   initialServers={servers}
 *   onConnect={handleConnect}
 *   theme="dark"
 * />
 * ```
 * 
 * @param props - Component props
 * @param props.initialServers - Initial list of servers
 * @param props.onConnect - Callback when server connects
 * @param props.theme - UI theme
 */
const MCPManager: React.FC<MCPManagerProps> = (props) => {
  // Implementation
};

// Bad: Poor documentation
const BadComponent = (props) => { // ❌ No documentation
  // Implementation
};
```

## Security Considerations

### Input Sanitization
```typescript
// Good: Proper input handling
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};

const MCPInput: React.FC<InputProps> = ({ 
  value,
  onChange 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInput(e.target.value);
    onChange(sanitized);
  };
  
  return (
    <input
      value={value}
      onChange={handleChange}
      aria-label="MCP Input"
    />
  );
};

// Bad: Unsafe input
const BadInput = ({ onChange }) => (
  <input
    onChange={e => onChange(e.target.value)} // ❌ No sanitization
    dangerouslySetInnerHTML={{ __html: data }} // ❌ Unsafe HTML
  />
);
```

### Authentication
```typescript
// Good: Secure authentication
const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  
  const login = useCallback(async (credentials: Credentials) => {
    try {
      const response = await api.login(credentials);
      setToken(response.token);
      localStorage.setItem('auth_token', response.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);
  
  return { token, login };
};

// Bad: Insecure auth
const badAuth = {
  login: (user, pass) => { // ❌ Plain text credentials
    localStorage.token = 'secret'; // ❌ Insecure storage
  },
};
``` 