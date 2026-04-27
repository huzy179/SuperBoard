/**
 * AMQP Connection Manager
 * Manages connection pooling and health checking for RabbitMQ
 */

import { Connection, connect } from 'amqplib';
import { AMQPConfig } from '../types';

export class AMQPConnectionManager {
  private connections = new Map<string, Connection>();
  private connectionPromises = new Map<string, Promise<Connection>>();
  private healthCheckIntervals = new Map<string, NodeJS.Timeout>();
  private reconnectAttempts = new Map<string, number>();

  /**
   * Get or create a connection for the given configuration
   */
  async getConnection(config: AMQPConfig): Promise<Connection> {
    const connectionKey = this.getConnectionKey(config);

    // Return existing connection if available
    const conn = this.connections.get(connectionKey);
    if (conn) {
      return conn;
    }
    // If key exists but conn is missing, clean up
    if (this.connections.has(connectionKey)) {
      this.connections.delete(connectionKey);
    }

    // Return pending connection promise if one is already being created
    const pendingPromise = this.connectionPromises.get(connectionKey);
    if (pendingPromise) {
      return pendingPromise;
    }

    // Create new connection
    const connectionPromise = this.createConnection(config, connectionKey);
    this.connectionPromises.set(connectionKey, connectionPromise);

    try {
      const connection = await connectionPromise;
      this.connections.set(connectionKey, connection);
      this.setupHealthCheck(config, connectionKey);
      return connection;
    } finally {
      this.connectionPromises.delete(connectionKey);
    }
  }

  /**
   * Close all managed connections
   */
  async closeAll(): Promise<void> {
    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map((conn) => {
      if (conn) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (conn as any).close().catch(() => {
          // Ignore errors during close
        });
      }
      return Promise.resolve();
    });

    await Promise.all(closePromises);
    this.connections.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Check health of a specific connection
   */
  async healthCheck(connectionKey: string): Promise<boolean> {
    const connection = this.connections.get(connectionKey);
    if (!connection) {
      return false;
    }

    try {
      // Try to create a channel to verify connection is alive
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channel = await (connection as any).createChannel();
      await channel.close();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection key for caching
   */
  private getConnectionKey(config: AMQPConfig): string {
    return config.url;
  }

  /**
   * Create a new connection with automatic reconnection
   */
  private async createConnection(config: AMQPConfig, connectionKey: string): Promise<Connection> {
    const maxAttempts = config.maxReconnectAttempts ?? 5;
    const reconnectInterval = config.reconnectInterval ?? 5000;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const connection = await connect(config.url);

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.set(connectionKey, 0);

        // Setup error handler for automatic reconnection
        connection.on('error', () => {
          this.handleConnectionError(config, connectionKey);
        });

        connection.on('close', () => {
          this.connections.delete(connectionKey);
          this.handleConnectionError(config, connectionKey);
        });

        return connection as unknown as Connection;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxAttempts - 1) {
          // Calculate exponential backoff
          const delay = reconnectInterval * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw new Error(
      `Failed to connect to AMQP after ${maxAttempts} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(config: AMQPConfig, connectionKey: string): void {
    const attempts = (this.reconnectAttempts.get(connectionKey) ?? 0) + 1;
    this.reconnectAttempts.set(connectionKey, attempts);

    const maxAttempts = config.maxReconnectAttempts ?? 5;
    if (attempts < maxAttempts) {
      // Schedule reconnection attempt
      const reconnectInterval = config.reconnectInterval ?? 5000;
      const delay = reconnectInterval * Math.pow(2, attempts - 1);

      setTimeout(() => {
        this.getConnection(config).catch(() => {
          // Reconnection failed, will be retried on next attempt
        });
      }, delay);
    }
  }

  /**
   * Setup periodic health checks for a connection
   */
  private setupHealthCheck(config: AMQPConfig, connectionKey: string): void {
    // Clear existing health check if any
    const existingInterval = this.healthCheckIntervals.get(connectionKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Setup new health check interval (every 30 seconds)
    const interval = setInterval(async () => {
      const isHealthy = await this.healthCheck(connectionKey);
      if (!isHealthy) {
        const connection = this.connections.get(connectionKey);
        if (connection) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (connection as any).close().catch(() => {
            // Ignore errors
          });
          this.connections.delete(connectionKey);
        }
        this.handleConnectionError(config, connectionKey);
      }
    }, 30000);

    this.healthCheckIntervals.set(connectionKey, interval);
  }

  /**
   * Utility to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
