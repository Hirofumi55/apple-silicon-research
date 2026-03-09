/**
 * 数値を日本語ロケールでフォーマット（3桁カンマ区切り）
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('ja-JP');
}

/**
 * 帯域幅を読みやすい形式に変換
 */
export function formatBandwidth(gbps: number): string {
  if (gbps >= 1000) {
    return `${(gbps / 1000).toFixed(1)} TB/s`;
  }
  return `${gbps} GB/s`;
}

/**
 * メモリ容量を読みやすい形式に変換
 */
export function formatMemory(gb: number): string {
  if (gb >= 1024) {
    return `${gb / 1024}TB`;
  }
  return `${gb}GB`;
}

/**
 * リリース日を日本語形式に変換 "2024-11" → "2024年11月"
 */
export function formatReleaseDate(releaseDate: string): string {
  const [year, month] = releaseDate.split('-');
  return `${year}年${parseInt(month, 10)}月`;
}

/**
 * チップIDからシリーズを判定
 */
export function getChipSeriesLabel(series: 'm' | 'a'): string {
  return series === 'm' ? 'Mシリーズ (Mac)' : 'Aシリーズ (iPhone/iPad)';
}

/**
 * バリアントの日本語ラベル
 */
export function getVariantLabel(variant: string): string {
  const map: Record<string, string> = {
    base: 'ベース',
    pro: 'Pro',
    max: 'Max',
    ultra: 'Ultra',
  };
  return map[variant] ?? variant;
}

/**
 * TOPSを読みやすく表示
 */
export function formatTops(tops: number): string {
  return `${tops} TOPS`;
}

/**
 * ベンチマークスコアを単位付きで返す
 */
export function formatBenchmark(
  value: number | undefined,
  type: 'gb6' | 'antutu' | 'metal'
): string {
  if (!value) return '—';
  const formatted = formatNumber(value);
  return formatted;
}
