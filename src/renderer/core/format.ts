// Dialogue / greeting formatting: convert between common SillyTavern styles.
// Styles:
//   standard : {{char}}: *action* "speech"
//   quoted   : *action* "speech"            (no name prefix)
//   prefixed : {{char}}: *action* speech    (no quotes)
//   plain    : *action* speech              (no prefix, no quotes)

export type FormatStyle = 'standard' | 'quoted' | 'prefixed' | 'plain';

interface Segment {
  type: 'narration' | 'speech';
  text: string;
}

// Split a line's content into narration (*...*) and speech ("..." or plain).
function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let plain = '';
  const flush = () => {
    const t = plain.replace(/\s+/g, ' ').trim();
    if (t) segments.push({ type: 'speech', text: t });
    plain = '';
  };
  while (i < content.length) {
    const ch = content[i];
    if (ch === '*') {
      const end = content.indexOf('*', i + 1);
      if (end >= 0) {
        flush();
        const t = content.slice(i + 1, end).replace(/\s+/g, ' ').trim();
        if (t) segments.push({ type: 'narration', text: t });
        i = end + 1;
        continue;
      }
    } else if (ch === '"') {
      const end = content.indexOf('"', i + 1);
      if (end >= 0) {
        flush();
        const t = content.slice(i + 1, end).replace(/\s+/g, ' ').trim();
        if (t) segments.push({ type: 'speech', text: t });
        i = end + 1;
        continue;
      }
    }
    plain += ch;
    i++;
  }
  flush();
  return segments;
}

function render(segments: Segment[], quote: boolean, prefix: 'char' | 'user' | null): string {
  const body = segments
    .map((s) => (s.type === 'narration' ? '*' + s.text + '*' : quote ? '"' + s.text + '"' : s.text))
    .join(' ');
  if (prefix) return (prefix === 'user' ? '{{user}}: ' : '{{char}}: ') + body;
  return body;
}

const PREFIX_RE = /^(\{\{(char|user)\}\}|[A-Za-z][A-Za-z0-9 _'-]*):\s*(.*)$/;

export function formatDialogue(text: string, style: FormatStyle): string {
  const needsPrefix = style === 'standard' || style === 'prefixed';
  const needsQuote = style === 'standard' || style === 'quoted';
  let lastTurn: 'char' | 'user' = 'user';

  return text
    .split('\n')
    .map((raw) => {
      const line = raw.trim();
      if (!line) return '';
      const m = PREFIX_RE.exec(line);
      let turn: 'char' | 'user' | null = null;
      let content = line;
      if (m) {
        turn = m[2] === 'user' ? 'user' : 'char';
        content = m[3] ?? '';
      }
      let prefix: 'char' | 'user' | null = null;
      if (needsPrefix) {
        if (turn) prefix = turn;
        else {
          lastTurn = lastTurn === 'user' ? 'char' : 'user';
          prefix = lastTurn;
        }
      }
      if (turn) lastTurn = turn;
      return render(parseContent(content), needsQuote, prefix);
    })
    .join('\n');
}
