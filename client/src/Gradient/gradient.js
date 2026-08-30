const colors = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

function hashString(str) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getUserGradient(userId) {
  const hash = hashString(String(userId));

  const color1 = colors[hash % colors.length];
  const color2 = colors[(hash >> 3) % colors.length];

  const angle = 120 + (hash % 120);

  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}