import { useState, useCallback, useEffect } from 'react';
import type { ChipSpec } from '../../types/chip';
import { BenchmarkBarChart } from './BenchmarkChart';

interface Props {
  chips: ChipSpec[];
}

type ViewMode = 'table' | 'chart' | 'winner';

const MAX_SELECTED = 3;

// レーダーチャートのデータポイント定義
const radarMetrics = [
  { key: 'cpuScore', label: 'CPU', max: 35000 },
  { key: 'gpuCores', label: 'GPU', max: 80 },
  { key: 'neuralTops', label: 'AI', max: 50 },
  { key: 'memoryBandwidth', label: 'メモリ帯域', max: 900 },
  { key: 'maxMemory', label: 'メモリ容量', max: 200 },
  { key: 'efficiency', label: '効率性', max: 100 },
];

function getMetricValue(chip: ChipSpec, key: string): number {
  switch (key) {
    case 'cpuScore': return chip.benchmarks.geekbench6MultiCore ?? (chip.benchmarks.antutu ? chip.benchmarks.antutu / 100 : 0);
    case 'gpuCores': return chip.gpu.maxCores ?? chip.gpu.cores;
    case 'neuralTops': return chip.neuralEngine.tops;
    case 'memoryBandwidth': return chip.memory.bandwidthGBs;
    case 'maxMemory': return chip.memory.maxCapacityGB;
    case 'efficiency': return chip.series === 'a' ? 90 : 75;
    default: return 0;
  }
}

// SVGレーダーチャート（組み込み）
function RadarChart({ selected }: { selected: ChipSpec[] }) {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const n = radarMetrics.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (index: number, value: number, maxValue: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const getLabelPoint = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius + 24;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  return (
    <svg width={size} height={size} style={{ maxWidth: '100%' }}>
      {[0.25, 0.5, 0.75, 1].map(scale => {
        const pts = radarMetrics.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = scale * radius;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon key={scale} points={pts} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      {radarMetrics.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />;
      })}
      {selected.map(chip => {
        const pts = radarMetrics.map((metric, i) => {
          const val = getMetricValue(chip, metric.key);
          const pt = getPoint(i, val, metric.max);
          return `${pt.x},${pt.y}`;
        }).join(' ');
        return (
          <polygon key={chip.id} points={pts} fill={chip.color + '28'} stroke={chip.color} strokeWidth="1.5" />
        );
      })}
      {radarMetrics.map((metric, i) => {
        const pt = getLabelPoint(i);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="rgba(161,161,166,0.9)">
            {metric.label}
          </text>
        );
      })}
    </svg>
  );
}

// 勝者バッジ
function WinnerBadge({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontSize: '10px',
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: '4px',
      background: color + '25',
      color,
      border: `1px solid ${color}50`,
      marginLeft: '6px',
    }}>▲ 最高</span>
  );
}

// URLパラメータ読み書き
function getInitialIds(allChips: ChipSpec[]): string[] {
  if (typeof window === 'undefined') return ['m4', 'm5', 'a19-pro'];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('chips');
  if (!raw) return ['m4', 'm5', 'a19-pro'];
  const ids = raw.split(',').filter(id => allChips.some(c => c.id === id));
  return ids.length > 0 ? ids.slice(0, MAX_SELECTED) : ['m4', 'm5', 'a19-pro'];
}

function updateUrl(ids: string[]) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('chips', ids.join(','));
  window.history.replaceState({}, '', url.toString());
}

export default function ChipCompareTool({ chips }: Props) {
  const [activeSeries, setActiveSeries] = useState<'all' | 'm' | 'a'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => getInitialIds(chips));
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // URL同期
  useEffect(() => { updateUrl(selectedIds); }, [selectedIds]);

  const filtered = (activeSeries === 'all' ? chips : chips.filter(c => c.series === activeSeries))
    .filter(c => searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const selected = selectedIds.map(id => chips.find(c => c.id === id)!).filter(Boolean);

  const toggleChip = useCallback((chipId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(chipId)) return prev.filter(id => id !== chipId);
      if (prev.length >= MAX_SELECTED) return [...prev.slice(1), chipId];
      return [...prev, chipId];
    });
  }, []);

  const specs: { label: string; key: (c: ChipSpec) => string; numKey?: (c: ChipSpec) => number }[] = [
    { label: 'プロセスノード', key: c => c.processNode },
    { label: 'トランジスタ数', key: c => c.transistors },
    { label: 'CPUコア (合計)', key: c => `${c.cpu.totalCores}コア`, numKey: c => c.cpu.totalCores },
    { label: '  高性能コア', key: c => `${c.cpu.performanceCores}コア`, numKey: c => c.cpu.performanceCores },
    { label: '  高効率コア', key: c => `${c.cpu.efficiencyCores}コア`, numKey: c => c.cpu.efficiencyCores },
    { label: 'GPUコア数', key: c => `${c.gpu.maxCores ?? c.gpu.cores}コア`, numKey: c => c.gpu.maxCores ?? c.gpu.cores },
    { label: 'Neural Engine', key: c => `${c.neuralEngine.tops} TOPS`, numKey: c => c.neuralEngine.tops },
    { label: '最大メモリ', key: c => `${c.memory.maxCapacityGB}GB`, numKey: c => c.memory.maxCapacityGB },
    { label: 'メモリタイプ', key: c => c.memory.type },
    { label: 'メモリ帯域幅', key: c => `${c.memory.bandwidthGBs} GB/s`, numKey: c => c.memory.bandwidthGBs },
    { label: 'GB6 シングルコア', key: c => c.benchmarks.geekbench6SingleCore?.toLocaleString('ja-JP') ?? '—', numKey: c => c.benchmarks.geekbench6SingleCore ?? 0 },
    { label: 'GB6 マルチコア', key: c => c.benchmarks.geekbench6MultiCore?.toLocaleString('ja-JP') ?? '—', numKey: c => c.benchmarks.geekbench6MultiCore ?? 0 },
    { label: 'AnTuTu', key: c => c.benchmarks.antutu?.toLocaleString('ja-JP') ?? '—', numKey: c => c.benchmarks.antutu ?? 0 },
    { label: 'Metal Score', key: c => c.benchmarks.metalScore?.toLocaleString('ja-JP') ?? '—', numKey: c => c.benchmarks.metalScore ?? 0 },
    { label: '発売時期', key: c => c.releaseDate.replace('-', '年') + '月' },
  ];

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/compare?chips=${selectedIds.join(',')}`
    : '';

  const copyShare = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  };

  return (
    <div>
      {/* チップセレクター */}
      <div style={{
        padding: '24px',
        background: 'var(--color-surface)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        marginBottom: '24px',
      }}>
        {/* シリーズタブ + 検索 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['all', 'm', 'a'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSeries(s)}
              style={{
                padding: '6px 16px',
                borderRadius: '980px',
                border: '1px solid',
                borderColor: activeSeries === s ? 'var(--color-accent)' : 'var(--color-border)',
                background: activeSeries === s ? 'rgba(0,113,227,0.15)' : 'transparent',
                color: activeSeries === s ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s === 'all' ? '全シリーズ' : s === 'm' ? 'Mシリーズ' : 'Aシリーズ'}
            </button>
          ))}

          {/* 検索 */}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="チップ名で検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px 6px 32px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                fontSize: '13px',
                outline: 'none',
                width: '160px',
              }}
            />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
              <circle cx="6" cy="6" r="4.5" stroke="var(--color-text)" strokeWidth="1.2"/>
              <line x1="9.5" y1="9.5" x2="13" y2="13" stroke="var(--color-text)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {selectedIds.length}/{MAX_SELECTED} 選択中
          </span>
        </div>

        {/* チップピルボタン */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {filtered.map(chip => {
            const isSelected = selectedIds.includes(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                style={{
                  padding: '6px 13px',
                  borderRadius: '980px',
                  border: '1px solid',
                  borderColor: isSelected ? chip.color : 'var(--color-border)',
                  background: isSelected ? chip.color + '20' : 'transparent',
                  color: isSelected ? chip.color : 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: chip.color, opacity: isSelected ? 1 : 0.35 }} />
                {chip.name.replace('Apple ', '')}
              </button>
            );
          })}
        </div>

        {/* 選択リセット + シェアボタン */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setSelectedIds([])}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              選択クリア
            </button>
            <button
              onClick={copyShare}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="2" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <circle cx="10" cy="2" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1"/>
                <line x1="3.3" y1="5.2" x2="8.8" y2="2.8" stroke="currentColor" strokeWidth="1"/>
                <line x1="3.3" y1="6.8" x2="8.8" y2="9.2" stroke="currentColor" strokeWidth="1"/>
              </svg>
              URLをコピー
            </button>
          </div>
        )}
      </div>

      {/* ビュー切替 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {([
          { mode: 'table', icon: '▤', label: 'テーブル' },
          { mode: 'chart', icon: '◉', label: 'グラフ' },
          { mode: 'winner', icon: '▲', label: '勝敗' },
        ] as { mode: ViewMode; icon: string; label: string }[]).map(({ mode, icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: viewMode === mode ? 'var(--color-accent)' : 'var(--color-border)',
              background: viewMode === mode ? 'rgba(0,113,227,0.1)' : 'transparent',
              color: viewMode === mode ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span>{icon}</span> {label}
          </button>
        ))}
      </div>

      {/* 空の状態 */}
      {selected.length === 0 && (
        <div style={{
          padding: '60px 32px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          border: '1px dashed var(--color-border)',
          borderRadius: '12px',
          fontSize: '14px',
        }}>
          上のボタンからチップを選択してください（最大3つ）
        </div>
      )}

      {/* テーブルビュー */}
      {selected.length > 0 && viewMode === 'table' && (
        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', minWidth: '160px' }}>スペック</th>
                {selected.map(chip => (
                  <th key={chip.id} style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid var(--color-border)', minWidth: '140px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: chip.color }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{chip.name.replace('Apple ', '')}</span>
                      <span style={{ fontSize: '10px', color: chip.color, fontWeight: 500 }}>{chip.processNode}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => {
                const values = selected.map(c => spec.key(c));
                const numValues = spec.numKey ? selected.map(c => spec.numKey!(c)) : [];
                const maxNum = numValues.length > 0 ? Math.max(...numValues) : 0;
                const isHeader = spec.label.startsWith('  ');

                return (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  }}>
                    <td style={{ padding: isHeader ? '10px 20px 10px 32px' : '12px 20px', fontSize: '12px', color: isHeader ? 'var(--color-text-secondary)' : 'var(--color-text-secondary)', fontWeight: isHeader ? 400 : 500 }}>
                      {spec.label.replace(/^\s+/, '')}
                    </td>
                    {selected.map((chip, ci) => {
                      const val = spec.key(chip);
                      const numVal = spec.numKey ? spec.numKey(chip) : 0;
                      const isMax = spec.numKey && selected.length > 1 && numVal > 0 && numVal === maxNum;
                      return (
                        <td key={chip.id} style={{ padding: isHeader ? '10px 20px' : '12px 20px', textAlign: 'center', fontSize: '13px', fontWeight: isMax ? 700 : 400, color: isMax ? chip.color : 'var(--color-text)' }}>
                          {val}
                          {isMax && selected.length > 1 && val !== '—' && (
                            <span style={{ marginLeft: '3px', fontSize: '9px', opacity: 0.7 }}>▲</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', padding: '10px 20px' }}>
            ▲ は選択チップ内での最高値。GB6 = Geekbench 6（参考値）。
          </p>
        </div>
      )}

      {/* グラフビュー */}
      {selected.length > 0 && viewMode === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', alignItems: 'start' }}>
          {/* レーダーチャート */}
          <div style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', minWidth: '240px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', textAlign: 'center', letterSpacing: '0.5px' }}>総合性能レーダー</h4>
            <RadarChart selected={selected} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
              {selected.map(chip => (
                <div key={chip.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <div style={{ width: '16px', height: '2px', background: chip.color, borderRadius: '1px' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{chip.name.replace('Apple ', '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ベンチマーク棒グラフ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Geekbench 6 マルチコア', key: 'geekbench6MultiCore' as const, max: 35000 },
              { label: 'Neural Engine (TOPS)', key: 'neuralTops' as const, max: 50, custom: true },
              { label: 'メモリ帯域幅 (GB/s)', key: 'bandwidth' as const, max: 700, custom: true },
            ].map(({ label, key, max, custom }) => {
              const getVal = (c: ChipSpec) => {
                if (key === 'neuralTops') return c.neuralEngine.tops;
                if (key === 'bandwidth') return c.memory.bandwidthGBs;
                return (c.benchmarks as any)[key] ?? 0;
              };
              const vals = selected.map(c => ({ chip: c, val: getVal(c) })).filter(d => d.val > 0);
              if (vals.length === 0) return null;
              const actualMax = Math.max(...vals.map(d => d.val));

              return (
                <div key={key} style={{ padding: '20px 24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', letterSpacing: '0.3px' }}>{label}</h4>
                  {vals.map(({ chip, val }) => {
                    const pct = (val / actualMax) * 100;
                    return (
                      <div key={chip.id} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: chip.color, fontWeight: 600 }}>{chip.name.replace('Apple ', '')}</span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500 }}>{val.toLocaleString('ja-JP')}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: chip.color, borderRadius: '3px', transition: 'width 0.7s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 勝敗ビュー */}
      {selected.length > 0 && viewMode === 'winner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* チップヘッダー */}
          <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${selected.length}, 1fr)`, gap: '0', background: 'var(--color-surface)', borderRadius: '12px 12px 0 0', border: '1px solid var(--color-border)', borderBottom: 'none', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>スペック</div>
            {selected.map(chip => (
              <div key={chip.id} style={{ padding: '14px 16px', textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: chip.color, margin: '0 auto 4px' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>{chip.name.replace('Apple ', '')}</div>
              </div>
            ))}
          </div>

          {/* 勝敗行 */}
          {[
            { label: 'CPU マルチコア (GB6)', getVal: (c: ChipSpec) => c.benchmarks.geekbench6MultiCore ?? 0, unit: '' },
            { label: 'CPU シングルコア (GB6)', getVal: (c: ChipSpec) => c.benchmarks.geekbench6SingleCore ?? 0, unit: '' },
            { label: 'Neural Engine', getVal: (c: ChipSpec) => c.neuralEngine.tops, unit: ' TOPS' },
            { label: 'GPUコア数', getVal: (c: ChipSpec) => c.gpu.maxCores ?? c.gpu.cores, unit: 'コア' },
            { label: 'メモリ帯域幅', getVal: (c: ChipSpec) => c.memory.bandwidthGBs, unit: ' GB/s' },
            { label: '最大メモリ', getVal: (c: ChipSpec) => c.memory.maxCapacityGB, unit: 'GB' },
            { label: 'AnTuTu', getVal: (c: ChipSpec) => c.benchmarks.antutu ?? 0, unit: '' },
          ].map((row, i) => {
            const vals = selected.map(c => row.getVal(c));
            const maxVal = Math.max(...vals);
            const allZero = vals.every(v => v === 0);

            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: `200px repeat(${selected.length}, 1fr)`,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                border: '1px solid var(--color-border)',
                borderTop: 'none',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 20px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                  {row.label}
                </div>
                {selected.map((chip, ci) => {
                  const val = row.getVal(chip);
                  const isWinner = !allZero && val > 0 && val === maxVal;
                  return (
                    <div key={chip.id} style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      borderLeft: '1px solid var(--color-border)',
                      background: isWinner ? chip.color + '12' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: isWinner ? 700 : 400, color: isWinner ? chip.color : 'var(--color-text)' }}>
                        {val === 0 ? '—' : val.toLocaleString('ja-JP') + row.unit}
                      </span>
                      {isWinner && selected.length > 1 && val > 0 && (
                        <span style={{ fontSize: '10px', color: chip.color }}>★</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* 総合スコア（勝利数カウント） */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${selected.length}, 1fr)`,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>★ 勝利数</div>
            {selected.map(chip => {
              const wins = [
                (c: ChipSpec) => c.benchmarks.geekbench6MultiCore ?? 0,
                (c: ChipSpec) => c.benchmarks.geekbench6SingleCore ?? 0,
                (c: ChipSpec) => c.neuralEngine.tops,
                (c: ChipSpec) => c.gpu.maxCores ?? c.gpu.cores,
                (c: ChipSpec) => c.memory.bandwidthGBs,
                (c: ChipSpec) => c.memory.maxCapacityGB,
                (c: ChipSpec) => c.benchmarks.antutu ?? 0,
              ].filter(fn => {
                const vals = selected.map(c => fn(c));
                const max = Math.max(...vals);
                return max > 0 && fn(chip) === max;
              }).length;

              return (
                <div key={chip.id} style={{ padding: '14px 16px', textAlign: 'center', borderLeft: '1px solid var(--color-border)', background: chip.color + '10' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: chip.color }}>{wins}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>勝利</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
