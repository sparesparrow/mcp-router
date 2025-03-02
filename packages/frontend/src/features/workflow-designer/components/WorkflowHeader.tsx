/**
 * Workflow Header Component
 * Header component for the workflow designer with controls for saving, undo/redo, etc.
 */
import React from 'react';

interface WorkflowHeaderProps {
  workflowName: string;
  saveStatus: 'saved' | 'unsaved' | 'saving';
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onNew: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  onExport: () => void;
  exportFormat: 'json' | 'mermaid';
  onExportFormatChange: (format: string) => void;
  onImport: (data: string) => void;
  exportModalOpen: boolean;
  onExportModalClose: () => void;
  exportedData: string;
  readOnly?: boolean;
}

/**
 * WorkflowHeader displays the workflow name, save status, and provides controls.
 */
const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  workflowName,
  saveStatus,
  onNameChange,
  onSave,
  onNew,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onExport,
  exportFormat,
  onExportFormatChange,
  onImport,
  exportModalOpen,
  onExportModalClose,
  exportedData,
  readOnly = false,
}) => {
  // Get status color based on save status
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return '#10b981'; // Green
      case 'unsaved':
        return '#f59e0b'; // Amber
      case 'saving':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  // Get status text based on save status
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return 'Saved';
      case 'unsaved':
        return 'Unsaved';
      case 'saving':
        return 'Saving...';
      default:
        return '';
    }
  };

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        onImport(event.target.result as string);
      }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset the input
  };

  // Handle download of exported data
  const handleDownload = () => {
    if (!exportedData) return;
    
    const extension = exportFormat === 'json' ? 'json' : 'md';
    const filename = `${workflowName || 'workflow'}.${extension}`;
    const blob = new Blob([exportedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    if (!exportedData) return;
    
    navigator.clipboard.writeText(exportedData)
      .then(() => {
        alert('Copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy to clipboard:', error);
        alert('Failed to copy to clipboard. Please try again.');
      });
  };

  return (
    <header style={{
      padding: '10px 20px',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div className="workflow-info" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <input
          type="text"
          value={workflowName}
          onChange={onNameChange}
          placeholder="Workflow Name"
          disabled={readOnly}
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            padding: '5px 10px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            width: '300px',
          }}
        />
        <span style={{
          fontSize: '14px',
          color: getStatusColor(),
          fontStyle: 'italic',
        }}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="workflow-actions" style={{
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={onNew}
          disabled={readOnly}
          style={{
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1px solid #94a3b8',
            borderRadius: '4px',
            cursor: readOnly ? 'not-allowed' : 'pointer',
            opacity: readOnly ? 0.6 : 1,
          }}
        >
          New
        </button>
        
        <button
          onClick={onUndo}
          disabled={!canUndo || readOnly}
          style={{
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1px solid #94a3b8',
            borderRadius: '4px',
            cursor: (!canUndo || readOnly) ? 'not-allowed' : 'pointer',
            opacity: (!canUndo || readOnly) ? 0.6 : 1,
          }}
        >
          Undo
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo || readOnly}
          style={{
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1px solid #94a3b8',
            borderRadius: '4px',
            cursor: (!canRedo || readOnly) ? 'not-allowed' : 'pointer',
            opacity: (!canRedo || readOnly) ? 0.6 : 1,
          }}
        >
          Redo
        </button>
        
        <button
          onClick={onSave}
          disabled={saveStatus === 'saved' || readOnly}
          style={{
            padding: '8px 16px',
            background: saveStatus === 'saved' ? '#f8fafc' : '#3b82f6',
            color: saveStatus === 'saved' ? '#64748b' : 'white',
            border: '1px solid ' + (saveStatus === 'saved' ? '#94a3b8' : '#2563eb'),
            borderRadius: '4px',
            cursor: (saveStatus === 'saved' || readOnly) ? 'not-allowed' : 'pointer',
            opacity: (saveStatus === 'saved' || readOnly) ? 0.6 : 1,
          }}
        >
          Save
        </button>
        
        <div style={{ width: '1px', background: '#e2e8f0', margin: '0 5px' }} />
        
        <select
          value={exportFormat}
          onChange={(e) => onExportFormatChange(e.target.value)}
          style={{
            padding: '8px',
            border: '1px solid #94a3b8',
            borderRadius: '4px',
          }}
        >
          <option value="json">JSON</option>
          <option value="mermaid">Mermaid</option>
        </select>
        
        <button
          onClick={onExport}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: '1px solid #059669',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export
        </button>
        
        <label
          htmlFor="import-file"
          style={{
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1px solid #94a3b8',
            borderRadius: '4px',
            cursor: readOnly ? 'not-allowed' : 'pointer',
            opacity: readOnly ? 0.6 : 1,
            display: 'inline-block',
          }}
        >
          Import
          <input
            id="import-file"
            type="file"
            accept=".json,.md,.txt"
            onChange={handleFileImport}
            disabled={readOnly}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {/* Export modal */}
      {exportModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0 }}>
                Export {exportFormat === 'json' ? 'JSON' : 'Mermaid Diagram'}
              </h3>
              <button
                onClick={onExportModalClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              padding: '16px',
              overflow: 'auto',
              flexGrow: 1,
            }}>
              <textarea
                value={exportedData}
                readOnly
                style={{
                  width: '100%',
                  height: '300px',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  resize: 'none',
                }}
              />
            </div>
            
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '8px 16px',
                  background: '#f8fafc',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Copy to Clipboard
              </button>
              
              <button
                onClick={handleDownload}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: '1px solid #2563eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default WorkflowHeader;
