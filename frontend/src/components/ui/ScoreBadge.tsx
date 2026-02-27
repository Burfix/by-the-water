import { cn, scoreColor, scoreBg } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const rounded = Math.round(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        scoreBg(score),
        scoreColor(score),
        sizeClasses[size],
      )}
    >
      {rounded}%
      {showLabel && (
        <span className="font-normal">
          {score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'}
        </span>
      )}
    </span>
  );
}
