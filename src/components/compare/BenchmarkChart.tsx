import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import type { ChipSpec } from '../../types/chip';

interface Props {
  chips: ChipSpec[];
}

// カスタムツールチップ
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1c1c1e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
      }}>
        <p style={{ color: '#f5f5f7', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill || p.stroke, margin: '2px 0' }}>
            {p.value?.toLocaleString('ja-JP')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ベンチマーク棒グラフ
export function BenchmarkBarChart({ chips }: Props) {
  const data = chips
    .filter(c => c.benchmarks.geekbench6MultiCore || c.benchmarks.antutu)
    .map(chip => ({
      name: chip.name.replace('Apple ', ''),
      single: chip.benchmarks.geekbench6SingleCore ?? 0,
      multi: chip.benchmarks.geekbench6MultiCore ?? 0,
      antutu: chip.benchmarks.antutu ?? 0,
      color: chip.color,
    }));

  const mData = data.filter((_, i) => chips.filter(c => c.benchmarks.geekbench6MultiCore)[i]);
  const aData = data.filter((_, i) => chips.filter(c => c.benchmarks.antutu)[i]);

  const mChipData = chips
    .filter(c => c.series === 'm' && c.benchmarks.geekbench6MultiCore)
    .map(c => ({
      name: c.name.replace('Apple ', ''),
      single: c.benchmarks.geekbench6SingleCore ?? 0,
      multi: c.benchmarks.geekbench6MultiCore ?? 0,
      color: c.color,
    }));

  const aChipData = chips
    .filter(c => c.series === 'a' && c.benchmarks.antutu)
    .map(c => ({
      name: c.name.replace('Apple ', '').replace(' Bionic', ''),
      antutu: c.benchmarks.antutu ?? 0,
      gb6single: c.benchmarks.geekbench6SingleCore ?? 0,
      color: c.color,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Mシリーズ Geekbench 6 */}
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '24px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Mシリーズ — Geekbench 6
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={mChipData} margin={{ top: 0, right: 16, bottom: 60, left: 16 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#a1a1a6', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fill: '#a1a1a6', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v.toLocaleString('ja-JP')}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="single" name="シングルコア" radius={[4, 4, 0, 0]}>
              {mChipData.map((entry, i) => (
                <Cell key={i} fill={entry.color + '60'} stroke={entry.color} strokeWidth={1} />
              ))}
            </Bar>
            <Bar dataKey="multi" name="マルチコア" radius={[4, 4, 0, 0]}>
              {mChipData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(150,150,150,0.4)', border: '1px solid #888' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>シングルコア</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#888' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>マルチコア</span>
          </div>
        </div>
      </div>

      {/* Aシリーズ AnTuTu */}
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '24px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Aシリーズ — AnTuTu スコア
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={aChipData} margin={{ top: 0, right: 16, bottom: 20, left: 16 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#a1a1a6', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#a1a1a6', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => (v / 1000000).toFixed(1) + 'M'}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={(v: number) => v.toLocaleString('ja-JP')}
            />
            <Bar dataKey="antutu" name="AnTuTu" radius={[4, 4, 0, 0]}>
              {aChipData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Neural Engine TOPS レーダーチャート
export function NeuralRadarChart({ chips }: Props) {
  const data = [
    { subject: 'CPU性能', fullMark: 100 },
    { subject: 'GPU性能', fullMark: 100 },
    { subject: 'AI (Neural)', fullMark: 100 },
    { subject: 'メモリ帯域', fullMark: 100 },
    { subject: 'メモリ容量', fullMark: 100 },
  ];

  const normalizeValue = (value: number, max: number) => Math.min(Math.round((value / max) * 100), 100);

  const maxValues = {
    cpu: Math.max(...chips.map(c => c.benchmarks.geekbench6MultiCore ?? c.benchmarks.antutu! / 100 ?? 0)),
    gpu: Math.max(...chips.map(c => c.gpu.maxCores ?? c.gpu.cores)),
    neural: Math.max(...chips.map(c => c.neuralEngine.tops)),
    bandwidth: Math.max(...chips.map(c => c.memory.bandwidthGBs)),
    memory: Math.max(...chips.map(c => c.memory.maxCapacityGB)),
  };

  const radarData = data.map((d, i) => {
    const obj: Record<string, any> = { subject: d.subject, fullMark: 100 };
    chips.forEach(chip => {
      let val = 0;
      if (i === 0) val = normalizeValue(chip.benchmarks.geekbench6MultiCore ?? (chip.benchmarks.antutu! / 100) ?? 0, maxValues.cpu);
      if (i === 1) val = normalizeValue(chip.gpu.maxCores ?? chip.gpu.cores, maxValues.gpu);
      if (i === 2) val = normalizeValue(chip.neuralEngine.tops, maxValues.neural);
      if (i === 3) val = normalizeValue(chip.memory.bandwidthGBs, maxValues.bandwidth);
      if (i === 4) val = normalizeValue(chip.memory.maxCapacityGB, maxValues.memory);
      obj[chip.id] = val;
    });
    return obj;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={radarData} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#a1a1a6', fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#a1a1a6', fontSize: 9 }}
          tickCount={4}
        />
        {chips.map(chip => (
          <Radar
            key={chip.id}
            name={chip.name}
            dataKey={chip.id}
            stroke={chip.color}
            fill={chip.color}
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        ))}
        <Legend
          formatter={(value: string) => (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{value}</span>
          )}
        />
        <Tooltip
          content={({ active, payload, label }: any) => {
            if (!active || !payload) return null;
            return (
              <div style={{
                background: '#1c1c1e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
              }}>
                <p style={{ color: '#f5f5f7', fontWeight: 600, marginBottom: '6px' }}>{label}</p>
                {payload.map((p: any) => (
                  <p key={p.name} style={{ color: p.stroke, margin: '2px 0' }}>
                    {p.name}: {p.value}
                  </p>
                ))}
              </div>
            );
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
