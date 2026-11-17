import React, { useState, useEffect } from 'react';
import './PhoneSimulator.css';

export default function PhoneSimulator({ children }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="phone-simulator-stage">
      {/* Simplified Mobile Device Chassis with plain black outline */}
      <div className="phone-chassis">
        {/* Screen Shell */}
        <div className="phone-screen">
          {/* Status Bar */}
          <div className="phone-status-bar" aria-hidden="true">
            <span className="phone-status-time">{currentTime || '9:41'}</span>

            {/* Dynamic Island Pill */}
            <div className="phone-dynamic-island">
              <span className="dynamic-island-sensor" />
              <span className="dynamic-island-lens" />
            </div>

            <div className="phone-status-icons">
              {/* Cellular Signal */}
              <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                <rect x="0" y="8" width="2.5" height="3" rx="0.5" />
                <rect x="4" y="6" width="2.5" height="5" rx="0.5" />
                <rect x="8" y="3" width="2.5" height="8" rx="0.5" />
                <rect x="12" y="0" width="2.5" height="11" rx="0.5" />
              </svg>
              {/* WiFi */}
              <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
                <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4.2-2.3a6 6 0 018.4 0 .8.8 0 001.1-1.1 7.6 7.6 0 00-10.6 0 .8.8 0 101.1 1.1zm-3-2.9a10.2 10.2 0 0114.4 0 .8.8 0 001.1-1.1 11.8 11.8 0 00-16.6 0 .8.8 0 101.1 1.1z" />
              </svg>
              {/* Battery */}
              <div className="phone-battery-icon">
                <div className="phone-battery-level" />
              </div>
            </div>
          </div>

          {/* Interactive Screen Scroll Area */}
          <div className="phone-content-area">
            {children}
          </div>

          {/* Home Bar Indicator */}
          <div className="phone-home-indicator" aria-hidden="true">
            <span className="phone-home-pill" />
          </div>
        </div>
      </div>
    </div>
  );
}
