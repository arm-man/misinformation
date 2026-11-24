import type { ReactNode } from "react";

export default function MarkdownLinks({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    const position = match.index;
    if (position > start) parts.push(text.slice(start, position));
    // Only explicit HTTP(S) links become clickable; the rest stays ordinary text.
    parts.push(<a key={position} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a>);
    start = position + match[0].length;
  }
  if (start < text.length) parts.push(text.slice(start));
  return <>{parts}</>;
}
