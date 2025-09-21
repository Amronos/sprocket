'use client';

import 'katex/dist/katex.min.css';

import { Check, Copy } from 'lucide-react';
import type { Root } from 'mdast';
import { type ComponentProps, useState } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { Button } from './ui/button';

type MessageProps = {
  author: string;
  isUserMessage: boolean;
  message: string;
};

export function Message({ author, isUserMessage, message }: MessageProps) {
  const CodeBlock = ({ className, children, ...props }: ComponentProps<'code'>) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');

    if (match) {
      const handleCopy = () => {
        const codeToCopy = String(children).replace(/\n$/, '');
        navigator.clipboard.writeText(codeToCopy).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        });
      };

      return (
        <div className="my-4 rounded-md bg-slate-900">
          <div className="flex items-center px-4 py-2 text-slate-100">
            <span className="pr-4">{match[1]}</span>
            <div className="flex-grow" />
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <SyntaxHighlighter
            PreTag="div"
            language={match[1]}
            style={coldarkDark}
            customStyle={{
              margin: 0,
              padding: '1rem',
              backgroundColor: 'transparent',
              overflow: 'auto',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code
        className={cn(
          'rounded-sm bg-slate-200 px-1.5 py-0.5 font-mono text-sm dark:bg-slate-700',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  };

  return (
    <div className={cn('flex items-start gap-3', isUserMessage ? 'justify-end' : 'justify-start')}>
      <div>
        <p className={cn('text-sm font-semibold mb-1', isUserMessage ? 'text-right' : 'text-left')}>
          {author}
        </p>
        <Card
          className={cn(
            isUserMessage ? 'bg-primary text-primary-foreground' : 'bg-slate-100 dark:bg-slate-800',
          )}
        >
          <CardContent className="p-3 break-words markdown">
            <Markdown
              remarkPlugins={[
                () => (tree: Root) => {
                  visit(tree, 'code', (node) => {
                    node.lang = node.lang ?? 'plaintext';
                  });
                },
                remarkGfm,
                remarkMath,
              ]}
              rehypePlugins={[rehypeSanitize, rehypeKatex]}
              components={{
                code: CodeBlock,
              }}
            >
              {message}
            </Markdown>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
