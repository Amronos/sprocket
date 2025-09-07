'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useMutation, useQuery } from 'convex/react';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { GetUserReturn } from '@/convex/users';
import { useThread } from '@/lib/useThread';

export function Sidebar() {
  const { threadId, setThreadId } = useThread();
  const user: GetUserReturn | undefined = useQuery(api.users.get);
  const threads = useQuery(api.threads.listThreads, user ? { userId: user._id } : 'skip');
  const createThread = useMutation(api.threads.createNewThread);

  const handleCreateThread = async () => {
    console.log('Creating New User Thread');
    if (user) {
      const newThreadId = await createThread({ userId: user._id });
      setThreadId(newThreadId);
    }
  };

  return (
    <div className="w-64 border-r bg-background p-4 flex flex-col">
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-4">Projects</h2>
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
      <Button onClick={handleCreateThread} className="w-full">
        <PlusIcon className="mr-2 h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}
