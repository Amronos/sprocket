import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ChatBubbleIcon, PersonIcon } from "@radix-ui/react-icons";

export function Message({
  author,
  isUserMessage,
  children,
}: {
  author: string;
  isUserMessage: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        isUserMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
        isUserMessage 
          ? "bg-cyan-600" 
          : "bg-gray-600"
      )}>
        {isUserMessage ? (
          <PersonIcon className="h-4 w-4" />
        ) : (
          <ChatBubbleIcon className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isUserMessage ? "items-end" : "items-start"
      )}>
        {/* Author Name */}
        <div className="text-xs font-medium text-muted-foreground">
          {author}
        </div>
        
        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUserMessage 
              ? "bg-cyan-600 text-white" 
              : "bg-muted text-foreground"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
