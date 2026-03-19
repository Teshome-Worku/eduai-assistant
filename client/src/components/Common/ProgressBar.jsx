const ProgressBar = ({ value = 0, max = 100, color = 'indigo', size = 'md', showLabel = true }) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const colorClasses = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const autoColor = percentage >= 70 ? 'green' : percentage >= 40 ? 'yellow' : 'red';
  const barColor = color === 'auto' ? colorClasses[autoColor] : colorClasses[color];

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${barColor} ${sizeClasses[size]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{percentage}%</p>
      )}
    </div>
  );
};

export default ProgressBar;
