/**
 * Virtualized Node Renderer
 * 
 * Optimizes rendering of large workflows by only rendering nodes that are visible
 * or likely to become visible soon.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useReactFlow, Node, useViewport, useStore } from 'reactflow';
import { isInViewport, throttle } from '../../../utils/PerformanceOptimizations';

interface VirtualizedNodeRendererProps {
  /**
   * The number of pixels to overscan (render nodes outside the visible area)
   * Higher values reduce the chance of blank areas when scrolling but increase rendering load
   */
  overscanPixels?: number;
  
  /**
   * The children to render (typically ReactFlow components)
   */
  children: React.ReactNode;
}

/**
 * Renders only nodes that are visible in the current viewport
 * Uses the React Flow viewport and node positions to determine visibility
 */
export const VirtualizedNodeRenderer: React.FC<VirtualizedNodeRendererProps> = ({
  overscanPixels = 500,
  children
}) => {
  // Get React Flow viewport and node information
  const { getNodes } = useReactFlow();
  const { x, y, zoom } = useViewport();
  
  // Keep track of visible node IDs
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
  
  // Access the ReactFlow container to check visibility
  const rfContainerElement = useStore((state) => state.domNode);

  /**
   * Calculate which nodes are visible in the current viewport
   */
  const calculateVisibleNodes = useCallback(() => {
    if (!rfContainerElement) return;
    
    const containerRect = rfContainerElement.getBoundingClientRect();
    const nodes = getNodes();
    
    // Viewport boundaries with overscan
    const viewportLeft = -x / zoom - overscanPixels;
    const viewportTop = -y / zoom - overscanPixels;
    const viewportRight = viewportLeft + containerRect.width / zoom + 2 * overscanPixels;
    const viewportBottom = viewportTop + containerRect.height / zoom + 2 * overscanPixels;
    
    // Determine which nodes are in the viewport
    const newVisibleNodeIds = new Set<string>();
    nodes.forEach(node => {
      const nodeLeft = node.position.x;
      const nodeTop = node.position.y;
      const nodeRight = nodeLeft + (node.width || 200);
      const nodeBottom = nodeTop + (node.height || 100);
      
      // Check if the node overlaps with the viewport
      if (
        nodeRight >= viewportLeft &&
        nodeLeft <= viewportRight &&
        nodeBottom >= viewportTop &&
        nodeTop <= viewportBottom
      ) {
        newVisibleNodeIds.add(node.id);
      }
    });
    
    setVisibleNodeIds(newVisibleNodeIds);
  }, [getNodes, x, y, zoom, rfContainerElement, overscanPixels]);

  // Throttled version of calculateVisibleNodes to avoid too many recalculations
  const throttledCalculateVisibleNodes = useCallback(
    throttle(calculateVisibleNodes, 100),
    [calculateVisibleNodes]
  );

  // Update visible nodes when viewport or nodes change
  useEffect(() => {
    throttledCalculateVisibleNodes();
  }, [x, y, zoom, throttledCalculateVisibleNodes]);
  
  // Filter React Flow children to only render visible nodes
  const filterVisibleNodes = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return child;
      }
      
      // If the child has children of its own, recursively filter them
      if (child.props.children) {
        return React.cloneElement(child, {
          ...child.props,
          children: filterVisibleNodes(child.props.children)
        });
      }
      
      // Check if this is a node that should be filtered
      if (
        child.props.id &&
        child.props.nodeId &&
        !visibleNodeIds.has(child.props.nodeId)
      ) {
        // Return null for nodes that are not visible
        return null;
      }
      
      return child;
    });
  };

  return (
    <>
      {filterVisibleNodes(children)}
    </>
  );
};

export default VirtualizedNodeRenderer; 