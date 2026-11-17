import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CustomerCartProvider } from '../components/CustomerOrder/CustomerCartContext';
import CustomerOrderView from '../components/CustomerOrder/CustomerOrderView';
import PhoneSimulator from '../components/CustomerOrder/PhoneSimulator';
import './CustomerOrderPage.css';

export default function CustomerOrderPage() {
  const [searchParams] = useSearchParams();

  // Screen width detection
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth <= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mode derived from URL search params: 'mobile' vs 'desktop'
  const isSimulatedMobile = searchParams.get('view') === 'mobile';

  // If on actual mobile device or narrow window, render mobile view directly
  if (isSmallScreen) {
    return (
      <CustomerCartProvider>
        <div className="customer-page-native-mobile">
          <CustomerOrderView isMobile={true} isSimulated={false} />
        </div>
      </CustomerCartProvider>
    );
  }

  // On Desktop screen: toggle between Desktop site view and Phone Simulator based on header toggle
  return (
    <CustomerCartProvider>
      <div className="customer-order-page-desktop">
        <div className="customer-view-canvas">
          {isSimulatedMobile ? (
            <PhoneSimulator>
              <CustomerOrderView isMobile={true} isSimulated={true} />
            </PhoneSimulator>
          ) : (
            <div className="desktop-view-wrapper">
              <CustomerOrderView isMobile={false} isSimulated={false} />
            </div>
          )}
        </div>
      </div>
    </CustomerCartProvider>
  );
}
