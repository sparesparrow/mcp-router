/**
 * Server registration information
 */
export interface ServerRegistration {
  /** Unique identifier for the server */
  id: string;
  
  /** Human-readable name for the server */
  name: string;
  
  /** URL for connecting to the server */
  url: string;
  
  /** Optional metadata associated with this server */
  metadata?: Record<string, any>;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Port to listen on */
  port: number;
  
  /** Host to bind to */
  host?: string;
  
  /** Pre-configured servers to register on startup */
  servers?: ServerRegistration[];
  
  /** Discovery service configuration */
  discovery?: {
    /** Whether to enable automatic discovery */
    enabled: boolean;
    
    /** Discovery methods to use */
    methods?: ('podman' | 'docker' | 'kubernetes')[];
    
    /** How often to poll for new servers (in milliseconds) */
    pollInterval?: number;
  };
} 