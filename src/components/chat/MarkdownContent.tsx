import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent = ({ content, className }: MarkdownContentProps) => {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                className="rounded-md my-2 text-sm"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="text-foreground leading-relaxed" {...props}>
                {children}
              </li>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-border rounded-md border" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children, ...props }) {
            return (
              <thead className="bg-muted" {...props}>
                {children}
              </thead>
            );
          },
          th({ children, ...props }) {
            return (
              <th className="px-4 py-2 text-right text-sm font-semibold text-foreground" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="px-4 py-2 text-sm text-foreground border-t border-border" {...props}>
                {children}
              </td>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-r-4 border-primary bg-muted/50 pr-4 py-2 my-2 italic" {...props}>
                {children}
              </blockquote>
            );
          },
          h1({ children, ...props }) {
            return (
              <h1 className="text-2xl font-bold text-foreground mt-4 mb-2" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="text-xl font-bold text-foreground mt-3 mb-2" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3 className="text-lg font-semibold text-foreground mt-2 mb-1" {...props}>
                {children}
              </h3>
            );
          },
          p({ children, ...props }) {
            return (
              <p className="text-foreground leading-relaxed my-2" {...props}>
                {children}
              </p>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                className="text-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          hr({ ...props }) {
            return <hr className="my-4 border-border" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
