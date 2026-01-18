import type { GraphDataPoint } from '@habit-tracker/shared';

/**
 * Empty data for testing empty state
 */
export const emptyGraphData: GraphDataPoint[] = [];

/**
 * Single data point for edge case testing
 */
export const singlePointData: GraphDataPoint[] = [{ date: '2024-01-15', value: 185.0 }];

/**
 * Two data points for minimal line rendering
 */
export const twoPointData: GraphDataPoint[] = [
  { date: '2024-01-14', value: 186.0 },
  { date: '2024-01-15', value: 185.0 },
];

/**
 * 7 days of steady decline data
 */
export const steadyDeclineData: GraphDataPoint[] = [
  { date: '2024-01-09', value: 188.0 },
  { date: '2024-01-10', value: 187.5 },
  { date: '2024-01-11', value: 187.0 },
  { date: '2024-01-12', value: 186.5 },
  { date: '2024-01-13', value: 186.0 },
  { date: '2024-01-14', value: 185.5 },
  { date: '2024-01-15', value: 185.0 },
];

/**
 * 7 days of plateau data (minimal variation)
 */
export const plateauData: GraphDataPoint[] = [
  { date: '2024-01-09', value: 185.2 },
  { date: '2024-01-10', value: 185.0 },
  { date: '2024-01-11', value: 185.3 },
  { date: '2024-01-12', value: 185.1 },
  { date: '2024-01-13', value: 185.0 },
  { date: '2024-01-14', value: 185.2 },
  { date: '2024-01-15', value: 185.1 },
];

/**
 * All identical values - edge case for Y-axis calculation
 */
export const identicalValuesData: GraphDataPoint[] = [
  { date: '2024-01-13', value: 185.0 },
  { date: '2024-01-14', value: 185.0 },
  { date: '2024-01-15', value: 185.0 },
];

/**
 * 30-day realistic weight loss journey
 * - Days 1-20: Loss phase (~200 lbs down to ~193 lbs)
 * - Days 21-30: Plateau phase (~192-194 lbs)
 */
export const weightLossJourneyData: GraphDataPoint[] = [
  // Loss phase
  { date: '2024-01-01', value: 200.0 },
  { date: '2024-01-02', value: 199.5 },
  { date: '2024-01-03', value: 199.8 },
  { date: '2024-01-04', value: 199.0 },
  { date: '2024-01-05', value: 198.5 },
  { date: '2024-01-06', value: 198.2 },
  { date: '2024-01-07', value: 198.0 },
  { date: '2024-01-08', value: 197.5 },
  { date: '2024-01-09', value: 197.8 },
  { date: '2024-01-10', value: 197.0 },
  { date: '2024-01-11', value: 196.5 },
  { date: '2024-01-12', value: 196.0 },
  { date: '2024-01-13', value: 195.8 },
  { date: '2024-01-14', value: 195.2 },
  { date: '2024-01-15', value: 195.0 },
  { date: '2024-01-16', value: 194.5 },
  { date: '2024-01-17', value: 194.2 },
  { date: '2024-01-18', value: 194.0 },
  { date: '2024-01-19', value: 193.5 },
  { date: '2024-01-20', value: 193.2 },
  // Plateau phase
  { date: '2024-01-21', value: 193.0 },
  { date: '2024-01-22', value: 193.3 },
  { date: '2024-01-23', value: 192.8 },
  { date: '2024-01-24', value: 193.1 },
  { date: '2024-01-25', value: 192.9 },
  { date: '2024-01-26', value: 193.4 },
  { date: '2024-01-27', value: 192.7 },
  { date: '2024-01-28', value: 193.0 },
  { date: '2024-01-29', value: 193.2 },
  { date: '2024-01-30', value: 192.8 },
];

/**
 * Large value range for testing Y-axis scaling
 */
export const largeRangeData: GraphDataPoint[] = [
  { date: '2024-01-01', value: 250.0 },
  { date: '2024-01-02', value: 200.0 },
  { date: '2024-01-03', value: 150.0 },
];
