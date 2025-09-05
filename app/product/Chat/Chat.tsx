'use client';

import { optimisticallySendMessage, useUIMessages } from '@convex-dev/agent/react';
import { ArrowRightIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import { Authenticated, Unauthenticated, useMutation, useQuery } from 'convex/react';
import { FormEvent, useEffect, useRef, useState } from 'react';

import { Message } from '@/app/product/Chat/Message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { GetUserReturn } from '@/convex/users';

export function Chat() {
  return (
    <div>
      <Authenticated>
        <AuthenticatedChat />
      </Authenticated>
      <Unauthenticated>
        <UnauthenticatedChat />
      </Unauthenticated>
    </div>
  );
}

function AuthenticatedChat() {
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [threadId, setThreadId] = useState<string>('');

  const user: GetUserReturn | undefined = useQuery(api.users.get);
  const createThread = useMutation(api.threads.createNewThread);
  const sendMessage = useMutation(api.threads.initiateAsyncStreaming).withOptimisticUpdate(
    optimisticallySendMessage(api.threads.listThreadMessages),
  );
  const threads = useQuery(api.threads.listThreads, user ? { userId: user._id } : 'skip');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessageText.trim() || isSending || !user) return;

    setIsSending(true);
    try {
      // Get all threads of the user, if there are none, create one
      let id = threadId;
      if (!threads || threads.page.length === 0) {
        id = await createThread({ userId: user._id });
      } else {
        id = threads.page[0]._id;
      }
      setThreadId(id);

      await sendMessage({ threadId: id, prompt: newMessageText });
      setNewMessageText('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {threadId && threadId !== '' ? (
          <Messages threadId={threadId} user={user} />
        ) : (
          <NoMessaages user={user} />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={newMessageText}
            onChange={(event) => setNewMessageText(event.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isSending}
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={!newMessageText.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </form>
        {newMessageText.length > 800 && (
          <div className="mt-2 text-xs text-muted-foreground text-right">
            {newMessageText.length}/1000 characters
          </div>
        )}
      </div>
    </div>
  );
}

function UnauthenticatedChat() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-cyan-600 flex items-center justify-center">
          <ChatBubbleIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold">Welcome to AI Sprocket</h2>
        <p className="text-muted-foreground max-w-md">
          Please sign in to get help with your robotics project.
        </p>
      </div>
    </div>
  );
}

function Messages({ threadId, user }: { threadId: string; user: GetUserReturn | undefined }) {
  console.log('Called messages with threadId: ' + threadId);
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
        <NoMessaages user={user} />
      )}
    </div>
  );
}

function NoMessaages({ user }: { user: GetUserReturn | undefined }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4 max-w-md">
        <div className="h-16 w-16 mx-auto rounded-full bg-cyan-600 flex items-center justify-center">
          <ChatBubbleIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold">Start a conversation</h2>
        <p className="text-muted-foreground">
          {'Hi '}
          {user?.name || 'there'}
          {"! I'm Sprocket, a tool for building robotics projects."}
        </p>
      </div>
    </div>
  );
}
