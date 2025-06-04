import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../styles/NotesApp.module.css';

export default function NotesApp({ windowId }) {
  // Enhanced state management - using local state with localStorage persistence
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [categories, setCategories] = useState(['General', 'Tasks', 'Ideas', 'Work']);
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Rich text state
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Dedicated save functions for immediate persistence
  const saveNotesToStorage = useCallback((notesToSave) => {
    try {
      localStorage.setItem(`notes-${windowId}`, JSON.stringify(notesToSave));
      console.log('Notes saved to localStorage:', notesToSave.length, 'notes');
    } catch (e) {
      console.error('Error saving notes to localStorage:', e);
    }
  }, [windowId]);

  const saveCategoriesToStorage = useCallback((categoriesToSave) => {
    try {
      localStorage.setItem(`categories-${windowId}`, JSON.stringify(categoriesToSave));
      console.log('Categories saved to localStorage:', categoriesToSave);
    } catch (e) {
      console.error('Error saving categories to localStorage:', e);
    }
  }, [windowId]);

  // Initialize with sample data if no saved data exists
  const initializeSampleData = useCallback(() => {
    const sampleNotes = [
      {
        id: 'sample-1',
        title: 'Welcome to Enhanced Notes!',
        content: 'This is a **bold** example note with *italic* text and __underlined__ text.\n\n• Bullet point 1\n• Bullet point 2\n\n☐ Uncompleted task\n☑ Completed task\n\nYou can format text using:\n- **text** for bold\n- *text* for italic\n- __text__ for underline\n- • for bullet points\n- ☐ and ☑ for checkboxes',
        category: 'General',
        type: 'note',
        completed: false,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 3600000
      },
      {
        id: 'sample-2',
        title: 'Sample Task',
        content: 'This is a sample task that you can mark as complete!',
        category: 'Tasks',
        type: 'task',
        completed: false,
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 1800000
      }
    ];
    
    setNotes(sampleNotes);
    setCurrentNote(sampleNotes[0]);
    saveNotesToStorage(sampleNotes);
  }, [saveNotesToStorage]);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes-${windowId}`);
    const savedCategories = localStorage.getItem(`categories-${windowId}`);
    
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        if (parsedNotes && parsedNotes.length > 0) {
          setNotes(parsedNotes);
          setCurrentNote(parsedNotes[0]);
          console.log('Loaded notes from localStorage:', parsedNotes.length, 'notes');
        } else {
          initializeSampleData();
        }
      } catch (e) {
        console.error('Error loading notes from localStorage:', e);
        initializeSampleData();
      }
    } else {
      // No saved notes, initialize with sample data
      initializeSampleData();
    }
    
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        if (parsedCategories && parsedCategories.length > 0) {
          setCategories(parsedCategories);
          console.log('Loaded categories from localStorage:', parsedCategories);
        }
      } catch (e) {
        console.error('Error loading categories from localStorage:', e);
      }
    }
  }, [windowId, initializeSampleData]);

  // Create new note with immediate save
  const createNewNote = () => {
    const newNote = {
      id: `note_${Date.now()}`,
      title: 'New Note',
      content: '',
      category: selectedCategory,
      type: 'note',
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    setCurrentNote(newNote);
    setIsCreatingNote(false);
    
    // Immediately save to localStorage
    saveNotesToStorage(updatedNotes);
  };

  // Delete current note with immediate save
  const deleteCurrentNote = () => {
    if (currentNote) {
      const updatedNotes = notes.filter(note => note.id !== currentNote.id);
      setNotes(updatedNotes);
      setCurrentNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
      
      // Immediately save to localStorage
      saveNotesToStorage(updatedNotes);
    }
  };

  // Handle text change with immediate save
  const handleTextChange = (field, value) => {
    if (!currentNote) return;
    
    const updatedNote = { ...currentNote, [field]: value, updatedAt: Date.now() };
    setCurrentNote(updatedNote);
    
    // Update the note in the notes array
    const updatedNotes = notes.map(note => 
      note.id === currentNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    
    // Clear any existing timeout to prevent multiple saves
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Debounce only the typing indicator, but save immediately for critical changes
    if (field === 'content') {
      setIsTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 500);
    }
    
    // Immediately save to localStorage for all changes
    saveNotesToStorage(updatedNotes);
  };

  // Toggle task completion with immediate save
  const toggleTaskCompletion = () => {
    if (currentNote) {
      const updatedNote = { 
        ...currentNote, 
        completed: !currentNote.completed,
        updatedAt: Date.now()
      };
      setCurrentNote(updatedNote);
      
      // Update the note in the notes array
      const updatedNotes = notes.map(note => 
        note.id === currentNote.id ? updatedNote : note
      );
      setNotes(updatedNotes);
      
      // Immediately save to localStorage
      saveNotesToStorage(updatedNotes);
    }
  };

  // Insert formatting
  const insertFormatting = (formatType) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let replacement = '';
    let cursorOffset = 0;
    
    switch (formatType) {
      case 'bold':
        replacement = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'underline':
        replacement = `__${selectedText}__`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'bullet':
        replacement = selectedText ? `• ${selectedText}` : '• ';
        cursorOffset = selectedText ? 0 : 0;
        break;
      case 'checkbox':
        replacement = selectedText ? `☐ ${selectedText}` : '☐ ';
        cursorOffset = selectedText ? 0 : 0;
        break;
      case 'checkboxDone':
        replacement = selectedText ? `☑ ${selectedText}` : '☑ ';
        cursorOffset = selectedText ? 0 : 0;
        break;
    }
    
    const newContent = 
      textarea.value.substring(0, start) + 
      replacement + 
      textarea.value.substring(end);
    
    handleTextChange('content', newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Add new category with immediate save
  const addCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      const updatedCategories = [...categories, newCategoryName.trim()];
      setCategories(updatedCategories);
      setNewCategoryName('');
      setShowCategoryDialog(false);
      
      // Immediately save to localStorage
      saveCategoriesToStorage(updatedCategories);
    }
  };

  // Filter notes based on search and category
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Format date for display
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${styles.notesContainer} noDrag`} ref={containerRef}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolSection}>
          <button 
            className={styles.toolButton}
            onClick={createNewNote}
            title="New Note"
          >
            New
          </button>
          <button 
            className={styles.toolButton}
            onClick={deleteCurrentNote}
            disabled={!currentNote}
            title="Delete Note"
          >
            Delete
          </button>
          <div className={styles.separator}></div>
          <select 
            className={styles.categorySelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button 
            className={styles.toolButton}
            onClick={() => setShowCategoryDialog(true)}
            title="Add Category"
          >
            +Cat
          </button>
        </div>
        
        <div className={styles.searchSection}>
          <input 
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className={styles.mainContent}>
        {/* Notes list */}
        <div className={styles.notesList}>
          <div className={styles.notesListHeader}>
            Notes ({filteredNotes.length})
          </div>
          <div className={styles.notesListContent}>
            {filteredNotes.map(note => (
              <div 
                key={note.id}
                className={`${styles.noteItem} ${currentNote?.id === note.id ? styles.selectedNote : ''}`}
                onClick={() => setCurrentNote(note)}
              >
                <div className={styles.noteItemHeader}>
                  <span className={styles.noteTitle}>
                    {note.type === 'task' && (
                      <span className={note.completed ? styles.completedTask : styles.pendingTask}>
                        {note.completed ? '☑' : '☐'} 
                      </span>
                    )}
                    {note.title}
                  </span>
                  <span className={styles.noteCategory}>{note.category}</span>
                </div>
                <div className={styles.notePreview}>
                  {note.content.substring(0, 50)}...
                </div>
                <div className={styles.noteDate}>
                  {formatDate(note.updatedAt)}
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className={styles.emptyState}>
                No notes found. Click "New" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Note editor */}
        <div className={styles.noteEditor}>
          {currentNote ? (
            <>
              {/* Note header */}
              <div className={styles.noteHeader}>
                <input 
                  type="text"
                  value={currentNote.title}
                  onChange={(e) => handleTextChange('title', e.target.value)}
                  className={styles.noteTitleInput}
                  placeholder="Note title..."
                />
                <div className={styles.noteControls}>
                  <select 
                    value={currentNote.category}
                    onChange={(e) => handleTextChange('category', e.target.value)}
                    className={styles.noteCategorySelect}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select 
                    value={currentNote.type}
                    onChange={(e) => handleTextChange('type', e.target.value)}
                    className={styles.noteTypeSelect}
                  >
                    <option value="note">Note</option>
                    <option value="task">Task</option>
                  </select>
                  {currentNote.type === 'task' && (
                    <button 
                      className={`${styles.taskToggle} ${currentNote.completed ? styles.completed : ''}`}
                      onClick={toggleTaskCompletion}
                      title={currentNote.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {currentNote.completed ? '☑ Done' : '☐ Pending'}
                    </button>
                  )}
                </div>
              </div>

              {/* Formatting toolbar */}
              <div className={styles.formattingToolbar}>
                <button 
                  className={styles.formatButton}
                  onClick={() => insertFormatting('bold')}
                  title="Bold (**text**)"
                >
                  B
                </button>
                <button 
                  className={styles.formatButton}
                  onClick={() => insertFormatting('italic')}
                  title="Italic (*text*)"
                >
                  I
                </button>
                <button 
                  className={styles.formatButton}
                  onClick={() => insertFormatting('underline')}
                  title="Underline (__text__)"
                >
                  U
                </button>
                <div className={styles.separator}></div>
                <button 
                  className={styles.formatButton}
                  onClick={() => insertFormatting('bullet')}
                  title="Bullet Point"
                >
                  •
                </button>
                <button 
                  className={styles.formatButton}
                  onClick={() => insertFormatting('checkbox')}
                  title="Checkbox"
                >
                  ☐
                </button>
                <button 
                  className={styles.formatButton}
                  onClick={() => insertFormatting('checkboxDone')}
                  title="Checked Checkbox"
                >
                  ☑
                </button>
              </div>

              {/* Content editor */}
              <textarea
                ref={textareaRef}
                className={styles.noteContent}
                value={currentNote.content}
                onChange={(e) => handleTextChange('content', e.target.value)}
                placeholder="Start typing your note..."
              />

              {/* Status bar */}
              <div className={styles.statusBar}>
                <span>
                  {currentNote.type === 'task' ? 'Task' : 'Note'} | 
                  {currentNote.category} | 
                  Created: {formatDate(currentNote.createdAt)} | 
                  Updated: {formatDate(currentNote.updatedAt)}
                </span>
                <span>
                  {currentNote.content.length} characters
                </span>
              </div>
            </>
          ) : (
            <div className={styles.noNoteSelected}>
              <div className={styles.noNoteMessage}>
                <h3>No note selected</h3>
                <p>Select a note from the list or create a new one.</p>
                <button 
                  className={styles.createFirstNote}
                  onClick={createNewNote}
                >
                  Create New Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category dialog */}
      {showCategoryDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogHeader}>Add New Category</div>
            <div className={styles.dialogContent}>
              <input 
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className={styles.dialogInput}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                autoFocus
              />
            </div>
            <div className={styles.dialogButtons}>
              <button 
                className={styles.dialogButton}
                onClick={() => setShowCategoryDialog(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.dialogButton}
                onClick={addCategory}
                disabled={!newCategoryName.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}