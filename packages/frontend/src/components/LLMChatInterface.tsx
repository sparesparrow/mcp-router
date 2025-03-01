import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Card } from './ui/Card';

// Define message type
interface Message {
  type: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
`;

const ChatHeader = styled.div`
  background: var(--color-background-secondary);
  padding: 1rem;
  border-radius: 8px 8px 0 0;
`;

const ChatTitle = styled.h2`
  margin: 0;
  color: var(--color-text-primary);
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--color-background-tertiary);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 300px;
  max-height: 500px;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background: ${props => 
    props.isUser ? 'var(--color-primary)' : 'var(--color-background-secondary)'};
  color: ${props => 
    props.isUser ? 'white' : 'var(--color-text-primary)'};
`;

const ProcessingIndicator = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  align-self: flex-start;
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--color-background-secondary);
  border-radius: 0 0 8px 8px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const ActionButton = styled.button<{ isListening?: boolean }>`
  padding: 0.75rem;
  border-radius: 4px;
  border: none;
  background: ${props => 
    props.isListening ? 'var(--color-error)' : 'var(--color-primary)'};
  color: white;
  cursor: pointer;
  
  &:hover {
    background: ${props => 
      props.isListening ? 'var(--color-error-dark)' : 'var(--color-primary-dark)'};
  }
  
  &:disabled {
    background: var(--color-disabled);
    cursor: not-allowed;
  }
`;

const LLMChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (inputText.trim()) {
      // Add user message
      setMessages(prev => [...prev, { 
        type: 'user',
        content: inputText,
        timestamp: new Date()
      }]);
      
      setIsProcessing(true);
      
      // Simulate LLM response (replace with actual API call)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: `This is a simulated response to: "${inputText}"`,
          timestamp: new Date()
        }]);
        setIsProcessing(false);
      }, 1500);
      
      setInputText('');
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!isListening) {
      try {
        // Check if SpeechRecognition is available
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputText(transcript);
          };
          recognition.onend = () => setIsListening(false);
          recognition.start();
          setIsListening(true);
        }
      } catch (err) {
        console.error('Speech recognition not supported', err);
      }
    } else {
      setIsListening(false);
    }
  };

  return (
    <Card>
      <ChatContainer>
        <ChatHeader>
          <ChatTitle>AI Assistant</ChatTitle>
        </ChatHeader>
        
        <MessagesArea>
          {messages.map((message, index) => (
            <MessageBubble 
              key={index} 
              isUser={message.type === 'user'}
            >
              {message.content}
            </MessageBubble>
          ))}
          
          {isProcessing && (
            <ProcessingIndicator>
              AI is thinking...
            </ProcessingIndicator>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesArea>
        
        <InputArea>
          <ChatInput
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          
          <ActionButton
            isListening={isListening}
            onClick={toggleVoiceInput}
            disabled={isProcessing}
          >
            {isListening ? '◼' : '🎤'}
          </ActionButton>
          
          <ActionButton
            onClick={handleSendMessage}
            disabled={isProcessing || !inputText.trim()}
          >
            📤
          </ActionButton>
        </InputArea>
      </ChatContainer>
    </Card>
  );
};

export default LLMChatInterface; 