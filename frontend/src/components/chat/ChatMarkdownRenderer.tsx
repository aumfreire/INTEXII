import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import ChatCodeBlock from './ChatCodeBlock';
import 'highlight.js/styles/github-dark.css';

interface ChatMarkdownRendererProps {
  content: string;
}

export default function ChatMarkdownRenderer({ content }: ChatMarkdownRendererProps) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          a({ href, children, className, ...rest }) {
            if (href?.startsWith('/')) {
              return (
                <Link to={href} className={className}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} className={className} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
              </a>
            );
          },
          code(props) {
            const { className, children, ...rest } = props;
            const inline = !className;
            if (inline) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            }
            const text = String(children).replace(/\n$/, '');
            return <ChatCodeBlock className={className}>{text}</ChatCodeBlock>;
          },
          table(props) {
            return <table className="chat-table" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
