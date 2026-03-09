import { useState, useCallback } from 'react';
import type { ChipSpec } from '../../types/chip';

interface Props {
  chips: ChipSpec[];
}

type ViewMode = 'table' | 'chart';

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
    case 'cpuScore': return chip.benchmarks.geekbench6MultiCore ?? chip.benchmarks.antutu ? (chip.benchmarks.antutu! / 100) : 0;
    case 'gpuCores': return chip.gpu.maxCores ?? chip.gpu.cores;
    case 'neuralTops': return chip.neuralEngine.tops;
    case 'memoryBandwidth': return chip.memory.bandwidthGBs;
    case 'maxMemory': return chip.memory.maxCapacityGB;
    case 'efficiency': return chip.series === 'a' ? 90 : 75; // 簡易値
    default: return 0;
  }
}

// SVGレーダーチャート
function RadarChart({ chips, selected }: { chips: ChipSpec[], selected: ChipSpec[] }) {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const metrics = radarMetrics;
  const n = metrics.length;

  const angleStep = (2 * Math.PI) / n;

  const getPoint = (index: number, value: number, maxValue: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius + 22;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  return (
    <svg width={size} height={size} style={{ maxWidth: '100%' }}>
      {/* グリッド */}
      {[0.25, 0.5, 0.75, 1].map(scale => {
        const points = metrics.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const r = scale * radius;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={scale}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* 軸 */}
      {metrics.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* データ */}
      {selected.map((chip) => {
        const points = metrics.map((metric, i) => {
          const value = getMetricValue(chip, metric.key);
          const pt = getPoint(i, value, metric.max);
          return `${pt.x},${pt.y}`;
        }).join(' ');

        return (
          <polygon
            key={chip.id}
            points={points}
            fill={chip.color + '30'}
            stroke={chip.color}
            strokeWidth="1.5"
          />
        );
      })}

      {/* ラベル */}
      {metrics.map((metric, i) => {
        const pt = getLabelPoint(i);
        return (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="rgba(161,161,166,0.9)"
          >
            {metric.label}
          </text>
        );
      })}
    </svg>
  );
}

// ベンチマーク棒グラフ
function BenchmarkBar({ chip, value, max, color }: { chip: ChipSpec, value: number, max: number, color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: color, fontWeight: 600 }}>{chip.name}</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text)' }}>{value.toLocaleString('ja-JP')}</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

export default function ChipCompareTool({ chips }: Props) {
  const [activeSeries, setActiveSeries] = useState<'all' | 'm' | 'a'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(['m4', 'm5', 'a19-pro']);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const filtered = activeSeries === 'all' ? chips : chips.filter(c => c.series === activeSeries);
  const selected = selectedIds.map(id => chips.find(c => c.id === id)!).filter(Boolean);

  const toggleChip = useCallback((chipId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(chipId)) {
        return prev.filter(id => id !== chipId);
      }
      if (prev.length >= MAX_SELECTED) {
        return [...prev.slice(1), chipId]; // 最初の選択を外す
      }
      return [...prev, chipId];
    });
  }, []);

  const specs = [
    { label: 'プロセスノード', key: (c: ChipSpec) => c.processNode },
    { label: 'CPUコア数', key: (c: ChipSpec) => `${c.cpu.totalCores}コア (${c.cpu.performanceCores}P + ${c.cpu.efficiencyCores}E)` },
    { label: 'GPUコア数', key: (c: ChipSpec) => `${c.gpu.maxCores ?? c.gpu.cores}コア` },
    { label: 'Neural Engine', key: (c: ChipSpec) => `${c.neuralEngine.tops} TOPS` },
    { label: '最大メモリ', key: (c: ChipSpec) => `${c.memory.maxCapacityGB}GB ${c.memory.type}` },
    { label: 'メモリ帯域幅', key: (c: ChipSpec) => `${c.memory.bandwidthGBs} GB/s` },
    { label: 'Geekbench 6 (S)', key: (c: ChipSpec) => c.benchmarks.geekbench6SingleCore?.toLocaleString('ja-JP') ?? '—' },
    { label: 'Geekbench 6 (M)', key: (c: ChipSpec) => c.benchmarks.geekbench6MultiCore?.toLocaleString('ja-JP') ?? '—' },
    { label: 'AnTuTu', key: (c: ChipSpec) => c.benchmarks.antutu?.toLocaleString('ja-JP') ?? '—' },
    { label: '発売時期', key: (c: ChipSpec) => c.releaseDate.replace('-', '年') + '月' },
  ];

  const maxMulti = Math.max(...chips.map(c => c.benchmarks.geekbench6MultiCore ?? 0));
  const maxAntutu = Math.max(...chips.map(c => c.benchmarks.antutu ?? 0));

  return (
    <div>
      {/* チップセレクター */}
      <div style={{ marginBottom: '32px' }}>
        {/* シリーズタブ */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['all', 'm', 'a'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSeries(s)}
              style={{
                padding: '6px 16px',
                borderRadius: '980px',
                border: '1px solid',
                borderColor: activeSeries === s ? 'var(--color-accent)' : 'var(--color-border)',
                background: activeSeries === s ? 'rgba(0, 113, 227, 0.15)' : 'transparent',
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
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
            {selectedIds.length}/{MAX_SELECTED} 選択中
          </span>
        </div>

        {/* チップピルボタン */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {filtered.map(chip => {
            const isSelected = selectedIds.includes(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '980px',
                  border: '1px solid',
                  borderColor: isSelected ? chip.color : 'var(--color-border)',
                  background: isSelected ? chip.color + '20' : 'transparent',
                  color: isSelected ? chip.color : 'var(--color-text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: chip.color,
                  opacity: isSelected ? 1 : 0.4,
                }} />
                {chip.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ビュー切替 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['table', 'chart'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: viewMode === mode ? 'var(--color-accent)' : 'var(--color-border)',
              background: viewMode === mode ? 'rgba(0,113,227,0.1)' : 'transparent',
              color: viewMode === mode ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {mode === 'table' ? '📋 テーブル' : '📊 グラフ'}
          </button>
        ))}
      </div>

      {selected.length === 0 && (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          border: '1px dashed var(--color-border)',
          borderRadius: '12px',
        }}>
          チップを選択してください（最大3つ）
        </div>
      )}

      {selected.length > 0 && viewMode === 'table' && (
        <div style={{
          overflowX: 'auto',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface)' }}>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderBottom: '1px solid var(--color-border)',
                  minWidth: '140px',
                }}>スペック</th>
                {selected.map(chip => (
                  <th key={chip.id} style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: chip.color }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{chip.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{chip.releaseDate.replace('-', '年')}月</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}>
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {spec.label}
                  </td>
                  {selected.map(chip => {
                    const values = selected.map(c => spec.key(c));
                    const val = spec.key(chip);
                    // 数値比較で最大値を強調
                    const numericValues = values.map(v => parseFloat(v.replace(/[^0-9.]/g, '')));
                    const numericVal = parseFloat(val.replace(/[^0-9.]/g, ''));
                    const isMax = !isNaN(numericVal) && numericVal === Math.max(...numericValues.filter(v => !isNaN(v)));
                    return (
                      <td key={chip.id} style={{
                        padding: '14px 20px',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: isMax ? 700 : 400,
                        color: isMax ? chip.color : 'var(--color-text)',
                      }}>
                        {val}
                        {isMax && selected.length > 1 && (
                          <span style={{ marginLeft: '4px', fontSize: '10px' }}>▲</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected.length > 0 && viewMode === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px', alignItems: 'start' }}>
          {/* レーダーチャート */}
          <div style={{
            padding: '24px',
            background: 'var(--color-surface)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
          }}>
            <h4 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
              総合性能レーダー
            </h4>
            <RadarChart chips={chips} selected={selected} />
            {/* 凡例 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              {selected.map(chip => (
                <div key={chip.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <div style={{ width: '16px', height: '2px', background: chip.color, borderRadius: '1px' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{chip.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ベンチマーク棒グラフ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Mシリーズ (GB6マルチ) */}
            {selected.some(c => c.benchmarks.geekbench6MultiCore) && (
              <div style={{
                padding: '24px',
                background: 'var(--color-surface)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
              }}>
                <h4 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Geekbench 6 マルチコア
                </h4>
                {selected.filter(c => c.benchmarks.geekbench6MultiCore).map(chip => (
                  <BenchmarkBar
                    key={chip.id}
                    chip={chip}
                    value={chip.benchmarks.geekbench6MultiCore!}
                    max={maxMulti}
                    color={chip.color}
                  />
                ))}
              </div>
            )}

            {/* Neural Engine */}
            <div style={{
              padding: '24px',
              background: 'var(--color-surface)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
            }}>
              <h4 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Neural Engine (TOPS)
              </h4>
              {selected.map(chip => (
                <BenchmarkBar
                  key={chip.id}
                  chip={chip}
                  value={chip.neuralEngine.tops}
                  max={50}
                  color={chip.color}
                />
              ))}
            </div>

            {/* メモリ帯域 */}
            <div style={{
              padding: '24px',
              background: 'var(--color-surface)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
            }}>
              <h4 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                メモリ帯域幅 (GB/s)
              </h4>
              {selected.map(chip => (
                <BenchmarkBar
                  key={chip.id}
                  chip={chip}
                  value={chip.memory.bandwidthGBs}
                  max={900}
                  color={chip.color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
