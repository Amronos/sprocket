"use client";

import { useConvexAuth } from "convex/react";
import { Message } from "@/app/product/Chat/Message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState, useRef, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { ArrowRightIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { ListMessagesReturn } from "@/convex/messages";
import { GetUserReturn } from "@/convex/users";

export function notAuthenticated() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-cyan-600 flex items-center justify-center">
          <ChatBubbleIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold">Welcome to AI Chat</h2>
        <p className="text-muted-foreground max-w-md">
          Please sign in to start chatting with your AI assistant. Your conversations are private and secure.
        </p>
      </div>
    </div>
  );
}

export function Chat() {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    return notAuthenticated();
  }
  return <AuthenticatedChat />;
}

function AuthenticatedChat() {
  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user: GetUserReturn | undefined = useQuery(api.users.get);
  const messages: ListMessagesReturn | undefined = useQuery(
    api.messages.list, 
    user ? { user } : "skip"
  );
  const sendMessage = useMutation(api.messages.send);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMessageText.trim() || isSending || !user) return;

    setError(null);
    setIsSending(true);

    try {
      await sendMessage({ body: newMessageText, user });
      setNewMessageText("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      setError(errorMessage);
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages && messages.length > 0 ? (
          <div className="space-y-6 p-6">
            {messages.map((message) => (
              <div key={message._id} className="message-enter">
                <Message
                  author={message.author}
                  isUserMessage={message.isUserMessage}
                >
                  {message.body}
                </Message>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="h-16 w-16 mx-auto rounded-full bg-cyan-600 flex items-center justify-center">
                <ChatBubbleIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Start a conversation</h2>
              <p className="text-muted-foreground">
                Hi {user?.name || 'there'}! I'm your AI assistant. Ask me anything and I'll help you out.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

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
