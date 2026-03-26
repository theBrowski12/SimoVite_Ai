export type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'MIXED';

export function getSentimentColor(s: Sentiment): string {
  const map: Record<Sentiment, string> = {
    POSITIVE: '#22C55E',
    NEGATIVE: '#EF4444',
    MIXED: '#F59E0B'
  };
  return map[s] ?? '#6B7280';
}

export function getSentimentIcon(s: Sentiment): string {
  const map: Record<Sentiment, string> = {
    POSITIVE: '😊',
    NEGATIVE: '😞',
    MIXED: '😐'
  };
  return map[s] ?? '❓';
}

export function getSentimentBgClass(s: Sentiment): string {
  const map: Record<Sentiment, string> = {
    POSITIVE: 'badge-green',
    NEGATIVE: 'badge-red',
    MIXED: 'badge-amber'
  };
  return map[s] ?? 'badge-gray';
}