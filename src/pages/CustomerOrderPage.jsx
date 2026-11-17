import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomerCartProvider } from '../components/CustomerOrder/CustomerCartContext';
import CustomerOrderView from '../components/CustomerOrder/CustomerOrderView';
import PhoneSimulator from '../components/CustomerOrder/PhoneSimulator';
import './CustomerOrderPage.css';

export default function CustomerOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Screen width detection
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  // Desktop view mode selection: 'desktop' or 'mobile-simulated'
  const initialMode = searchParams.get('view') === 'mobile' ? 'mobile-simulated' : 'desktop';
  const [desktopViewMode, setDesktopViewMode] = useState(initialMode);

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth <= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleSwitchMode(mode) {
    setDesktopViewMode(mode);
    setSearchParams(mode === 'mobile-simulated' ? { view: 'mobile' } : { view: 'desktop' });
  }

  // If on actual mobile screen, render native mobile view directly
  if (isSmallScreen) {
    return (
      <CustomerCartProvider>
        <div className="customer-page-native-mobile">
          <CustomerOrderView isMobile={true} />
        </div>
      </CustomerCartProvider>
    );
  }

  // On Desktop screen: show the Desktop View Switcher Toolbar & selected mode
  return (
    <CustomerCartProvider>
      <div className="customer-order-page-desktop">
        {/* Top View Mode Switcher Toolbar */}
        <header className="customer-desktop-mode-bar" role="toolbar" aria-label="Customer View Mode Switcher">
          <div className="mode-bar-left">
            <span className="mode-bar-brand-tag">PB-15 Beyond Feature</span>
            <span className="mode-bar-title">Customer Online Ordering Experience</span>
          </div>

          <div className="mode-bar-controls">
            <span className="mode-bar-label">Preview Mode:</span>
            <div className="mode-bar-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${desktopViewMode === 'desktop' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('desktop')}
                title="View full desktop website as seen on a customer computer"
              >
                <span className="btn-icon">🖥️</span>
                <span>Desktop Site</span>
              </button>

              <button
                type="button"
                className={`mode-toggle-btn ${desktopViewMode === 'mobile-simulated' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('mobile-simulated')}
                title="Test mobile smartphone view inside interactive phone frame without opening inspect element"
              >
                <span className="btn-icon">📱</span>
                <span>Simulated Mobile View</span>
              </button>
            </div>
          </div>
        </header>

        {/* View Mode Canvas */}
        <div className="customer-view-canvas">
          {desktopViewMode === 'desktop' ? (
            <div className="desktop-view-wrapper">
              <CustomerOrderView isMobile={false} />
            </div>
          ) : (
            <PhoneSimulator>
              <CustomerOrderView isMobile={true} />
            </PhoneSimulator>
          )}
        </div>
      </div>
    </CustomerCartProvider>
  );
}
