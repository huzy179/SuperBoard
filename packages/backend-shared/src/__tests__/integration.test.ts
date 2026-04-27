/**
 * Integration test for package exports
 */

import * as backendShared from '../index';
import * as testing from '../testing';
import * as types from '../types';

describe('Package Integration', () => {
  it('should export all main modules from index', () => {
    // Check that main exports exist (even if they're placeholders)
    expect(backendShared).toBeDefined();

    // These will be placeholders for now, but structure should be correct
    expect(typeof backendShared.BaseAMQPConsumer).toBe('function');
    expect(typeof backendShared.AMQPConnectionManager).toBe('function');
    expect(typeof backendShared.HealthCheckService).toBe('function');
    expect(typeof backendShared.ConfigService).toBe('function');
    expect(typeof backendShared.BaseEventHandler).toBe('function');
    expect(typeof backendShared.EventBus).toBe('function');
    expect(typeof backendShared.MetricsService).toBe('function');
    expect(typeof backendShared.NestBootstrap).toBe('function');
    expect(typeof backendShared.RedisPoolManager).toBe('function');
    expect(typeof backendShared.DatabasePoolManager).toBe('function');
    expect(typeof backendShared.ErrorHandler).toBe('function');
  });

  it('should export testing utilities', () => {
    const { MockFactories, PropertyGenerators } = testing;

    expect(MockFactories).toBeDefined();
    expect(PropertyGenerators).toBeDefined();
    expect(typeof MockFactories.createAMQPConfig).toBe('function');
    expect(typeof MockFactories.createDomainEvent).toBe('function');
  });

  it('should export type definitions', () => {
    const { ErrorType, ErrorSeverity } = types;

    expect(types).toBeDefined();
    expect(ErrorType).toBeDefined();
    expect(ErrorSeverity).toBeDefined();
  });
});
