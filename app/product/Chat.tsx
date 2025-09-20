'use client';

import { optimisticallySendMessage, useUIMessages } from '@convex-dev/agent/react';
import { ArrowUpIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import { Authenticated, AuthLoading, Unauthenticated, useAction, useMutation } from 'convex/react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import { Sidebar } from '@/app/product/Sidebar';
import { Message } from '@/components/Message';
import { Button } from '@/components/ui/button';
import { InputBox } from '@/components/ui/input-box';
import { api } from '@/convex/_generated/api';
import { useThread } from '@/lib/useThread';
import { cn } from '@/lib/utils';

export function Chat() {
  return (
    <div className="flex h-full">
      <Authenticated>
        <AuthenticatedChat />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedChat />
      </Unauthenticated>
      <AuthLoading>
        <UnauthenticatedChat />
      </AuthLoading>
    </div>
  );
}

function AuthenticatedChat() {
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const { threadId, setThreadId } = useThread();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const createThread = useMutation(api.threads.createNewThread);
  const sendMessage = useMutation(api.threads.initiateAsyncStreaming).withOptimisticUpdate(
    optimisticallySendMessage(api.threads.listThreadMessages),
  );
  const generateThreadTitle = useAction(api.threads.generateThreadTitle);

  async function handleSubmit() {
    if (!newMessageText.trim() || isSending) return;

    setIsSending(true);
    let id: string | null = threadId;
    if (!id) {
      id = await createThread();
      setThreadId(id);
    }

    await sendMessage({ threadId: id, prompt: newMessageText });
    setNewMessageText('');
    await generateThreadTitle({ threadId: id, checkTitle: true });
    setIsSending(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} />
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={cn(
          'absolute top-2.5 left-2 z-3 transition-all duration-300 ease-linear',
          isSidebarOpen && 'left-52',
        )}
        size="icon"
        variant="ghost"
      >
        {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </Button>
      <div className="flex flex-col h-full flex-1 pt-16">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto relative">
          {threadId ? <Messages threadId={threadId} /> : <NoMessaages />}
        </div>

        {/* Input Area */}
        <div className="flex gap-3 p-6">
          <InputBox
            value={newMessageText}
            onChange={(event) => setNewMessageText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isSending}
            maxLength={1000}
          />
          <Button onClick={handleSubmit} disabled={!newMessageText.trim() || isSending} size="icon">
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function UnauthenticatedChat() {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-primary flex items-center justify-center">
          <ChatBubbleIcon className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">Welcome to Sprocket!</h2>
        <p className="text-muted-foreground max-w-md">
          Please sign in to get help with your robotics project.
        </p>
      </div>
    </div>
  );
}

function Messages({ threadId }: { threadId: string }) {
  const { results: messages } = useUIMessages(
    api.threads.listThreadMessages,
    { threadId },
    { initialNumItems: 100, stream: true },
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div>
      {messages.length > 0 ? (
        <div className="space-y-6 p-6">
          {messages.map((message) => (
            <div key={message.key} className="message-enter">
              <Message
                author={message.role == 'assistant' ? 'Sprocket' : 'You'}
                isUserMessage={message.role == 'user'}
              >
                {message.text}
              </Message>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <NoMessaages />
      )}
    </div>
  );
}

function NoMessaages() {
  return (
    <div className="flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="h-16 w-16 mx-auto rounded-full bg-primary flex items-center justify-center">
          <ChatBubbleIcon className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Start a conversation</h2>
        <p className="text-muted-foreground">
          Hello! I&apos;m Sprocket, a tool for building robotics projects.
        </p>
      </div>
    </div>
  );
}
