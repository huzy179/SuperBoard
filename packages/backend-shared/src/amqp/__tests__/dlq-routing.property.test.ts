/**
 * Property Test: Dead Letter Queue Routing Consistency
 *
 * **Validates: Requirements 1.4, 4.5**
 *
 * For any failing message, the consumer SHALL route to DLQ and preserve
 * correlation ID + original message metadata.
 */

import fc from 'fast-check';
import type { ConsumeMessage } from 'amqplib';
import { BaseAMQPConsumer } from '../base-consumer';
import type { AMQPConfig, DeadLetterQueueConfig } from '../types';

class FailingConsumer extends BaseAMQPConsumer<Record<string, unknown>> {
  protected async processMessage(): Promise<void> {
    throw new Error('boom');
  }
}

function buildConsumeMessage(params: {
  content: Buffer;
  correlationId?: string;
  routingKey: string;
  exchange: string;
}): ConsumeMessage {
  return {
    content: params.content,
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: params.exchange,
      routingKey: params.routingKey,
       
    } as any,
    properties: {
      correlationId: params.correlationId,
      headers: {},
    },
  } as ConsumeMessage;
}

describe('Property 8: Dead Letter Queue Routing Consistency', () => {
  it('should publish enriched DLQ message with preserved metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.string({ minLength: 1, maxLength: 64 }),
        fc.jsonValue().map((o: unknown) => Buffer.from(JSON.stringify(o), 'utf8')),
        async (exchange: string, queue: string, correlationId: string, content: Buffer) => {
          const config: AMQPConfig = {
            url: 'amqp://localhost:5672',
            exchange,
            queue,
            routingKeys: ['test.*'],
            deadLetterExchange: `${exchange}.dlx`,
            deadLetterQueue: `${queue}.dlq`,
          };

          const deadLetter: DeadLetterQueueConfig = {
            exchange: config.deadLetterExchange!,
            queue: config.deadLetterQueue!,
            routingKey: queue,
          };

          let published: {
            exchange: string;
            routingKey: string;
            content: string;
            options: any;
          } | null = null;
          let acked = false;
          let nacked = false;

          const consumer = new FailingConsumer({
            config,
            serviceName: 'test-service',
            deadLetter,
            parseMessage: () => ({ any: 'payload' }),
            logger: {
              debug: () => {},
              log: () => {},
              warn: () => {},
              error: () => {},
            },
          });

          // Inject stub channel
           
          (consumer as any).channel = {
            publish: (ex: string, rk: string, buf: Buffer, options: any) => {
              published = { exchange: ex, routingKey: rk, content: buf.toString('utf8'), options };
              return true;
            },
            ack: () => {
              acked = true;
            },
            nack: () => {
              nacked = true;
            },
          };

          const msg = buildConsumeMessage({
            content,
            correlationId,
            routingKey: 'test.key',
            exchange,
          });

           
          await (consumer as any).onMessage(msg);

          expect(acked).toBe(true);
          expect(nacked).toBe(false);
          expect(published).not.toBeNull();
          expect(published!.exchange).toBe(deadLetter.exchange);
          expect(published!.routingKey).toBe(deadLetter.routingKey);
          expect(published!.options.correlationId).toBe(correlationId);
          expect(published!.options.headers['x-original-queue']).toBe(queue);

          const parsed = JSON.parse(published!.content) as {
            error: { message: string };
            context: { correlationId: string; originalMessage: { contentBase64: string } };
          };

          expect(parsed.error.message).toBe('boom');
          expect(parsed.context.correlationId).toBe(correlationId);
          expect(parsed.context.originalMessage.contentBase64).toBe(content.toString('base64'));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should nack when DLQ publish fails', async () => {
    const config: AMQPConfig = {
      url: 'amqp://localhost:5672',
      exchange: 'ex',
      queue: 'q',
      routingKeys: ['k'],
      deadLetterExchange: 'dlx',
      deadLetterQueue: 'dlq',
    };

    const consumer = new FailingConsumer({
      config,
      serviceName: 'test-service',
      deadLetter: { exchange: 'dlx', queue: 'dlq', routingKey: 'q' },
      parseMessage: () => ({ any: 'payload' }),
      logger: {
        debug: () => {},
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    let acked = false;
    let nacked = false;

     
    (consumer as any).channel = {
      publish: () => {
        throw new Error('publish failed');
      },
      ack: () => {
        acked = true;
      },
      nack: () => {
        nacked = true;
      },
    };

    const msg = buildConsumeMessage({
      content: Buffer.from('{"x":1}', 'utf8'),
      correlationId: 'corr-1',
      routingKey: 'k',
      exchange: 'ex',
    });

     
    await (consumer as any).onMessage(msg);

    expect(acked).toBe(false);
    expect(nacked).toBe(true);
  });
});
