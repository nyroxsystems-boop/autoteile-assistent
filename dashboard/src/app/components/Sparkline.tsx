interface SparklineProps {
  data: number[];
  color: string;
  height?: number;
}

export function Sparkline({ data, color, height = 32 }: SparklineProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg 
      width="100%" 
      height={height} 
      className="sparkline"
      preserveAspectRatio="none"
      viewBox={`0 0 100 ${height}`}
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        fill={`url(#gradient-${color})`}
        points={`0,${height} ${points} 100,${height}`}
      />
    </svg>
  );
}
