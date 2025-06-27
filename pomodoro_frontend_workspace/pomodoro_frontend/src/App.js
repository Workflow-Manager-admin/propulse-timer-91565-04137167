import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Color palette
const COLORS = {
  primary: '#FF6F61',
  secondary: '#35495E',
  accent: '#65D6AD',
};

// PUBLIC_INTERFACE
function PomodoroTimer() {
  // Timer configuration states
  const [sessionLength, setSessionLength] = useState(() => {
    const stored = localStorage.getItem('sessionLength');
    return stored ? Number(stored) : 25;
  });
  const [breakLength, setBreakLength] = useState(() => {
    const stored = localStorage.getItem('breakLength');
    return stored ? Number(stored) : 5;
  });

  // Core timer states
  const [secondsLeft, setSecondsLeft] = useState(sessionLength * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSession, setIsSession] = useState(true); // true: session, false: break

  // UI/Settings/Feedback
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem('pomodoroHistory');
    return stored ? JSON.parse(stored) : [];
  });
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const stored = localStorage.getItem('audioEnabled');
    return stored ? stored === 'true' : true;
  });

  const intervalRef = useRef(null);
  const beepRef = useRef();

  // Timer ticking logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev > 0) return prev - 1;
          // Timer completion logic
          handleTimerEnd();
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [isRunning]);

  // Sync settings changes
  useEffect(() => {
    localStorage.setItem('sessionLength', sessionLength.toString());
    localStorage.setItem('breakLength', breakLength.toString());
  }, [sessionLength, breakLength]);

  useEffect(() => {
    localStorage.setItem('audioEnabled', audioEnabled ? 'true' : 'false');
  }, [audioEnabled]);

  // Reset time on session/break type or length change
  useEffect(() => {
    setSecondsLeft((isSession ? sessionLength : breakLength) * 60);
    // eslint-disable-next-line
  }, [sessionLength, breakLength, isSession]);

  // Handle timer end
  const handleTimerEnd = () => {
    // Play beep
    if (audioEnabled && beepRef.current) {
      beepRef.current.play();
    }
    // Log session end in history only for work session
    if (isSession) {
      const now = new Date();
      const entry = {
        type: 'Session',
        date: now.toLocaleString(),
        duration: sessionLength,
      };
      const newHistory = [entry, ...history].slice(0, 10); // Keep last 10
      setHistory(newHistory);
      localStorage.setItem('pomodoroHistory', JSON.stringify(newHistory));
    }
    // Auto-switch
    setTimeout(() => {
      setIsSession((prev) => !prev);
      setSecondsLeft((!isSession ? sessionLength : breakLength) * 60);
    }, 600);
  };

  const startTimer = () => setIsRunning(true);

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft((isSession ? sessionLength : breakLength) * 60);
  };

  // Time formatting helper
  const pad = (x) => x.toString().padStart(2, '0');
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Circular progress calculation
  const total = (isSession ? sessionLength : breakLength) * 60;
  const progress = 1 - secondsLeft / total;

  // --- UI Components ----

  return (
    <div className="pomodoro-main">
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        sessionLength={sessionLength}
        breakLength={breakLength}
        setSessionLength={setSessionLength}
        setBreakLength={setBreakLength}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
      />
      <audio
        ref={beepRef}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_116b9c.mp3"
        preload="auto"
      />
      <div className="timer-container">
        <CircularProgress
          percentage={progress}
          color={isSession ? COLORS.primary : COLORS.accent}
        >
          <div className="timer-display" aria-label="Timer Display">
            <div className="timer-label">
              {isSession ? 'WORK' : 'BREAK'}
            </div>
            <div className="timer-time">
              {pad(minutes)}:{pad(seconds)}
            </div>
          </div>
        </CircularProgress>
      </div>
      <div className="timer-controls">
        {isRunning ? (
          <button
            className="ctrl-btn pause"
            onClick={pauseTimer}
            aria-label="Pause Timer"
            style={{ background: COLORS.secondary }}
          >
            ❚❚ Pause
          </button>
        ) : (
          <button
            className="ctrl-btn play"
            onClick={startTimer}
            aria-label="Start Timer"
            style={{ background: COLORS.primary }}
          >
            ▶ Start
          </button>
        )}
        <button
          className="ctrl-btn reset"
          onClick={resetTimer}
          aria-label="Reset Timer"
        >
          ⟲ Reset
        </button>
        <button
          className="ctrl-btn settings"
          onClick={() => setShowSettings(true)}
          aria-label="Open Settings"
        >
          ⚙️
        </button>
      </div>
      <div className="history-section">
        <h2>Session History</h2>
        <SessionHistory history={history} />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function SettingsModal({
  open,
  onClose,
  sessionLength,
  breakLength,
  setSessionLength,
  setBreakLength,
  audioEnabled,
  setAudioEnabled,
}) {
  if (!open) return null;

  // Handlers to validate input
  const handleSessionChange = (e) => {
    const v = Math.max(1, Math.min(60, Number(e.target.value)));
    setSessionLength(v);
  };
  const handleBreakChange = (e) => {
    const v = Math.max(1, Math.min(30, Number(e.target.value)));
    setBreakLength(v);
  };
  return (
    <div className="modal-overlay" aria-modal="true" tabIndex="-1">
      <div className="settings-modal" role="dialog">
        <h2>Settings</h2>
        <div className="setting-field">
          <label htmlFor="sessionLen">Work Duration (min):</label>
          <input
            id="sessionLen"
            type="number"
            min="1"
            max="60"
            value={sessionLength}
            onChange={handleSessionChange}
          />
        </div>
        <div className="setting-field">
          <label htmlFor="breakLen">Break Duration (min):</label>
          <input
            id="breakLen"
            type="number"
            min="1"
            max="30"
            value={breakLength}
            onChange={handleBreakChange}
          />
        </div>
        <div className="setting-field">
          <label htmlFor="audioSetting">Audio on completion:</label>
          <input
            id="audioSetting"
            type="checkbox"
            checked={audioEnabled}
            onChange={() => setAudioEnabled((a) => !a)}
          />
        </div>
        <button className="close-settings" onClick={onClose} aria-label="Close Settings">
          Close
        </button>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function CircularProgress({ percentage, children, color }) {
  // 120px diameter, 8px stroke
  const size = 140;
  const stroke = 7;
  const center = size / 2;
  const radius = center - stroke;
  const dash = 2 * Math.PI * radius;
  return (
    <svg
      width={size}
      height={size}
      className="circular-progress"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#ececec"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={dash}
        strokeDashoffset={dash - dash * percentage}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.23,1.5,.32,1), stroke 0.2s' }}
      />
      <foreignObject x={stroke} y={stroke} width={size - stroke * 2} height={size - stroke * 2}>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            fontFamily: 'inherit',
          }}
        >
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

// PUBLIC_INTERFACE
function SessionHistory({ history }) {
  if (!history.length) return <div className="history-empty">No sessions completed yet.</div>;
  return (
    <ul className="history-list">
      {history.map((h, i) => (
        <li key={i} className="history-item">
          <span className="history-type">{h.type}</span>
          <span className="history-time">{h.duration} min</span>
          <span className="history-date">{h.date}</span>
        </li>
      ))}
    </ul>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState(() => {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  // Manage theme switching
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 className="main-title" style={{ color: COLORS.primary, marginBottom: '0.4em', fontWeight: 700 }}>
          Propulse Pomodoro
        </h1>
        <PomodoroTimer />
      </header>
      <footer className="footer">
        <span>
          <a href="https://react.dev/" className="App-link" rel="noopener noreferrer" target="_blank">
            Built with React
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
