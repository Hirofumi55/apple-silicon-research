import { BenchmarkBarChart, NeuralRadarChart } from './BenchmarkChart';
import type { ChipSpec } from '../../types/chip';

interface Props {
  chips: ChipSpec[];
  title?: string;
}

export default function ChartSection({ chips, title }: Props) {
  return (
    <div>
      {title && (
        <h2 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: '40px',
          letterSpacing: '-0.5px',
        }}>{title}</h2>
      )}
      <BenchmarkBarChart chips={chips} />
    </div>
  );
}

export function RadarSection({ chips }: { chips: ChipSpec[] }) {
  return (
    <div>
      <h3 style={{
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--color-text-secondary)',
        marginBottom: '24px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>総合性能レーダーチャート</h3>
      <NeuralRadarChart chips={chips} />
    </div>
  );
}
