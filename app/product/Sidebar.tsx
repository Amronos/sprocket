'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useMutation, useQuery } from 'convex/react';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useThread } from '@/lib/useThread';
import { cn } from '@/lib/utils';

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { threadId, setThreadId } = useThread();
  const threads = useQuery(api.threads.listThreads);
  const createThread = useMutation(api.threads.createNewThread);

  async function handleCreateThread() {
    console.log('Creating New User Thread');
    const newThreadId: string = await createThread();
    setThreadId(newThreadId);
  }

  return (
    <div
      className={cn(
        'w-64 z-2 dark:border-slate-700 border-slate-200 border-r bg-background p-4 flex flex-col h-full transition-all duration-500 ease-in-out',
        { 'ml-[-256px]': !isOpen },
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Sprocket</h2>
      </div>
      <Button onClick={handleCreateThread} className="mb-4">
        <PlusIcon aria-hidden="true" />
        New Project
      </Button>
      <div className="space-y-2">
        {threads?.page.map((thread) => (
          <Button
            key={thread._id}
            variant={threadId === thread._id ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setThreadId(thread._id)}
          >
            <span className="truncate">{thread.title ?? '...'}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
