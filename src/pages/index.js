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
  
  // Desktop icons configuration
  const desktopIcons = [
    { id: 'mspaint', name: 'MS Paint', icon: '/icons/mspaint.png' },
    { id: 'notes', name: 'Notes', icon: '/icons/notes.png' },
  ];
  
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
      <div className={styles.desktop}>
        {/* Desktop Icons */}
        <div className={styles.desktopIcons}>
          {desktopIcons.map((icon) => (
            <div 
              key={icon.id}
              className={styles.desktopIcon}
              onDoubleClick={() => handleIconDoubleClick(icon.id)}
            >
              <div className={styles.iconImage}>
                <img src={icon.icon} alt={icon.name} />
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
                    onClick={() => closeWindow(window.id)}
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
          <div className={styles.taskbarClock}>{currentTime}</div>
        </div>
      </div>
    </div>
  );
}