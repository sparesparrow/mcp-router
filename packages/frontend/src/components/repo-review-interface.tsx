import React, { useState } from 'react';
import { AlertCircle, Folder, Github, Server, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Review status component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    idle: 'bg-gray-100 text-gray-600',
    loading: 'bg-blue-100 text-blue-600',
    success: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Findings list component
const FindingsList = ({ findings, severity }) => {
  const severityStyles = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-green-50 border-green-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${severityStyles[severity]} mb-4`}>
      <h3 className="font-semibold mb-2 text-gray-800">
        {severity.toUpperCase()} Priority Findings
      </h3>
      <ul className="space-y-2">
        {findings.map((finding, index) => (
          <li key={index} className="text-gray-700">
            <div className="font-medium">{finding.category}</div>
            <ul className="ml-4 mt-1 space-y-1">
              {finding.items.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start">
                  <span className="mr-2 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

const RepositoryReview = () => {
  const [source, setSource] = useState('');
  const [sourceType, setSourceType] = useState('local');
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const sourceTypes = [
    { id: 'local', label: 'Local Directory', icon: Folder },
    { id: 'github', label: 'GitHub Repository', icon: Github },
    { id: 'server', label: 'MCP Server', icon: Server }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    
    try {
      // Call MCP server tool
      const result = await window.fs.readFile('/api/review_codebase', {
        method: 'POST',
        body: JSON.stringify({ source, sourceType })
      });

      setResults(result);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Repository Review</h1>
        <p className="text-gray-600">
          Analyze repositories for best practices and potential improvements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Type
          </label>
          <div className="grid grid-cols-3 gap-4">
            {sourceTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSourceType(id)}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-colors
                  ${sourceType === id 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {sourceType === 'local' && 'Directory Path'}
            {sourceType === 'github' && 'Repository Name'}
            {sourceType === 'server' && 'Server Name'}
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={
              sourceType === 'local' ? '/path/to/project' :
              sourceType === 'github' ? 'owner/repository' :
              'server-name'
            }
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {status === 'loading' ? 'Analyzing...' : 'Analyze'}
          </button>
          <StatusBadge status={status} />
        </div>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Results</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{results.totalFindings} findings across {results.categories.length} categories</span>
              <span>•</span>
              <span>{results.highPriorityCount} high-priority items</span>
            </div>
          </div>

          {['high', 'medium', 'low'].map(severity => (
            results[severity].length > 0 && (
              <FindingsList 
                key={severity}
                findings={results[severity]}
                severity={severity}
              />
            )
          ))}

          <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
            {results.highPriorityCount === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No high-priority issues found</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Action needed on high-priority items</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryReview;