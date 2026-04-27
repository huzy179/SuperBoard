/**
 * Metrics type definitions
 */

export * from '../types';

export interface MetricCollector {
  name: string;
  help: string;
  collect(): Promise<string>;
}

export interface CounterMetric {
  inc(labels?: Record<string, string>, value?: number): void;
  get(): number;
}

export interface HistogramMetric {
  observe(value: number, labels?: Record<string, string>): void;
  startTimer(labels?: Record<string, string>): () => void;
}

export interface GaugeMetric {
  set(value: number, labels?: Record<string, string>): void;
  inc(labels?: Record<string, string>, value?: number): void;
  dec(labels?: Record<string, string>, value?: number): void;
}
