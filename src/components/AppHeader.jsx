import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AppHeader.css';

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [textSizePercent, setTextSizePercent] = useState(100);
  const [isHighContrastOn, setIsHighContrastOn] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = textSizePercent + '%';
  }, [textSizePercent]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', isHighContrastOn);
  }, [isHighContrastOn]);

  function makeTextBigger() {
    if (textSizePercent < 175) {
      setTextSizePercent((prev) => prev + 15);
    }
  }

  function makeTextSmaller() {
    if (textSizePercent > 70) {
      setTextSizePercent((prev) => prev - 15);
    }
  }

  function resetTextSize() {
    setTextSizePercent(100);
  }

  function toggleHighContrast() {
    setIsHighContrastOn((prev) => !prev);
  }

  const pathname = location.pathname;
  const isPortal = pathname === '/';

  const modeTitles = {
    '/kiosk': { name: 'Kiosk Ordering', icon: '🍵' },
    '/cashier': { name: 'Cashier POS', icon: '💳' },
    '/cashier/customize': { name: 'Cashier Customization', icon: '🎨' },
    '/cashier/cart': { name: 'Cashier Checkout', icon: '🛒' },
    '/cart': { name: 'Cashier Checkout', icon: '🛒' },
    '/kitchen': { name: 'Kitchen Display', icon: '🍳' },
    '/manager': { name: 'Manager Portal', icon: '📊' },
  };

  const currentMode = modeTitles[pathname] || { name: 'POS System', icon: '🍵' };

  return (
    <header className="app-header" role="banner">
      <div className="app-header__left">
        {!isPortal ? (
          <button
            type="button"
            className="app-header__portal-btn"
            onClick={() => navigate('/')}
            title="Return to Portal Home"
            aria-label="Return to Portal Home"
          >
            <span className="app-header__portal-arrow">←</span>
            <span>Return to Portal</span>
          </button>
        ) : (
          <div className="app-header__brand">
            <span className="app-header__brand-icon">🍵</span>
            <span className="app-header__brand-name">Troupe 04 POS</span>
          </div>
        )}

        {!isPortal && (
          <div className="app-header__mode-label">
            <span className="app-header__mode-icon">{currentMode.icon}</span>
            <span className="app-header__mode-name">{currentMode.name}</span>
          </div>
        )}
      </div>

      <div className="app-header__right">
        <div className="app-header__a11y" role="toolbar" aria-label="Accessibility options">
          <span className="app-header__a11y-label">Text Size:</span>
          <div className="app-header__a11y-group">
            <button
              type="button"
              className="app-header__btn"
              onClick={makeTextSmaller}
              title="Decrease text size"
              aria-label="Decrease text size"
            >
              A-
            </button>
            <button
              type="button"
              className="app-header__btn app-header__btn--reset"
              onClick={resetTextSize}
              title="Reset text size to 100%"
              aria-label={`Reset text size (currently ${textSizePercent}%)`}
            >
              {textSizePercent}%
            </button>
            <button
              type="button"
              className="app-header__btn"
              onClick={makeTextBigger}
              title="Increase text size"
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>

          <div className="app-header__divider" aria-hidden="true" />

          <button
            type="button"
            className={`app-header__btn app-header__btn--contrast ${
              isHighContrastOn ? 'app-header__btn--active' : ''
            }`}
            onClick={toggleHighContrast}
            aria-pressed={isHighContrastOn}
            title="Toggle high contrast mode"
          >
            <span aria-hidden="true">🌓</span>
            <span>High Contrast</span>
          </button>
        </div>
      </div>
    </header>
  );
}
