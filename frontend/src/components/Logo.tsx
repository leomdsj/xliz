export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <span className={`font-mono font-bold tracking-tighter ${sizes[size]}`}>
      <span className="text-violet-500">x</span>
      <span className="text-white">liz</span>
    </span>
  );
}
