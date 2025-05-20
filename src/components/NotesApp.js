import { useState, useRef, useEffect } from 'react';
import styles from '../styles/NotesApp.module.css';

export default function NotesApp({ windowId }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

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
    setText(e.target.value);
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