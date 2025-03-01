document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = '/api';
  let socket;
  let connectedServers = new Set();
  
  // DOM elements
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  const serverList = document.getElementById('server-list');
  const serverSelector = document.getElementById('server-selector');
  const resourceServerSelector = document.getElementById('resource-server-selector');
  const toolForm = document.getElementById('tool-form');
  const requestBody = document.getElementById('request-body');
  const toolResponse = document.getElementById('tool-response');
  const refreshServersBtn = document.getElementById('refresh-servers');
  const logContainer = document.getElementById('log-container');
  const clearLogsBtn = document.getElementById('clear-logs');
  const resourcesList = document.getElementById('resources-list');
  const resourceContent = document.getElementById('resource-content');
  
  // Tabs handling
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active from all tabs
      tabLinks.forEach(tab => tab.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Set active tab
      link.classList.add('active');
      const tabId = link.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // WebSocket setup
  function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      log('Connected to MCP Router', 'info');
      fetchServers();
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'servers:list':
          updateServerList(data.data);
          break;
          
        case 'server:connected':
          log(`Server ${data.data.serverId} connected`, 'success');
          connectedServers.add(data.data.serverId);
          updateServerStatus(data.data.serverId, true);
          break;
          
        case 'server:disconnected':
          log(`Server ${data.data.serverId} disconnected`, 'info');
          connectedServers.delete(data.data.serverId);
          updateServerStatus(data.data.serverId, false);
          break;
          
        case 'server:connection-error':
          log(`Connection error for server ${data.data.serverId}: ${data.data.error}`, 'error');
          updateServerStatus(data.data.serverId, false);
          break;
          
        case 'response':
          handleToolResponse(data.requestId, data.data);
          break;
          
        case 'error':
          log(`Error: ${data.data.message}`, 'error');
          break;
      }
    };
    
    socket.onclose = () => {
      log('Disconnected from MCP Router', 'error');
      // Attempt to reconnect after 3 seconds
      setTimeout(setupWebSocket, 3000);
    };
    
    socket.onerror = (error) => {
      log(`WebSocket error: ${error.message}`, 'error');
    };
  }
  
  // Fetch servers via REST API
  async function fetchServers() {
    try {
      const response = await fetch(`${API_BASE_URL}/servers`);
      const servers = await response.json();
      updateServerList(servers);
    } catch (error) {
      log(`Error fetching servers: ${error.message}`, 'error');
    }
  }
  
  // Update server list in the UI
  function updateServerList(servers) {
    // Clear current lists
    serverList.innerHTML = '';
    serverSelector.innerHTML = '';
    resourceServerSelector.innerHTML = '';
    
    // Add default option to selectors
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a server';
    serverSelector.appendChild(defaultOption.cloneNode(true));
    resourceServerSelector.appendChild(defaultOption);
    
    if (servers.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="4" class="text-center">No servers available</td>';
      serverList.appendChild(emptyRow);
      return;
    }
    
    servers.forEach(server => {
      // Add to servers table
      const row = document.createElement('tr');
      const isConnected = connectedServers.has(server.id);
      
      row.innerHTML = `
        <td>${server.id}</td>
        <td>${server.name || server.id}</td>
        <td>${server.url}</td>
        <td>
          <span class="status-indicator ${isConnected ? 'connected' : 'disconnected'}">
            ${isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </td>
        <td>
          <button class="btn ${isConnected ? 'btn-disconnect' : 'btn-connect'}" data-server-id="${server.id}">
            ${isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </td>
      `;
      
      serverList.appendChild(row);
      
      // Add to server selectors
      const option = document.createElement('option');
      option.value = server.id;
      option.textContent = server.name || server.id;
      option.selected = false;
      
      serverSelector.appendChild(option.cloneNode(true));
      resourceServerSelector.appendChild(option);
    });
    
    // Add event listeners to connect/disconnect buttons
    document.querySelectorAll('.btn-connect').forEach(btn => {
      btn.addEventListener('click', () => connectToServer(btn.getAttribute('data-server-id')));
    });
    
    document.querySelectorAll('.btn-disconnect').forEach(btn => {
      btn.addEventListener('click', () => disconnectFromServer(btn.getAttribute('data-server-id')));
    });
  }
  
  // Update server status in the UI
  function updateServerStatus(serverId, isConnected) {
    const row = Array.from(serverList.querySelectorAll('tr')).find(row => {
      const button = row.querySelector('button');
      return button && button.getAttribute('data-server-id') === serverId;
    });
    
    if (row) {
      const statusIndicator = row.querySelector('.status-indicator');
      const button = row.querySelector('button');
      
      if (statusIndicator) {
        statusIndicator.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
        statusIndicator.textContent = isConnected ? 'Connected' : 'Disconnected';
      }
      
      if (button) {
        button.className = `btn ${isConnected ? 'btn-disconnect' : 'btn-connect'}`;
        button.textContent = isConnected ? 'Disconnect' : 'Connect';
        
        // Update event listeners
        button.replaceWith(button.cloneNode(true));
        const newButton = row.querySelector('button');
        
        newButton.addEventListener('click', () => {
          if (isConnected) {
            disconnectFromServer(serverId);
          } else {
            connectToServer(serverId);
          }
        });
      }
    }
    
    // Update the connected state in our tracking set
    if (isConnected) {
      connectedServers.add(serverId);
    } else {
      connectedServers.delete(serverId);
    }
  }
  
  // Connect to server
  async function connectToServer(serverId) {
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/connect`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect to server');
      }
      
      log(`Connecting to server ${serverId}...`, 'info');
    } catch (error) {
      log(`Error connecting to server: ${error.message}`, 'error');
    }
  }
  
  // Disconnect from server
  async function disconnectFromServer(serverId) {
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/disconnect`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disconnect from server');
      }
      
      log(`Disconnecting from server ${serverId}...`, 'info');
    } catch (error) {
      log(`Error disconnecting from server: ${error.message}`, 'error');
    }
  }
  
  // Handle tool execution
  async function executeToolRequest() {
    const serverId = serverSelector.value;
    const toolRequest = requestBody.value;
    
    if (!serverId) {
      log('Please select a server', 'error');
      return;
    }
    
    if (!toolRequest) {
      log('Please enter a request body', 'error');
      return;
    }
    
    let requestData;
    try {
      requestData = JSON.parse(toolRequest);
    } catch (error) {
      log(`Invalid JSON: ${error.message}`, 'error');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
      }
      
      const result = await response.json();
      handleToolResponse(null, result);
    } catch (error) {
      log(`Error executing request: ${error.message}`, 'error');
    }
  }
  
  // Handle response from a tool request
  function handleToolResponse(requestId, response) {
    toolResponse.textContent = JSON.stringify(response, null, 2);
    log('Received response from server', 'success');
  }
  
  // Get resources for a selected server
  async function fetchServerResources() {
    const serverId = resourceServerSelector.value;
    
    if (!serverId) {
      resourcesList.innerHTML = '<p>Please select a server</p>';
      return;
    }
    
    if (!connectedServers.has(serverId)) {
      resourcesList.innerHTML = '<p>Server is not connected</p>';
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/capabilities`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get server capabilities');
      }
      
      const capabilities = await response.json();
      displayServerResources(capabilities);
    } catch (error) {
      log(`Error fetching server resources: ${error.message}`, 'error');
      resourcesList.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    }
  }
  
  // Display server resources
  function displayServerResources(capabilities) {
    resourcesList.innerHTML = '';
    resourceContent.innerHTML = '';
    
    if (!capabilities || Object.keys(capabilities).length === 0) {
      resourcesList.innerHTML = '<p>No capabilities found for this server</p>';
      return;
    }
    
    // Build a tree view of resources
    const list = document.createElement('ul');
    list.className = 'resource-tree';
    
    Object.entries(capabilities).forEach(([category, resources]) => {
      const categoryItem = document.createElement('li');
      categoryItem.innerHTML = `<span class="resource-category">${category}</span>`;
      
      if (typeof resources === 'object' && resources !== null) {
        const subList = document.createElement('ul');
        
        Object.entries(resources).forEach(([name, details]) => {
          const resourceItem = document.createElement('li');
          resourceItem.className = 'resource-item';
          resourceItem.innerHTML = `<span>${name}</span>`;
          resourceItem.addEventListener('click', () => {
            resourceContent.innerHTML = `
              <h3>${name}</h3>
              <pre>${JSON.stringify(details, null, 2)}</pre>
            `;
          });
          
          subList.appendChild(resourceItem);
        });
        
        categoryItem.appendChild(subList);
      }
      
      list.appendChild(categoryItem);
    });
    
    resourcesList.appendChild(list);
  }
  
  // Log function
  function log(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<span class="log-time">${timestamp}</span> <span class="log-message">${message}</span>`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
  
  // Event listeners
  refreshServersBtn.addEventListener('click', fetchServers);
  
  clearLogsBtn.addEventListener('click', () => {
    logContainer.innerHTML = '';
  });
  
  toolForm.addEventListener('submit', (e) => {
    e.preventDefault();
    executeToolRequest();
  });
  
  resourceServerSelector.addEventListener('change', fetchServerResources);
  
  // Initialize app
  setupWebSocket();
  
  // Select Servers tab by default
  tabLinks[0].click();
}); 