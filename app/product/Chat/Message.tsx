'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MessageProps = {
  author: string;
  isUserMessage: boolean;
  children: React.ReactNode;
};

export function Message({ author, isUserMessage, children }: MessageProps) {
  return (
    <div className={cn('flex items-start gap-3', isUserMessage ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%]', isUserMessage ? 'order-1' : '')}>
        <p className={cn('text-sm font-semibold mb-1', isUserMessage ? 'text-right' : 'text-left')}>
          {author}
        </p>
        <Card className={cn(isUserMessage ? 'bg-primary text-primary-foreground' : '')}>
          <CardContent className="p-3">
            <div className="prose prose-sm max-w-none text-inherit">{children}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
