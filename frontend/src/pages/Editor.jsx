/*import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import sessionService from '../services/sessionService.js';
import '../styles/Editor.css';

export const Editor = () => {
  const [state, setState] = useState({
    content: '',
    wordCount: 0,
    charCount: 0,
    totalTypedChars: 0,
    totalPastedChars: 0,
    pasteRatio: 0,
    pasteEvents: [],
    keystrokeEvents: [],
    lastKeystrokeTime: Date.now(),
    pasteIndex: 0
  });

  const [userEmail, setUserEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [lastKeydownTime, setLastKeydownTime] = useState(null);
  const [lastKeyupTime, setLastKeyupTime] = useState(null);

  const textareaRef = useRef(null);
  const sessionStartTime = useRef(Date.now());
  const autoSaveTimer = useRef(null);

  const navigate = useNavigate();

  // Load user email and session data on mount
  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
        const user = await authService.getMe();
        setUserEmail(user.email);

        const session = await sessionService.getSession();
        if (session) {
          setState(prev => ({
            ...prev,
            content: session.content || '',
            totalTypedChars: session.totalTypedChars || 0,
            totalPastedChars: session.totalPastedChars || 0,
            pasteRatio: session.pasteRatio || 0,
            pasteEvents: session.pasteEvents || [],
            charCount: (session.content || '').length
          }));

          // Update word count
          const words = (session.content || '').trim().split(/\s+/).filter(w => w.length > 0).length;
          setState(prev => ({ ...prev, wordCount: words }));
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadUserAndSession();
    textareaRef.current?.focus();

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      handleSave();
    }, 30000);

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [state]);

  const handleKeyDown = (e) => {
    const currentTime = Date.now();
    setLastKeydownTime(currentTime);
  };

  const handleKeyUp = (e) => {
    const currentTime = Date.now();
    const keydownTime = lastKeydownTime;
    const keyupTime = currentTime;

    if (keydownTime) {
      const holdTime = keyupTime - keydownTime;
      const interKeyTime = lastKeyupTime ? keydownTime - lastKeyupTime : 0;

      const keystrokeEvent = {
        keydownTime: keydownTime - sessionStartTime.current,
        keyupTime: keyupTime - sessionStartTime.current,
        holdTime,
        interKeyTime
      };

      setState(prev => ({
        ...prev,
        keystrokeEvents: [...prev.keystrokeEvents, keystrokeEvent]
      }));

      setLastKeyupTime(keyupTime);
    }
  };

  const calculateWordCount = (text) => {
    if (!text || !text.trim()) {
      return 0;
    }
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const handleInput = (e) => {
    const target = e.currentTarget;
    const newContent = target.value;
    const oldContent = state.content;

    // Calculate typed characters (difference that isn't from paste)
    const diff = newContent.length - oldContent.length;
    let typedChars = state.totalTypedChars;

    if (diff > 0 && !state.pasteEvents.some(p => p.timestamp === Date.now() - sessionStartTime.current)) {
      typedChars += diff;
    }

    setState(prev => ({
      ...prev,
      content: newContent,
      charCount: newContent.length,
      wordCount: calculateWordCount(newContent),
      totalTypedChars: typedChars,
      lastKeystrokeTime: Date.now()
    }));
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const textarea = textareaRef.current;

    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const timeSinceLastKeystroke = Date.now() - state.lastKeystrokeTime;
    const timestamp = Date.now() - sessionStartTime.current;

    const pasteEvent = {
      timestamp,
      pastedLength: pastedText.length,
      cursorPosition,
      timeSinceLastKeystroke,
      pasteIndex: state.pasteIndex
    };

    const newTotalPastedChars = state.totalPastedChars + pastedText.length;
    const totalChars = state.totalTypedChars + newTotalPastedChars;
    const newPasteRatio = totalChars > 0 ? newTotalPastedChars / totalChars : 0;

    setState(prev => ({
      ...prev,
      pasteEvents: [...prev.pasteEvents, pasteEvent],
      totalPastedChars: newTotalPastedChars,
      pasteRatio: newPasteRatio,
      pasteIndex: prev.pasteIndex + 1
    }));
  };

  const handleSave = async () => {
    if (!state.content.trim()) return;

    setIsSaving(true);
    setSaveStatus('');

    try {
      await sessionService.saveSession({
        content: state.content,
        totalTypedChars: state.totalTypedChars,
        totalPastedChars: state.totalPastedChars,
        pasteRatio: state.pasteRatio,
        pasteEvents: state.pasteEvents,
        keystrokeEvents: state.keystrokeEvents
      });

      setSaveStatus('✓ Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('✗ Save failed');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h1>Vi-Notes</h1>
        <div className="header-right">
          <span className="user-email">{userEmail}</span>
          <button onClick={handleSave} disabled={isSaving} className="save-btn">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {saveStatus && <span className="save-status">{saveStatus}</span>}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="editor-main">
        <textarea
          ref={textareaRef}
          value={state.content}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Start typing... Your notes will be automatically saved."
          className="editor-textarea"
          autoFocus
        />
      </div>

      <div className="editor-footer">
        <div className="stats">
          <span>Words: <strong>{state.wordCount}</strong></span>
          <span>Characters: <strong>{state.charCount}</strong></span>
        </div>
        <div className="paste-stats">
          <span>Typed: <strong>{state.totalTypedChars}</strong></span>
          <span>Pasted: <strong>{state.totalPastedChars}</strong></span>
          <span>
            Paste Ratio: <strong>{(state.pasteRatio * 100).toFixed(1)}%</strong>
          </span>
          <span>Pastes: <strong>{state.pasteEvents.length}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default Editor;*/
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import sessionService from '../services/sessionService.js';
import '../styles/Editor.css';

export const Editor = () => {
  const [state, setState] = useState({
    content: '',
    wordCount: 0,
    charCount: 0,
    totalTypedChars: 0,
    totalPastedChars: 0,
    pasteRatio: 0,
    pasteEvents: [],
    keystrokeEvents: [],
    lastKeystrokeTime: Date.now(),
    pasteIndex: 0
  });

  const [userEmail, setUserEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [lastKeydownTime, setLastKeydownTime] = useState(null);
  const [lastKeyupTime, setLastKeyupTime] = useState(null);

  // ── NEW — paste alert ──────────────────────────────
  const [pasteAlert, setPasteAlert] = useState(false);

  const textareaRef = useRef(null);
  const sessionStartTime = useRef(Date.now());
  const autoSaveTimer = useRef(null);

  const navigate = useNavigate();

  // Load user email and session data on mount
  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
        const user = await authService.getMe();
        setUserEmail(user.email);

        const session = await sessionService.getSession();
        if (session) {
          setState(prev => ({
            ...prev,
            content: session.content || '',
            totalTypedChars: session.totalTypedChars || 0,
            totalPastedChars: session.totalPastedChars || 0,
            pasteRatio: session.pasteRatio || 0,
            pasteEvents: session.pasteEvents || [],
            charCount: (session.content || '').length
          }));

          const words = (session.content || '').trim().split(/\s+/).filter(w => w.length > 0).length;
          setState(prev => ({ ...prev, wordCount: words }));
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadUserAndSession();
    textareaRef.current?.focus();

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      handleSave();
    }, 30000);

    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [state]);

  const handleKeyDown = (e) => {
    const currentTime = Date.now();
    setLastKeydownTime(currentTime);
  };

  const handleKeyUp = (e) => {
    const currentTime = Date.now();
    const keydownTime = lastKeydownTime;
    const keyupTime = currentTime;

    if (keydownTime) {
      const holdTime = keyupTime - keydownTime;
      const interKeyTime = lastKeyupTime ? keydownTime - lastKeyupTime : 0;

      const keystrokeEvent = {
        keydownTime: keydownTime - sessionStartTime.current,
        keyupTime: keyupTime - sessionStartTime.current,
        holdTime,
        interKeyTime
      };

      setState(prev => ({
        ...prev,
        keystrokeEvents: [...prev.keystrokeEvents, keystrokeEvent]
      }));

      setLastKeyupTime(keyupTime);
    }
  };

  const calculateWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  };

  const handleInput = (e) => {
    const target = e.currentTarget;
    const newContent = target.value;
    const oldContent = state.content;

    const diff = newContent.length - oldContent.length;
    let typedChars = state.totalTypedChars;

    if (diff > 0 && !state.pasteEvents.some(p => p.timestamp === Date.now() - sessionStartTime.current)) {
      typedChars += diff;
    }

    setState(prev => ({
      ...prev,
      content: newContent,
      charCount: newContent.length,
      wordCount: calculateWordCount(newContent),
      totalTypedChars: typedChars,
      lastKeystrokeTime: Date.now()
    }));
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const textarea = textareaRef.current;

    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const timeSinceLastKeystroke = Date.now() - state.lastKeystrokeTime;
    const timestamp = Date.now() - sessionStartTime.current;

    const pasteEvent = {
      timestamp,
      pastedLength: pastedText.length,
      cursorPosition,
      timeSinceLastKeystroke,
      pasteIndex: state.pasteIndex
    };

    const newTotalPastedChars = state.totalPastedChars + pastedText.length;
    const totalChars = state.totalTypedChars + newTotalPastedChars;
    const newPasteRatio = totalChars > 0 ? newTotalPastedChars / totalChars : 0;

    setState(prev => ({
      ...prev,
      pasteEvents: [...prev.pasteEvents, pasteEvent],
      totalPastedChars: newTotalPastedChars,
      pasteRatio: newPasteRatio,
      pasteIndex: prev.pasteIndex + 1
    }));

    // ── NEW — show paste alert banner for 2 seconds ──
    setPasteAlert(true);
    setTimeout(() => setPasteAlert(false), 2000);
  };

  const handleSave = async () => {
    if (!state.content.trim()) return;

    setIsSaving(true);
    setSaveStatus('');

    try {
      await sessionService.saveSession({
        content: state.content,
        totalTypedChars: state.totalTypedChars,
        totalPastedChars: state.totalPastedChars,
        pasteRatio: state.pasteRatio,
        pasteEvents: state.pasteEvents,
        keystrokeEvents: state.keystrokeEvents
      });

      setSaveStatus('✓ Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('✗ Save failed');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="editor-container">

      {/* ── NEW — Paste Alert Banner ── */}
      {pasteAlert && (
        <div style={{
          position: 'fixed', top: '70px',
          left: '50%', transform: 'translateX(-50%)',
          background: '#fff3cd', border: '1px solid #f0c040',
          borderRadius: '8px', padding: '10px 20px',
          fontSize: '13px', color: '#7d5a00',
          fontWeight: '500', zIndex: 999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          📋 Paste detected — metadata recorded
        </div>
      )}

      <div className="editor-header">
        <h1>Vi-Notes</h1>
        <div className="header-right">
          <span className="user-email">{userEmail}</span>
          <button onClick={handleSave} disabled={isSaving} className="save-btn">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {saveStatus && <span className="save-status">{saveStatus}</span>}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="editor-main">
        <textarea
          ref={textareaRef}
          value={state.content}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Start typing... Your notes will be automatically saved."
          className="editor-textarea"
          autoFocus
        />
      </div>

      <div className="editor-footer">
        <div className="stats">
          <span>Words: <strong>{state.wordCount}</strong></span>
          <span>Characters: <strong>{state.charCount}</strong></span>
        </div>
        <div className="paste-stats">
          <span>Typed: <strong>{state.totalTypedChars}</strong></span>
          <span>Pasted: <strong>{state.totalPastedChars}</strong></span>
          <span>
            Paste Ratio: <strong>{(state.pasteRatio * 100).toFixed(1)}%</strong>
          </span>
          <span>Pastes: <strong>{state.pasteEvents.length}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default Editor;
