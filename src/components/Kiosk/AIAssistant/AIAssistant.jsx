
import React, { useState, useRef, useEffect } from 'react';
import { sendAIMessage } from '../../../api';
import './AIAssistant.css';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi there! I'm your Bubble Tea Assistant. I can help you explore our menu, find your next favorite drink, or answer questions. What can I help you with?"
        }
    ]);
    const [input, setInput] = useState('');

    const messagesEndRef = useRef(null);

    // Automatically scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [messages, isLoading, isOpen]);

    // Send customer message to the backend
    const handleSend = async (e) => {
        e.preventDefault();

        const trimmedInput = input.trim();

        if (!trimmedInput || isLoading) return;

        if (trimmedInput.length > 1000) return;

        // Display customer's message immediately
        setMessages(prev => [
            ...prev,
            {
                role: 'user',
                content: trimmedInput
            }
        ]);

        setInput('');
        setIsLoading(true);

        try {
            // Call existing API helper
            const data = await sendAIMessage(trimmedInput);

            if (!data?.reply) {
                throw new Error('No response received from assistant.');
            }

            // Display AI response
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply
                }
            ]);

        } catch (error) {
            console.error('AI Assistant Frontend Error:', error);

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: "I'm sorry, but I'm having trouble responding right now. Please try again in a moment!"
                }
            ]);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-assistant-container">

            {/* Expanded chat window */}
            {isOpen && (
                <div className="ai-assistant-window">

                    {/* Header */}
                    <div className="ai-assistant-header">
                        <div className="ai-assistant-header-info">
                            <div className="ai-assistant-avatar">
                                ✦
                            </div>

                            <div>
                                <h3>Bubble Tea Assistant</h3>
                                <span>Here to help you order!</span>
                            </div>
                        </div>

                        <button
                            className="ai-assistant-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Minimize assistant"
                        >
                            −
                        </button>
                    </div>

                    {/* Conversation */}
                    <div className="ai-assistant-messages">

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`ai-message-row ${message.role}`}
                            >
                                <div className={`ai-message ${message.role}`}>
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="ai-message-row assistant">
                                <div className="ai-message assistant ai-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />

                    </div>

                    {/* Message input */}
                    <form
                        className="ai-assistant-input-area"
                        onSubmit={handleSend}
                    >
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            maxLength={1000}
                            disabled={isLoading}
                            aria-label="Message the assistant"
                        />

                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            aria-label="Send message"
                        >
                            ↑
                        </button>
                    </form>

                </div>
            )}

            {/* Floating assistant button */}
            <button
                className="ai-assistant-toggle"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label={isOpen ? "Close assistant" : "Open assistant"}
                title="Chat with our AI assistant"
            >
                {isOpen ? 'x' : '✦'}
            </button>

        </div>
    );
}