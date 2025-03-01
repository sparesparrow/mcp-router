import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from './ui/Card';

// Interface definitions
interface Server {
  id: string;
  name: string;
  address: string;
  port: number;
  isLocal: boolean;
}

// Icons
const ICONS = {
  ADD: '➕',
  SETTINGS: '⚙️',
  PLAY: '▶️',
  REMOVE: '❌',
  NETWORK: '🌐',
  CONNECTED: '🟢',
  DISCONNECTED: '🔴',
  SCAN: '🔍'
};

// Styled components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  background: ${props => {
    switch(props.variant) {
      case 'danger': return 'var(--color-error)';
      case 'secondary': return 'var(--color-background-secondary)';
      default: return 'var(--color-primary)';
    }
  }};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => {
      switch(props.variant) {
        case 'danger': return 'var(--color-error-dark)';
        case 'secondary': return 'var(--color-background-tertiary)';
        default: return 'var(--color-primary-dark)';
      }
    }};
  }
  
  &:disabled {
    background: var(--color-disabled);
    cursor: not-allowed;
  }
`;

const ServerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const ServerCard = styled.div<{ active?: boolean }>`
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid ${props => 
    props.active ? 'var(--color-primary)' : 'var(--color-border)'};
  background: ${props => 
    props.active ? 'var(--color-background-secondary)' : 'var(--color-background-tertiary)'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary);
  }
`;

const ServerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ServerName = styled.span`
  font-weight: 600;
  color: var(--color-text-primary);
`;

const ServerAddress = styled.div`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`;

const ServerType = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: var(--color-background-primary);
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
`;

const ModalHeader = styled.div`
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
`;

const ModalDescription = styled.p`
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const MCPNetworkManager: React.FC = () => {
  // State
  const [servers, setServers] = useState<Server[]>([
    { id: 'local1', name: 'Local MCP Server', address: 'localhost', port: 8080, isLocal: true }
  ]);
  const [discoveredServers, setDiscoveredServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerAddress, setNewServerAddress] = useState('');
  const [newServerPort, setNewServerPort] = useState(8080);

  // Scan network for MCP servers
  const scanNetwork = async () => {
    setIsScanning(true);
    
    // Simulate network discovery
    setTimeout(() => {
      const mockDiscoveredServers: Server[] = [
        { id: 'disc1', name: 'Database MCP', address: '192.168.1.100', port: 8080, isLocal: false },
        { id: 'disc2', name: 'File Server MCP', address: '192.168.1.101', port: 8080, isLocal: false }
      ];
      
      setDiscoveredServers(mockDiscoveredServers);
      setIsScanning(false);
    }, 2000);
  };

  // Add a new server
  const addServer = () => {
    if (!newServerName.trim() || !newServerAddress.trim()) return;
    
    const newServer: Server = {
      id: `server-${Date.now()}`,
      name: newServerName,
      address: newServerAddress,
      port: newServerPort,
      isLocal: true
    };
    
    setServers([...servers, newServer]);
    setShowAddModal(false);
    setNewServerName('');
    setNewServerAddress('');
    setNewServerPort(8080);
  };

  // Handle server selection
  const selectServer = (serverId: string) => {
    setActiveServer(activeServer === serverId ? null : serverId);
  };

  return (
    <Container>
      <Card>
        <Header>
          <div>
            <h2>MCP Servers</h2>
            <p>Manage local and network MCP servers</p>
          </div>
          <ButtonGroup>
            <ActionButton 
              onClick={scanNetwork} 
              disabled={isScanning}
            >
              {ICONS.SCAN} {isScanning ? 'Scanning...' : 'Scan Network'}
            </ActionButton>
            <ActionButton 
              onClick={() => setShowAddModal(true)}
            >
              {ICONS.ADD} Add Server
            </ActionButton>
          </ButtonGroup>
        </Header>
        
        <ServerGrid>
          {/* Local Servers */}
          {servers.map(server => (
            <ServerCard 
              key={server.id}
              active={activeServer === server.id}
              onClick={() => selectServer(server.id)}
            >
              <ServerHeader>
                <ServerName>{server.name}</ServerName>
                <span>{ICONS.SETTINGS}</span>
              </ServerHeader>
              <ServerAddress>{server.address}:{server.port}</ServerAddress>
              <ServerType>Local Server</ServerType>
            </ServerCard>
          ))}
          
          {/* Discovered Servers */}
          {discoveredServers.map(server => (
            <ServerCard
              key={server.id}
              active={activeServer === server.id}
              onClick={() => selectServer(server.id)}
            >
              <ServerHeader>
                <ServerName>{server.name}</ServerName>
                <span>{ICONS.NETWORK}</span>
              </ServerHeader>
              <ServerAddress>{server.address}:{server.port}</ServerAddress>
              <ServerType>Network Server</ServerType>
            </ServerCard>
          ))}
        </ServerGrid>
      </Card>
      
      {/* Add Server Modal */}
      {showAddModal && (
        <Modal onClick={() => setShowAddModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add MCP Server</ModalTitle>
              <ModalDescription>Configure a new MCP server connection</ModalDescription>
            </ModalHeader>
            
            <FormGroup>
              <label htmlFor="serverName">Server Name</label>
              <Input
                id="serverName"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="My MCP Server"
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="serverAddress">Server Address</label>
              <Input
                id="serverAddress"
                value={newServerAddress}
                onChange={(e) => setNewServerAddress(e.target.value)}
                placeholder="localhost or IP address"
              />
            </FormGroup>
            
            <FormGroup>
              <label htmlFor="serverPort">Port</label>
              <Input
                id="serverPort"
                type="number"
                value={newServerPort}
                onChange={(e) => setNewServerPort(parseInt(e.target.value))}
              />
            </FormGroup>
            
            <ModalFooter>
              <ActionButton 
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </ActionButton>
              <ActionButton onClick={addServer}>
                Add Server
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default MCPNetworkManager; 