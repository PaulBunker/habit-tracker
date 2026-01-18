import { useState, useEffect, useMemo } from 'react';
import type { Habit, GraphDataPoint } from '@habit-tracker/shared';
import { habitsApi } from '../api/client';

interface GraphViewProps {
  habit: Habit;
  onClose: () => void;
}

const DATE_RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: 'All Time', days: 0 },
];

export function GraphView({ habit, onClose }: GraphViewProps) {
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  const [unit, setUnit] = useState<string | undefined>(habit.dataUnit);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(30);

  useEffect(() => {
    async function fetchGraphData() {
      setLoading(true);

      let startDate: string | undefined;
      if (selectedRange > 0) {
        const start = new Date();
        start.setDate(start.getDate() - selectedRange);
        startDate = start.toISOString().split('T')[0];
      }

      const response = await habitsApi.getGraph(habit.id, startDate);
      if (response.success && response.data) {
        setGraphData(response.data.points);
        setUnit(response.data.unit);
      }
      setLoading(false);
    }

    fetchGraphData();
  }, [habit.id, selectedRange]);

  const { minValue, maxValue, chartHeight, chartWidth } = useMemo(() => {
    if (graphData.length === 0) {
      return { minValue: 0, maxValue: 100, chartHeight: 200, chartWidth: 400 };
    }

    const values = graphData.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;

    return {
      minValue: Math.floor(min - padding),
      maxValue: Math.ceil(max + padding),
      chartHeight: 200,
      chartWidth: Math.max(400, graphData.length * 20),
    };
  }, [graphData]);

  const getY = (value: number): number => {
    const range = maxValue - minValue || 1;
    return chartHeight - ((value - minValue) / range) * chartHeight;
  };

  const getX = (index: number): number => {
    if (graphData.length <= 1) return chartWidth / 2;
    return (index / (graphData.length - 1)) * chartWidth;
  };

  const pathData = useMemo(() => {
    if (graphData.length === 0) return '';

    return graphData
      .map((point, i) => {
        const x = getX(i);
        const y = getY(point.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [graphData, minValue, maxValue, chartWidth, chartHeight]);

  const areaData = useMemo(() => {
    if (graphData.length === 0) return '';

    const linePath = graphData
      .map((point, i) => {
        const x = getX(i);
        const y = getY(point.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return `${linePath} L ${getX(graphData.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`;
  }, [graphData, minValue, maxValue, chartWidth, chartHeight]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal graph-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{habit.name} - Graph</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="graph-controls">
          {DATE_RANGES.map((range) => (
            <button
              key={range.days}
              className={`range-btn ${selectedRange === range.days ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.days)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="graph-container">
          {loading ? (
            <div className="graph-loading">Loading...</div>
          ) : graphData.length === 0 ? (
            <div className="graph-empty">No data yet</div>
          ) : (
            <div className="graph-wrapper">
              <div className="graph-y-axis">
                <span>{maxValue} {unit}</span>
                <span>{Math.round((maxValue + minValue) / 2)} {unit}</span>
                <span>{minValue} {unit}</span>
              </div>
              <div className="graph-chart" style={{ width: chartWidth, height: chartHeight }}>
                <svg width={chartWidth} height={chartHeight}>
                  {/* Grid lines */}
                  <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="var(--border)" strokeDasharray="4" />

                  {/* Area fill */}
                  <path d={areaData} fill="var(--primary-color)" opacity="0.1" />

                  {/* Line */}
                  <path d={pathData} stroke="var(--primary-color)" strokeWidth="2" fill="none" />

                  {/* Points */}
                  {graphData.map((point, i) => (
                    <circle
                      key={i}
                      cx={getX(i)}
                      cy={getY(point.value)}
                      r="4"
                      fill="var(--primary-color)"
                    >
                      <title>{formatDate(point.date)}: {point.value} {unit}</title>
                    </circle>
                  ))}
                </svg>
              </div>
            </div>
          )}
        </div>

        {graphData.length > 0 && (
          <div className="graph-stats">
            <div className="stat">
              <span className="stat-label">Latest</span>
              <span className="stat-value">{graphData[graphData.length - 1]?.value} {unit}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Average</span>
              <span className="stat-value">
                {(graphData.reduce((sum, d) => sum + d.value, 0) / graphData.length).toFixed(1)} {unit}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Data Points</span>
              <span className="stat-value">{graphData.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
