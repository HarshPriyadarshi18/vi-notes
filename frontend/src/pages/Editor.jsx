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
  const [pasteAlert, setPasteAlert] = useState(false);

  const textareaRef = useRef(null);
  const sessionStartTime = useRef(Date.now());
  const autoSaveTimer = useRef(null);

  const navigate = useNavigate();

  // Load session
  useEffect(() => {
    const loadData = async () => {
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
            keystrokeEvents: session.keystrokeEvents || [],
            charCount: (session.content || '').length,
            wordCount: (session.content || '').trim().split(/\s+/).filter(w => w).length
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
    textareaRef.current?.focus();

    return () => clearInterval(autoSaveTimer.current);
  }, []);

  // Auto-save
  useEffect(() => {
    autoSaveTimer.current = setInterval(handleSave, 30000);
    return () => clearInterval(autoSaveTimer.current);
  }, [state]);

  // Key tracking
  const handleKeyDown = () => {
    setLastKeydownTime(Date.now());
  };

  const handleKeyUp = () => {
    const now = Date.now();

    if (lastKeydownTime) {
      const holdTime = now - lastKeydownTime;
      const interKeyTime = lastKeyupTime ? lastKeydownTime - lastKeyupTime : 0;

      const event = {
        keydownTime: lastKeydownTime - sessionStartTime.current,
        keyupTime: now - sessionStartTime.current,
        holdTime,
        interKeyTime
      };

      setState(prev => ({
        ...prev,
        keystrokeEvents: [...(prev.keystrokeEvents || []), event]
      }));

      setLastKeyupTime(now);
    }
  };

  const calculateWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Typing
  const handleInput = (e) => {
    const newContent = e.target.value;
    const diff = newContent.length - state.content.length;

    let typedChars = state.totalTypedChars;
    if (diff > 0) typedChars += diff;

    setState(prev => ({
      ...prev,
      content: newContent,
      charCount: newContent.length,
      wordCount: calculateWordCount(newContent),
      totalTypedChars: typedChars,
      lastKeystrokeTime: Date.now()
    }));
  };

  // ✅ FIXED Paste
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pasteEvent = {
      timestamp: Date.now() - sessionStartTime.current,
      pastedLength: pastedText.length,
      cursorPosition: textarea.selectionStart,
      timeSinceLastKeystroke: Date.now() - state.lastKeystrokeTime,
      pasteIndex: state.pasteIndex
    };

    const newTotalPastedChars = state.totalPastedChars + pastedText.length;
    const totalChars = state.totalTypedChars + newTotalPastedChars;

    setState(prev => ({
      ...prev,
      pasteEvents: [...(prev.pasteEvents || []), pasteEvent],
      totalPastedChars: newTotalPastedChars,
      pasteRatio: totalChars ? newTotalPastedChars / totalChars : 0,
      pasteIndex: prev.pasteIndex + 1
    }));

    setPasteAlert(true);
    setTimeout(() => setPasteAlert(false), 2000);
  };

  // Save
  const handleSave = async () => {
    if (!state.content.trim()) return;

    setIsSaving(true);
    try {
      await sessionService.saveSession(state);
      setSaveStatus('✓ Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus('✗ Failed');
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

      {/* Paste Alert */}
      {pasteAlert && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fff3cd',
          border: '1px solid #f0c040',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '13px',
          color: '#7d5a00',
          zIndex: 999
        }}>
          📋 Paste detected — metadata recorded
        </div>
      )}

      {/* HEADER */}
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

      {/* ✅ MAIN FIXED */}
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
        />
      </div>

      {/* FOOTER */}
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