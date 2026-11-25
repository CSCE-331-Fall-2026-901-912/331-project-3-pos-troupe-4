import React from 'react';
import AIAssistant from './AIAssistant/AIAssistant';

export default function KioskWithAssistant({ children }) {
    return (
        <>
            {children}
            <AIAssistant />
        </>
    );
}
