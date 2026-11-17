import React, { useState, useEffect } from 'react';
import './PhoneSimulator.css';

const DEVICE_PRESETS = [
  { id: 'iphone', name: 'iPhone 16 Pro', width: 393, height: 830 },
  { id: 'pixel', name: 'Pixel 9 Pro', width: 412, height: 830 },
  { id: 'compact', name: 'Compact Phone', width: 375, height: 740 }
];

export default function PhoneSimulator({ children }) {
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_PRESETS[0]);
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
      {/* Device Toolbar */}
      <div className="simulator-toolbar" role="toolbar" aria-label="Phone Simulator Controls">
        <div className="simulator-toolbar-left">
          <span className="simulator-badge">📱 Interactive Mobile Simulator</span>
          <span className="simulator-hint">Scroll &amp; tap to test the mobile customer flow</span>
        </div>

        <div className="simulator-device-selector">
          <label htmlFor="device-preset-select">Model:</label>
          <select
            id="device-preset-select"
            value={selectedDevice.id}
            onChange={(e) => {
              const found = DEVICE_PRESETS.find((d) => d.id === e.target.value);
              if (found) setSelectedDevice(found);
            }}
          >
            {DEVICE_PRESETS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.width}×{d.height})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div
        className="phone-chassis"
        style={{
          width: `${selectedDevice.width}px`,
          height: `${selectedDevice.height}px`
        }}
      >
        {/* Physical Button Accents */}
        <div className="phone-button phone-button--volume-up" />
        <div className="phone-button phone-button--volume-down" />
        <div className="phone-button phone-button--power" />

        {/* Screen Bezel & Container */}
        <div className="phone-screen">
          {/* iOS / Mobile Status Bar */}
          <div className="phone-status-bar" aria-hidden="true">
            <span className="phone-status-time">{currentTime || '9:41'}</span>

            {/* Dynamic Island / Camera Notch */}
            <div className="phone-dynamic-island">
              <span className="dynamic-island-sensor" />
              <span className="dynamic-island-lens" />
            </div>

            <div className="phone-status-icons">
              {/* Cellular signal */}
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
