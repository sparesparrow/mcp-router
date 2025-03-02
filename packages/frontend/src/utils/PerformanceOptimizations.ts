/**
 * Performance Optimization Utilities
 * 
 * A collection of utilities for optimizing the performance of the application.
 */

/**
 * Create a memoized version of a function.
 * The function will only be called once for each unique set of arguments.
 * Results are cached and returned for subsequent calls with the same arguments.
 * 
 * @template T - The function return type
 * @template Args - The function argument types
 * @param fn - The function to memoize
 * @param keyGenerator - Optional function to generate cache keys (defaults to JSON.stringify)
 * @returns A memoized version of the input function
 */
export function memoize<T, Args extends any[]>(
  fn: (...args: Args) => T,
  keyGenerator: (...args: Args) => string = (...args) => JSON.stringify(args)
): (...args: Args) => T {
  const cache = new Map<string, T>();
  
  return (...args: Args): T => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Throttle a function to limit the rate at which it executes.
 * The function will be called at most once per specified time period.
 * 
 * @param fn - The function to throttle
 * @param delay - The minimum time between function calls (in milliseconds)
 * @returns A throttled version of the input function
 */
export function throttle<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let lastCall = 0;
  let timeoutId: number | null = null;
  let lastArgs: Args | null = null;
  
  const execute = () => {
    lastCall = Date.now();
    timeoutId = null;
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
    }
  };
  
  return (...args: Args): void => {
    const now = Date.now();
    lastArgs = args;
    
    if (now - lastCall >= delay) {
      execute();
    } else if (timeoutId === null) {
      timeoutId = window.setTimeout(execute, delay - (now - lastCall));
    }
  };
}

/**
 * Debounce a function to delay its execution until after a period of inactivity.
 * The function will only be called after the specified delay has passed without new calls.
 * 
 * @param fn - The function to debounce
 * @param delay - The time to wait after the last call before executing (in milliseconds)
 * @returns A debounced version of the input function
 */
export function debounce<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: number | null = null;
  
  return (...args: Args): void => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Calculate if an element is in the viewport
 * 
 * @param element - The DOM element to check
 * @param offset - Optional offset to expand/contract the viewport check area
 * @returns Whether the element is in the viewport
 */
export function isInViewport(element: HTMLElement, offset = 0): boolean {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top - offset < window.innerHeight &&
    rect.bottom + offset > 0 &&
    rect.left - offset < window.innerWidth &&
    rect.right + offset > 0
  );
}

/**
 * Batch DOM updates to reduce reflows and repaints
 * 
 * @param updates - An array of functions that perform DOM updates
 */
export function batchDOMUpdates(updates: Array<() => void>): void {
  // Request an animation frame to batch updates
  requestAnimationFrame(() => {
    // Force a style calculation to batch all subsequent changes
    document.body.offsetHeight;
    
    // Execute all updates
    updates.forEach(update => update());
  });
}

/**
 * Create a virtualized version of an array for rendering large lists/grids
 * Only returns items that should be visible based on the current scroll position
 * 
 * @template T - The array item type
 * @param items - The full array of items
 * @param startIndex - The index to start from
 * @param visibleCount - The number of items to return
 * @param overscan - Additional items to render before/after visible area (default: 5)
 * @returns A slice of the array containing only the items that should be rendered
 */
export function virtualizeItems<T>(
  items: T[],
  startIndex: number,
  visibleCount: number,
  overscan = 5
): T[] {
  const start = Math.max(0, startIndex - overscan);
  const end = Math.min(items.length, startIndex + visibleCount + overscan);
  
  return items.slice(start, end);
} 