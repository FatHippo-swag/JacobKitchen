import { useEffect, useRef, useState, useCallback } from 'react';
import styles from '../styles/PaintApp.module.css';

export default function PaintApp({ windowId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [prevPos, setPrevPos] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [cursorPosition, setCursorPosition] = useState({ x: -50, y: -50 });
  const [showSizeIndicator, setShowSizeIndicator] = useState(false);
  const containerRef = useRef(null);
  
  // Original canvas size tracking for quality preservation
  const [originalCanvasSize, setOriginalCanvasSize] = useState({ width: 0, height: 0 });
  const [originalImageData, setOriginalImageData] = useState(null);
  
  // Refs for local state management
  const isDrawingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Save canvas state for undo functionality
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create a direct clone of the canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext('2d');
      tempContext.drawImage(canvas, 0, 0);

      // Store the canvas element itself in the stack
      setUndoStack(prev => [...prev, tempCanvas]);
      
      // Limit undo stack size to prevent memory issues
      if (undoStack.length > 25) {
        setUndoStack(prev => prev.slice(prev.length - 25));
      }
      
      console.log('Canvas state saved. Stack size:', undoStack.length + 1);
    } catch (e) {
      console.error("Error saving canvas state:", e);
    }
  }, [undoStack]);

  // Undo the last action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      console.log('No actions to undo');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const context = canvas.getContext('2d');
      
      // Remove the latest state from the stack
      const newStack = [...undoStack];
      // eslint-disable-next-line no-unused-vars
      const previousCanvas = newStack.pop();
      setUndoStack(newStack);
      
      if (newStack.length > 0) {
        // Get the previous canvas state
        const prevCanvas = newStack[newStack.length - 1];
        
        // Clear current canvas
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the previous state
        context.drawImage(prevCanvas, 0, 0, canvas.width, canvas.height);
        console.log('Undo successful. Remaining states:', newStack.length);
      } else {
        // If no previous state, clear the canvas
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        console.log('Canvas cleared (no previous states)');
      }
    } catch (e) {
      console.error("Error during undo:", e);
    }
  }, [undoStack]);

  // Set up keyboard shortcuts with improved event handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if this window is the active window
      if (document.activeElement && 
          (document.activeElement.tagName === 'INPUT' || 
           document.activeElement.tagName === 'TEXTAREA')) {
        return; // Don't capture keys when input/textarea has focus
      }
      
      // Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        console.log('Undo triggered via Ctrl+Z');
        handleUndo();
      }
    };
    
    // Add event listener directly to canvas container
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }
    
    // Also listen at the window level
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo]);
  
  // Make sure the container is focusable
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.tabIndex = 0; // Make focusable
    }
  }, []);

  // Mouse event handlers and canvas resizing with better quality preservation
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const context = canvas?.getContext('2d');
    
    if (canvas && container) {
      // Set canvas size with high-quality resizing
      const resizeCanvas = () => {
        // Get container dimensions
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Adjust for toolbar height
        const toolbarHeight = 40;
        const statusBarHeight = 22;
        
        // Calculate new canvas dimensions
        const newWidth = width;
        const newHeight = height - toolbarHeight - statusBarHeight;
        
        // Save current state before resizing
        let currentImageData = null;
        if (canvas.width > 0 && canvas.height > 0) {
          try {
            // Use the originalImageData if available (higher quality)
            if (originalImageData) {
              currentImageData = originalImageData;
            } else {
              // Fallback to current canvas state
              currentImageData = context.getImageData(0, 0, canvas.width, canvas.height);
            }
          } catch (e) {
            console.error("Failed to get image data:", e);
          }
        }
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Fill with white
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restore previous content with high quality
        if (currentImageData) {
          try {
            // Create a temporary canvas to hold the original image
            const tempCanvas = document.createElement('canvas');
            
            // Use original dimensions or current ones if not available
            const srcWidth = originalCanvasSize.width || currentImageData.width;
            const srcHeight = originalCanvasSize.height || currentImageData.height;
            
            tempCanvas.width = srcWidth;
            tempCanvas.height = srcHeight;
            const tempContext = tempCanvas.getContext('2d');
            
            // Put the image data on the temp canvas
            tempContext.putImageData(currentImageData, 0, 0);
            
            // Calculate scaling to maintain aspect ratio
            const scaleX = newWidth / srcWidth;
            const scaleY = newHeight / srcHeight;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed
            
            // Calculate centered position
            const scaledWidth = srcWidth * scale;
            const scaledHeight = srcHeight * scale;
            const offsetX = (newWidth - scaledWidth) / 2;
            const offsetY = (newHeight - scaledHeight) / 2;
            
            // Use high-quality image drawing
            context.imageSmoothingEnabled = false; // Disable smoothing for pixel-perfect rendering
            context.drawImage(tempCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
          } catch (e) {
            console.error("Failed to restore image data:", e);
          }
        }
      };
      
      // Call resize immediately
      resizeCanvas();
      
      // Create a ResizeObserver to watch for container size changes
      const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      
      resizeObserver.observe(container);
      window.addEventListener('resize', resizeCanvas);
      
      // Save initial canvas state
      setTimeout(() => {
        saveCanvasState();
      }, 100);
      
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [saveCanvasState, originalImageData, originalCanvasSize]);

  // Mouse event handlers - improved line drawing
  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCursorPosition({ x, y });
    
    // Execute drawing if in drawing mode
    if (isDrawing) {
      draw(e);
    }
  };

  const startDrawing = (e) => {
    e.stopPropagation(); // Prevent window dragging while drawing
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Save the current canvas state before drawing
    saveCanvasState();
    
    const { offsetX, offsetY } = getCoordinates(e);
    const context = canvas.getContext('2d');
    
    setIsDrawing(true);
    isDrawingRef.current = true;
    setPrevPos({ x: offsetX, y: offsetY });
    
    // For dot when clicking
    context.beginPath();
    context.arc(offsetX, offsetY, lineWidth / 2, 0, Math.PI * 2);
    
    // If eraser, draw white, otherwise use selected color
    context.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    context.fill();
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    
    e.stopPropagation(); // Prevent window dragging while drawing
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { offsetX, offsetY } = getCoordinates(e);
    
    // Set stroke style based on tool
    context.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round'; // Smooth corner joins
    
    // Use quadratic curves for smoother lines
    context.beginPath();
    
    // Calculate midpoint
    const midPoint = {
      x: (prevPos.x + offsetX) / 2,
      y: (prevPos.y + offsetY) / 2
    };
    
    if (Math.abs(offsetX - prevPos.x) > 2 || Math.abs(offsetY - prevPos.y) > 2) {
      // Use quadratic curve for smoother lines
      context.quadraticCurveTo(prevPos.x, prevPos.y, midPoint.x, midPoint.y);
      context.stroke();
    } else {
      // For short distances, use a simple line
      context.moveTo(prevPos.x, prevPos.y);
      context.lineTo(offsetX, offsetY);
      context.stroke();
    }
    
    setPrevPos({ x: offsetX, y: offsetY });
  };

  const stopDrawing = (e) => {
    if (e) e.stopPropagation(); // Prevent window events from interfering
    setIsDrawing(false);
    isDrawingRef.current = false;
  };

  // Helper function to get coordinates for both mouse and touch events
  const getCoordinates = (e) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.type.includes('touch')) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    } else {
      // Use clientX/Y instead of offsetX/Y for more reliable positioning
      return {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      };
    }
  };

  // Method to clear the canvas
  const clearCanvas = () => {
    // Save the current state before clearing
    saveCanvasState();
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className={styles.paintContainer} ref={containerRef}>
      <div className={`${styles.toolbar} noDrag`}>
        <div className={styles.toolSection}>
          <button 
            className={`${styles.toolButton} ${tool === 'pencil' ? styles.active : ''}`}
            onClick={() => setTool('pencil')}
          >
            Pencil
          </button>
          <button 
            className={`${styles.toolButton} ${tool === 'eraser' ? styles.active : ''}`}
            onClick={() => {setTool('eraser');}}
          >
            Eraser
          </button>
          <button 
            className={styles.toolButton}
            onClick={clearCanvas}
          >
            Clear
          </button>
          <button 
            className={styles.toolButton}
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
        </div>
        
        <div className={styles.colorSection}>
          <div className={styles.colorLabel}>Color:</div>
          <input 
            type="color" 
            value={color} 
            onChange={(e) => {
              setColor(e.target.value);
              if (tool === 'eraser') setTool('pencil');
            }}
            className={styles.colorPicker}
          />
        </div>
        
        <div className={styles.sizeSection}>
          <div className={styles.sizeLabel}>Size:</div>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            onFocus={() => setShowSizeIndicator(true)}
            onBlur={() => setShowSizeIndicator(false)}
            className={styles.sizeSlider}
          />
          <div className={styles.sizePreview}>
            <div 
              className={styles.sizeCircle} 
              style={{ 
                width: `${lineWidth}px`, 
                height: `${lineWidth}px`,
                backgroundColor: tool === 'eraser' ? '#ffffff' : color,
                border: tool === 'eraser' ? '1px solid #000000' : 'none'
              }}
            ></div>
          </div>
        </div>
      </div>

      <div 
        className={`${styles.canvasContainer} noDrag`} 
        onClick={(e) => {
          e.stopPropagation();
          // Focus the container to enable keyboard events
          if (containerRef.current) {
            containerRef.current.focus();
          }
        }}
        ref={containerRef}
        tabIndex={0} // Make container focusable
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`${styles.canvas} ${tool === 'pencil' ? styles.pencilCursor : tool === 'eraser' ? styles.eraserCursor : ''}`}
        />
        
        {/* Size indicator that follows the cursor */}
        {showSizeIndicator && (
          <div 
            className={styles.cursorSizeIndicator}
            style={{
              width: `${lineWidth}px`,
              height: `${lineWidth}px`,
              left: `${cursorPosition.x}px`,
              top: `${cursorPosition.y}px`,
              backgroundColor: tool === 'eraser' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)',
              border: tool === 'eraser' ? '1px solid #000' : 'none'
            }}
          />
        )}
      </div>

      <div className={`${styles.statusBar} noDrag`}>
        <div className={styles.statusText}>
          Ready | Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)} | Size: {lineWidth}px | 
          {undoStack.length > 0 ? ` Undo Available (Ctrl+Z)` : ' No Undo Available'}
        </div>
        <div className={styles.resolutionText}>
          {canvasRef.current?.width || 0} x {canvasRef.current?.height || 0}px | 
          Position: {Math.round(cursorPosition.x)}, {Math.round(cursorPosition.y)}
        </div>
      </div>
    </div>
  );
}