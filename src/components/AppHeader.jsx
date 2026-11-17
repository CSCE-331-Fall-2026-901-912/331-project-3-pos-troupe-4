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

  useEffect(() => {
    const main = document.getElementById('main');
    if (main){
      main.setAttribute('tabindex', '-1');
      main.focus();
    }
  }, [location.pathname]);

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
    '/order': { name: 'Customer Ordering', icon: '🛍️' },
    '/customer': { name: 'Customer Ordering', icon: '🛍️' },
    '/kiosk': { name: 'Kiosk Ordering', icon: '🍵' },
    '/cashier': { name: 'Cashier POS', icon: '💳' },
    '/cashier/customize': { name: 'Cashier Customization', icon: '🎨' },
    '/cashier/cart': { name: 'Cashier Checkout', icon: '🛒' },
    '/cart': { name: 'Cashier Checkout', icon: '🛒' },
    '/kitchen': { name: 'Kitchen Display', icon: '🍳' },
    '/manager': { name: 'Manager Portal', icon: '📊' },
  };

  const currentMode = modeTitles[pathname] || { name: 'POS System', icon: '🍵' };
  const isCustomerOrderPage = pathname === '/order' || pathname === '/customer';
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') === 'mobile' ? 'mobile' : 'desktop';

  function handleViewChange(view) {
    navigate(`${pathname}?view=${view}`);
  }

  return (
    <header className="app-header" role="banner">
      <a href="#main" className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main');
          if(main){
            main.setAttribute('tableindex', '-1');
            main.focus();
            main.scrollIntoView();
          }
        }}
        >Skip to main Content</a>
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

        {isCustomerOrderPage && (
          <div className="app-header__view-toggle" role="group" aria-label="Customer View Mode">
            <button
              type="button"
              className={`app-header__view-btn ${currentView === 'desktop' ? 'active' : ''}`}
              onClick={() => handleViewChange('desktop')}
              title="View full desktop website"
            >
              <span>🖥️</span>
              <span>Desktop</span>
            </button>
            <button
              type="button"
              className={`app-header__view-btn ${currentView === 'mobile' ? 'active' : ''}`}
              onClick={() => handleViewChange('mobile')}
              title="View simulated mobile phone"
            >
              <span>📱</span>
              <span>Mobile Sim</span>
            </button>
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
