/**
 * Performance utilities for the Workflow Designer
 */
import { ReactNode, useMemo, useRef, useCallback, useEffect } from 'react';
import { Node, Edge, Viewport } from 'reactflow';

/**
 * Debounce function to limit how often a function is called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook to determine if nodes are in the visible viewport
 */
export function useVisibleNodes(
  nodes: Node[],
  viewport: Viewport,
  padding: number = 100
) {
  return useMemo(() => {
    const { x, y, zoom } = viewport;
    
    // Calculate visible area with padding
    const visibleLeft = -x / zoom - padding;
    const visibleTop = -y / zoom - padding;
    const visibleRight = visibleLeft + (window.innerWidth / zoom) + (padding * 2);
    const visibleBottom = visibleTop + (window.innerHeight / zoom) + (padding * 2);
    
    // Filter nodes to only those in the viewport
    return nodes?.filter(node => {
      const { position } = node;
      return (
        position.x >= visibleLeft &&
        position.y >= visibleTop &&
        position.x <= visibleRight &&
        position.y <= visibleBottom
      );
    });
  }, [nodes, viewport, padding]);
}

/**
 * A debounce hook for ReactFlow's onNodesChange and onEdgesChange
 */
export function useDebounceChanges(
  setNodes: (updater: any) => void,
  setEdges: (updater: any) => void,
  delay: number = 50
) {
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nodeChangesRef = useRef<any[]>([]);
  const edgeChangesRef = useRef<any[]>([]);
  
  const onNodesChange = useCallback((changes: any[]) => {
    nodeChangesRef.current.push(...changes);
    
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        setNodes((nodes: any) => {
          // Apply all batched changes at once for better performance
          let updatedNodes = [...nodes];
          for (const change of nodeChangesRef.current || []) {
            if (change.type === 'add') {
              updatedNodes.push(change.item);
            } else if (change.type === 'remove') {
              updatedNodes = updatedNodes.filter(node => node.id !== change.id);
            } else if (change.type === 'position' || change.type === 'dimensions') {
              const index = updatedNodes.findIndex(node => node.id === change.id);
              if (index !== -1) {
                updatedNodes[index] = { ...updatedNodes[index], ...change };
              }
            }
          }
          nodeChangesRef.current = [];
          return updatedNodes;
        });
        
        if (edgeChangesRef.current.length > 0) {
          setEdges((edges: any) => {
            // Apply all batched changes at once
            let updatedEdges = [...edges];
            for (const change of edgeChangesRef.current || []) {
              if (change.type === 'add') {
                updatedEdges.push(change.item);
              } else if (change.type === 'remove') {
                updatedEdges = updatedEdges.filter(edge => edge.id !== change.id);
              } else if (change.type === 'select') {
                const index = updatedEdges.findIndex(edge => edge.id === change.id);
                if (index !== -1) {
                  updatedEdges[index] = { ...updatedEdges[index], selected: change.selected };
                }
              }
            }
            edgeChangesRef.current = [];
            return updatedEdges;
          });
        }
        
        updateTimeoutRef.current = null;
      }, delay);
    }
  }, [setNodes, setEdges, delay]);
  
  const onEdgesChange = useCallback((changes: any[]) => {
    edgeChangesRef.current.push(...changes);
    onNodesChange([]);
  }, [onNodesChange]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  return { onNodesChange, onEdgesChange };
}

/**
 * Hook to optimize the node rendering
 * If there are too many nodes, it will return only the visible ones
 */
export function useOptimizedNodeRendering(
  nodes: Node[],
  viewport: Viewport,
  threshold: number = 50
) {
  // Use the useVisibleNodes hook directly
  const visibleNodes = useVisibleNodes(nodes, viewport);
  
  return useMemo(() => {
    // If we have fewer nodes than the threshold, don't optimize
    if (nodes.length <= threshold) {
      return nodes;
    }
    
    // Otherwise use the pre-calculated visible nodes
    return visibleNodes;
  }, [nodes, visibleNodes, threshold]);
} 