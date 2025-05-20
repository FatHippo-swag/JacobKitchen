import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import PaintApp from '../components/PaintApp';
import NotesApp from '../components/NotesApp';

export default function Home() {
  // State for tracking active windows
  const [windows, setWindows] = useState([
    // Initial windows can be empty - we'll create them dynamically
  ]);
  const [windowCount, setWindowCount] = useState(0);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  
  // State for tracking the currently active window
  const [activeWindowId, setActiveWindowId] = useState(null);
  
  // State for desktop background color
  const [desktopColor, setDesktopColor] = useState('#008080'); // Classic teal as default
  const [previewColor, setPreviewColor] = useState('#008080'); // For preview before applying
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Desktop icons configuration with built-in SVG fallbacks
  const desktopIcons = [ { id: 'mspaint', name: 'MS Paint', icon: '/icons/mspaint.png' }, { id: 'notes', name: 'Notes', icon: '/icons/notes.png' }, ];
  
  // Handle window open
  const openWindow = (windowType) => {
    // Create a unique ID for the window
    const uniqueId = `${windowType}-${windowCount}`;
    setWindowCount(prev => prev + 1);
    
    // Create window config based on type
    let windowConfig = {
      id: uniqueId,
      type: windowType,
      isOpen: true,
      zIndex: Math.max(...windows.map(w => w.zIndex || 0), 0) + 1
    };
    
    // Set type-specific properties
    if (windowType === 'mspaint') {
      windowConfig.title = 'MS Paint';
      windowConfig.position = { 
        x: 150 + (windowCount * 20), 
        y: 100 + (windowCount * 20) 
      };
      windowConfig.size = { width: 600, height: 400 };
    } else if (windowType === 'notes') {
      windowConfig.title = 'Notepad';
      windowConfig.position = { 
        x: 200 + (windowCount * 20), 
        y: 150 + (windowCount * 20) 
      };
      windowConfig.size = { width: 400, height: 300 };
    }
    
    // Add new window to the state
    setWindows(prev => [...prev, windowConfig]);
    setActiveWindowId(uniqueId);
  };
  
  // Handle window minimize
  const minimizeWindow = (windowId) => {
    // Find the window to minimize
    const windowToMinimize = windows.find(w => w.id === windowId);
    if (!windowToMinimize) return;
    
    // Add to minimized windows list
    setMinimizedWindows(prev => [...prev, windowToMinimize]);
    
    // Remove from active windows
    setWindows(windows.filter(window => window.id !== windowId));
    
    // Set a new active window if needed
    if (activeWindowId === windowId) {
      const remainingWindows = windows.filter(w => w.id !== windowId);
      if (remainingWindows.length > 0) {
        const highestZWindow = remainingWindows.reduce((prev, current) => 
          (prev.zIndex > current.zIndex) ? prev : current
        );
        setActiveWindowId(highestZWindow.id);
      } else {
        setActiveWindowId(null);
      }
    }
  };
  
  // Handle window restore (from minimized state)
  const restoreWindow = (windowId) => {
    // Find the window to restore
    const windowToRestore = minimizedWindows.find(w => w.id === windowId);
    if (!windowToRestore) return;
    
    // Update its z-index to bring it to front
    const updatedWindow = {
      ...windowToRestore,
      zIndex: Math.max(...windows.map(w => w.zIndex || 0), 0) + 1
    };
    
    // Add back to active windows
    setWindows(prev => [...prev, updatedWindow]);
    
    // Remove from minimized windows
    setMinimizedWindows(minimizedWindows.filter(window => window.id !== windowId));
    
    // Set as active window
    setActiveWindowId(windowId);
  };
  
  // Handle window close
  const closeWindow = (windowId) => {
    // Determine if window is minimized or active
    const isMinimized = minimizedWindows.some(w => w.id === windowId);
    
    if (isMinimized) {
      setMinimizedWindows(minimizedWindows.filter(window => window.id !== windowId));
    } else {
      setWindows(windows.filter(window => window.id !== windowId));
      
      // Set the next highest zIndex window as active
      const remainingWindows = windows.filter(w => w.id !== windowId);
      if (remainingWindows.length > 0) {
        const highestZWindow = remainingWindows.reduce((prev, current) => 
          (prev.zIndex > current.zIndex) ? prev : current
        );
        setActiveWindowId(highestZWindow.id);
      } else {
        setActiveWindowId(null);
      }
    }
  };
  
  // Handle window focus
  const focusWindow = (windowId) => {
    setWindows(windows.map(window => {
      if (window.id === windowId) {
        return { ...window, zIndex: Math.max(...windows.map(w => w.zIndex)) + 1 };
      }
      return window;
    }));
    setActiveWindowId(windowId);
  };
  
  // Handle window drag
  const startDrag = (windowId, e) => {
    // Check if we're clicking on a part that should not initiate dragging
    if (e.target.closest('.noDrag')) {
      return;
    }
    
    e.preventDefault();
    
    // Focus the window that's being dragged
    focusWindow(windowId);
    
    const window = windows.find(w => w.id === windowId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = window.position.x;
    const startPosY = window.position.y;
    
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setWindows(windows.map(w => {
        if (w.id === windowId) {
          return {
            ...w,
            position: {
              x: startPosX + dx,
              y: startPosY + dy
            }
          };
        }
        return w;
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle window resize
  const startResize = (windowId, e) => {
    e.preventDefault();
    
    // Focus the window that's being resized
    focusWindow(windowId);
    
    const window = windows.find(w => w.id === windowId);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = window.size.width;
    const startHeight = window.size.height;
    
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setWindows(windows.map(w => {
        if (w.id === windowId) {
          return {
            ...w,
            size: {
              width: Math.max(300, startWidth + dx),
              height: Math.max(200, startHeight + dy)
            }
          };
        }
        return w;
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Color picker functions
  const handleColorChange = (color) => {
    // Just update the preview color - don't close the picker
    setPreviewColor(color);
  };

  const applyColorChange = () => {
    // Apply the previewed color to the actual desktop
    setDesktopColor(previewColor);
    setShowColorPicker(false);
  };

  const cancelColorChange = () => {
    // Reset the preview color to the current desktop color
    setPreviewColor(desktopColor);
    setShowColorPicker(false);
  };

  const openColorPicker = () => {
    setPreviewColor(desktopColor); // Start with current color
    setShowColorPicker(true);
  };
  
  // Get the current time for the taskbar clock
  const [currentTime, setCurrentTime] = useState('');
  
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    
    updateClock();
    const intervalId = setInterval(updateClock, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Click outside handler for color picker
  useEffect(() => {
    if (!showColorPicker) return;
    
    const handleClickOutside = (event) => {
      if (
        event.target.closest(`.${styles.colorPickerPopup}`) === null &&
        event.target.closest(`.${styles.colorPickerButton}`) === null
      ) {
        // Cancel color change when clicking outside (reset to original)
        cancelColorChange();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker, styles.colorPickerPopup, styles.colorPickerButton]);
  
  // For double click handling on desktop icons
  const handleIconDoubleClick = (iconId) => {
    openWindow(iconId);
  };
  
  return (
    <div className={styles.desktopContainer}>
      <Head>
        <title>Windows 97 Webcore</title>
        <meta name="description" content="Windows 97-style desktop environment" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Desktop */}
      <div className={styles.desktop} style={{ 
        backgroundColor: showColorPicker ? previewColor : desktopColor 
      }}>
        {/* Desktop Icons */}
        <div className={styles.desktopIcons}>
          {desktopIcons.map((icon) => (
            <div 
              key={icon.id}
              className={styles.desktopIcon}
              onDoubleClick={() => handleIconDoubleClick(icon.id)}
            >
              <div className={styles.iconImage}>
                <img 
                  src={icon.icon} 
                  alt={icon.name} 
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    objectFit: 'contain' // Ensures image fits within dimensions
                  }} 
                />
              </div>
              <div className={styles.iconText}>{icon.name}</div>
            </div>
          ))}
        </div>
        
        {/* Windows */}
        {windows.map((window) => {
          if (!window.isOpen) return null;
          
          return (
            <div
              key={window.id}
              className={`${styles.window} ${activeWindowId === window.id ? styles.activeWindow : ''}`}
              style={{
                zIndex: window.zIndex,
                left: window.position.x,
                top: window.position.y,
                width: window.size.width,
                height: window.size.height
              }}
              onClick={() => focusWindow(window.id)}
            >
              {/* Window Title Bar */}
              <div 
                className={styles.windowTitleBar}
                onMouseDown={(e) => startDrag(window.id, e)}
              >
                <div className={styles.windowTitle}>{window.title}</div>
                <div className={styles.windowControls}>
                  <button className={styles.windowMinimize}>_</button>
                  <button className={styles.windowMaximize}>□</button>
                  <button 
                    className={styles.windowClose}
                    onClick={(e) => {
                      e.stopPropagation(); // Stop event propagation
                      closeWindow(window.id);
                    }}
                  >✕</button>
                </div>
              </div>
              
              {/* Window Content */}
              <div className={styles.windowContent}>
                {window.type === 'mspaint' && <PaintApp windowId={window.id} />}
                {window.type === 'notes' && <NotesApp windowId={window.id} />}
              </div>
              
              {/* Resize Handle */}
              <div 
                className={styles.resizeHandle}
                onMouseDown={(e) => startResize(window.id, e)}
              ></div>
            </div>
          );
        })}
      </div>
      
      {/* Taskbar */}
      <div className={styles.taskbar}>
        <div className={styles.madeByTag}>
          Made by ben:)
        </div>
        
        <div className={styles.runningApps}>
          {/* Active windows */}
          {windows.map((window) => (
            <div 
              key={window.id}
              className={`${styles.taskbarButton} ${activeWindowId === window.id ? styles.activeTaskbarButton : ''}`}
              onClick={() => focusWindow(window.id)}
            >
              {window.title}
            </div>
          ))}
          
          {/* Minimized windows */}
          {minimizedWindows.map((window) => (
            <div 
              key={window.id}
              className={`${styles.taskbarButton} ${styles.minimizedTaskbarButton}`}
              onClick={() => restoreWindow(window.id)}
            >
              {window.title}
            </div>
          ))}
        </div>
        
        <div className={styles.taskbarRight}>
          {/* Color picker button */}
          <div className={styles.colorPickerButton}
            onClick={openColorPicker}
            title="Change desktop color">
            <div className={styles.colorIndicator} style={{ backgroundColor: desktopColor }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1H11V11H1V1Z" stroke="#000" strokeWidth="1" fill="none"/>
                <path d="M1 1L11 11M1 11L11 1" stroke="#000" strokeWidth="0.8" fill="none"/>
              </svg>
            </div>
          </div>
          
          {/* Color picker popup */}
          {showColorPicker && (
            <div className={styles.colorPickerPopup}>
              <div className={styles.colorPickerTitle}>Desktop Colors</div>
              <div className={styles.colorOptions}>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#008080' }} 
                  onClick={() => handleColorChange('#008080')}
                  title="Classic Teal"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#000080' }} 
                  onClick={() => handleColorChange('#000080')}
                  title="Navy"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#008000' }} 
                  onClick={() => handleColorChange('#008000')}
                  title="Green"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#800080' }} 
                  onClick={() => handleColorChange('#800080')}
                  title="Purple"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#c0c0c0' }} 
                  onClick={() => handleColorChange('#c0c0c0')}
                  title="Silver"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#000000' }} 
                  onClick={() => handleColorChange('#000000')}
                  title="Black"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#808080' }} 
                  onClick={() => handleColorChange('#808080')}
                  title="Gray"></div>
                <div className={styles.colorOption} 
                  style={{ backgroundColor: '#0000ff' }} 
                  onClick={() => handleColorChange('#0000ff')}
                  title="Blue"></div>
              </div>
              <div className={styles.customColorSection}>
                <input 
                  type="color" 
                  value={previewColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className={styles.customColorPicker}
                />
                <span>Custom</span>
              </div>
              
              {/* Add buttons to confirm or cancel */}
              <div className={styles.colorPickerButtons}>
                <button onClick={cancelColorChange}>Cancel</button>
                <button onClick={applyColorChange}>OK</button>
              </div>
            </div>
          )}
          
          <div className={styles.taskbarClock}>{currentTime}</div>
        </div>
      </div>
    </div>
  );
}