'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useThread } from '@/lib/useThread';
import { cn } from '@/lib/utils';

export function Sidebar({ isOpen }: { isOpen: boolean }) {
  const { threadId, setThreadId } = useThread();
  const threads = useQuery(api.threads.listThreads);
  const renameThread = useMutation(api.threads.renameThread);
  const regenerateThreadTitle = useAction(api.threads.generateThreadTitle);
  const deleteThread = useMutation(api.threads.deleteThread);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [threadToActOn, setThreadToActOn] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  async function handleNewThread() {
    setThreadId('');
  }

  function confirmRename(threadId: string) {
    const thread = threads?.page.find((t) => t._id === threadId);
    setThreadToActOn(threadId);
    setNewTitle(thread?.title ?? '');
    setIsRenameDialogOpen(true);
  }

  async function handleRename() {
    if (threadToActOn && newTitle) {
      await renameThread({ threadId: threadToActOn, title: newTitle });
      setIsRenameDialogOpen(false);
      setNewTitle('');
      setThreadToActOn(null);
    }
  }

  async function handleRegenerateTitle(threadId: string) {
    regenerateThreadTitle({ threadId, checkTitle: false });
  }

  function confirmDelete(threadId: string) {
    setThreadToActOn(threadId);
    setIsDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (threadToActOn) {
      setThreadId('');
      await deleteThread({ threadId: threadToActOn });
      setIsDeleteDialogOpen(false);
      setThreadToActOn(null);
    }
  }

  return (
    <>
      <div
        className={cn(
          'w-64 z-2 dark:border-slate-700 border-slate-200 border-r bg-background p-4 flex flex-col h-full transition-all duration-500 ease-in-out',
          { 'ml-[-256px]': !isOpen },
        )}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Sprocket</h2>
        </div>
        <Button onClick={handleNewThread} className="mb-4">
          <PlusIcon aria-hidden="true" />
          New Project
        </Button>
        <div className="space-y-2">
          {threads?.page.map((thread) => (
            <ContextMenu key={thread._id}>
              <ContextMenuTrigger asChild>
                <Button
                  variant={threadId === thread._id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setThreadId(thread._id)}
                  title={thread.title ?? '...'}
                >
                  <span className="truncate">{thread.title ?? '...'}</span>
                </Button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => confirmRename(thread._id)}>Rename</ContextMenuItem>
                <ContextMenuItem onClick={() => handleRegenerateTitle(thread._id)}>
                  Regenerate Title
                </ContextMenuItem>
                <ContextMenuItem onClick={() => confirmDelete(thread._id)}>Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;
              {threads?.page.find((t) => t._id === threadToActOn)?.title ?? 'this thread'}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Thread</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title"
            />
            <Button onClick={handleRename}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
