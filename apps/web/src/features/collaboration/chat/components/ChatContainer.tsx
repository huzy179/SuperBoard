'use client';

export function ChatContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-4xl px-4 lg:max-w-5xl 2xl:max-w-6xl ${className}`}>
      {children}
    </div>
  );
}
