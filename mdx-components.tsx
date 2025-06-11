import type { MDXComponents } from "mdx/types";
import React, { ReactNode } from "react";
import CodeBlock from "./src/app/components/CodeBlock";

interface ParagraphProps {
  children: ReactNode;
}

const Paragraph: React.FC<ParagraphProps> = ({ children }) => (
  <p className="leading-7 py-2 text-zinc-600">{children}</p>
);

const H1: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h1 className="text-4xl font-serif py-4 text-zinc-900">{children}</h1>
);

const H2: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h2 className="text-3xl font-serif py-3 text-zinc-800">{children}</h2>
);

const H3: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h3 className="text-2xl font-serif py-2 text-zinc-800">{children}</h3>
);

const H4: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h4 className="text-xl font-serif py-2 text-zinc-800">{children}</h4>
);

const H5: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h5 className="text-lg font-serif py-1 text-zinc-800">{children}</h5>
);

const H6: React.FC<{ children: ReactNode }> = ({ children }) => (
  <h6 className="text-base font-serif py-1 text-zinc-800">{children}</h6>
);

const Code: React.FC<{ children: ReactNode }> = ({ children }) => (
  <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">
    {children}
  </code>
);

const Pre: React.FC<{ children: ReactNode }> = ({ children }) => (
  <CodeBlock>{children}</CodeBlock>
);

const Blockquote: React.FC<{ children: ReactNode }> = ({ children }) => (
  <blockquote className="border-l-4 border-zinc-300 pl-4 my-4 italic text-zinc-600">
    {children}
  </blockquote>
);

const UnorderedList: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ul className="list-disc list-inside space-y-2 my-4 text-zinc-600">
    {children}
  </ul>
);

const OrderedList: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ol className="list-decimal list-inside space-y-2 my-4 text-zinc-600">
    {children}
  </ol>
);

const ListItem: React.FC<{ children: ReactNode }> = ({ children }) => (
  <li className="ml-4">{children}</li>
);

const Link: React.FC<{ children: ReactNode; href?: string }> = ({ children, href }) => (
  <a 
    href={href} 
    className="text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2"
    target={href?.startsWith('http') ? '_blank' : undefined}
    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
  >
    {children}
  </a>
);

const Table: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto my-6">
    <table className="min-w-full divide-y divide-zinc-200">
      {children}
    </table>
  </div>
);

const TableHead: React.FC<{ children: ReactNode }> = ({ children }) => (
  <thead className="bg-zinc-50">
    {children}
  </thead>
);

const TableRow: React.FC<{ children: ReactNode }> = ({ children }) => (
  <tr className="divide-x divide-zinc-200">
    {children}
  </tr>
);

const TableHeader: React.FC<{ children: ReactNode }> = ({ children }) => (
  <th className="px-4 py-2 text-left text-sm font-semibold text-zinc-900">
    {children}
  </th>
);

const TableData: React.FC<{ children: ReactNode }> = ({ children }) => (
  <td className="px-4 py-2 text-sm text-zinc-600">
    {children}
  </td>
);

const HorizontalRule: React.FC = () => (
  <hr className="my-8 border-zinc-200" />
);

const Strong: React.FC<{ children: ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-zinc-900">{children}</strong>
);

const Emphasis: React.FC<{ children: ReactNode }> = ({ children }) => (
  <em className="italic">{children}</em>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    p: Paragraph,
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    code: Code,
    pre: Pre,
    blockquote: Blockquote,
    ul: UnorderedList,
    ol: OrderedList,
    li: ListItem,
    a: Link,
    table: Table,
    thead: TableHead,
    tr: TableRow,
    th: TableHeader,
    td: TableData,
    hr: HorizontalRule,
    strong: Strong,
    em: Emphasis,
  };
}
