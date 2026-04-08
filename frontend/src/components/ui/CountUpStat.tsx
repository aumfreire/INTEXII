import useCountUp from '../../hooks/useCountUp';

interface CountUpStatProps {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  duration?: number;
}

export default function CountUpStat({
  end,
  prefix = '',
  suffix = '',
  decimals = 0,
  label,
  duration = 2000,
}: CountUpStatProps) {
  const { ref, displayValue } = useCountUp({
    end,
    prefix,
    suffix,
    decimals,
    duration,
  });

  return (
    <div className="impact-stat" ref={ref}>
      <div className="stat-number">{displayValue}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
