import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  type CounterConfiguration,
  type HistogramConfiguration,
  type GaugeConfiguration,
} from 'prom-client';
import type { MetricsConfig } from '../types';

export class MetricsService {
  private readonly registry: Registry;
  private readonly enabled: boolean;
  private readonly prefix: string;
  private readonly counters = new Map<string, Counter<string>>();
  private readonly histograms = new Map<string, Histogram<string>>();
  private readonly gauges = new Map<string, Gauge<string>>();

  constructor(config: MetricsConfig = { enabled: true }) {
    this.enabled = config.enabled !== false;
    this.prefix = config.prefix ?? '';
    this.registry = new Registry();

    if (config.defaultLabels) {
      this.registry.setDefaultLabels(config.defaultLabels);
    }

    if (this.enabled && config.collectDefaultMetrics !== false) {
      collectDefaultMetrics({ register: this.registry, prefix: this.prefix });
    }
  }

  getRegistry(): Registry {
    return this.registry;
  }

  counter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    const metricName = `${this.prefix}${name}`;
    const existing = this.counters.get(metricName);
    if (existing) return existing;

    const cfg: CounterConfiguration<string> = {
      name: metricName,
      help,
      labelNames,
      registers: [this.registry],
    };

    const c = new Counter(cfg);
    this.counters.set(metricName, c);
    return c;
  }

  histogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets?: number[],
  ): Histogram<string> {
    const metricName = `${this.prefix}${name}`;
    const existing = this.histograms.get(metricName);
    if (existing) return existing;

    const cfg: HistogramConfiguration<string> = {
      name: metricName,
      help,
      labelNames,
      buckets,
      registers: [this.registry],
    };

    const h = new Histogram(cfg);
    this.histograms.set(metricName, h);
    return h;
  }

  gauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    const metricName = `${this.prefix}${name}`;
    const existing = this.gauges.get(metricName);
    if (existing) return existing;

    const cfg: GaugeConfiguration<string> = {
      name: metricName,
      help,
      labelNames,
      registers: [this.registry],
    };

    const g = new Gauge(cfg);
    this.gauges.set(metricName, g);
    return g;
  }

  async metricsText(): Promise<string> {
    if (!this.enabled) return '';
    return this.registry.metrics();
  }
}
