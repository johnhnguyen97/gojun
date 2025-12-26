interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: { card: 'w-8 h-8', text: 'text-sm', gap: 'gap-1' },
    md: { card: 'w-12 h-12', text: 'text-xl', gap: 'gap-2' },
    lg: { card: 'w-14 h-14', text: 'text-2xl', gap: 'gap-2' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <div className={`${s.card} bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 -rotate-6 hover:rotate-0 transition-transform duration-300`}>
        <span className={`text-white ${s.text} font-bold`}>語</span>
      </div>
      <div className={`${s.card} bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/30 rotate-6 hover:rotate-0 transition-transform duration-300`}>
        <span className={`text-white ${s.text} font-bold`}>順</span>
      </div>
    </div>
  );
}
