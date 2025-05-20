import { useState, useRef, useEffect } from 'react';
import styles from '../styles/NotesApp.module.css';
import { database } from '../firebase';
import { ref, onValue, set } from "firebase/database";

export default function NotesApp({ windowId }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Load notes content from Firebase
  useEffect(() => {
    if (windowId) {
      const notesRef = ref(database, `notes/${windowId}`);
      
      const unsubscribe = onValue(notesRef, (snapshot) => {
        const data = snapshot.val();
        
        // Only update if we're not currently typing to avoid cursor jump
        if (!isTyping && data !== null) {
          setText(data);
        }
      });
      
      return () => unsubscribe();
    }
  }, [windowId, isTyping]);

  // Resize textarea to fit container
  useEffect(() => {
    const resizeTextarea = () => {
      if (containerRef.current && textareaRef.current) {
        const container = containerRef.current;
        const textarea = textareaRef.current;
        
        const rect = container.getBoundingClientRect();
        textarea.style.width = `${rect.width - 4}px`;
        textarea.style.height = `${rect.height - 4}px`;
      }
    };
    
    resizeTextarea();
    window.addEventListener('resize', resizeTextarea);
    
    // Create a ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      resizeTextarea();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeTextarea);
    };
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // Set typing status to prevent updates from Firebase while user is typing
    setIsTyping(true);
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // When the timeout expires, update Firebase and clear typing status
      if (windowId) {
        set(ref(database, `notes/${windowId}`), newText);
      }
      setIsTyping(false);
    }, 500); // Send update after 500ms of no typing
  };

  return (
    <div className={`${styles.notesContainer} noDrag`} ref={containerRef}>
      <textarea
        ref={textareaRef}
        className={styles.notesTextarea}
        value={text}
        onChange={handleTextChange}
        placeholder="Type your notes here..."
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}