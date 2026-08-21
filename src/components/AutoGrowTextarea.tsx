import React, { useEffect, useRef } from 'react';

type AutoGrowTextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>;

/** A textarea that grows and shrinks its height to fit its content, instead of scrolling. */
export const AutoGrowTextarea: React.FC<AutoGrowTextareaProps> = ({ value, style, ...rest }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      style={{ resize: 'none', overflow: 'hidden', ...style }}
      {...rest}
    />
  );
};
