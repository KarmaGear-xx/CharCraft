import { useEffect, useState } from 'react';

interface Props {
  values: string[];
  delimiter: ',' | '\n';
  multiline?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (values: string[]) => void;
}

// Free-text draft for an array field. The delimiter stays visible while typing
// (fixes the "can't type a comma/newline" bug) and is committed on blur.
export default function ArrayTextInput({ values, delimiter, multiline, disabled, placeholder, onChange }: Props) {
  const joinSep = delimiter === ',' ? ', ' : delimiter;
  const [text, setText] = useState(values.join(joinSep));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(values.join(joinSep));
  }, [values, joinSep, focused]);

  const commit = () => {
    const parsed = text.split(delimiter).map((s) => s.trim()).filter(Boolean);
    onChange(parsed);
    setText(parsed.join(joinSep));
    setFocused(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  };

  if (multiline) {
    return (
      <textarea
        rows={3}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onChange={(e) => setText(e.target.value)}
      />
    );
  }
  return (
    <input
      type="text"
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onChange={(e) => setText(e.target.value)}
    />
  );
}
