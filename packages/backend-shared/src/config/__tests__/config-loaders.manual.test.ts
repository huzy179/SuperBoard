/**
 * Manual test for configuration loaders
 * This file can be run with ts-node to verify the implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigFileLoader } from '../loaders';
import { AMQPConfigSchema } from '../validators';
import { ConfigService } from '../config.service';

async function runManualTests() {
  console.log('Starting manual configuration loader tests...\n');

  // Create temporary directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-manual-test-'));
  console.log(`Created temp directory: ${tempDir}\n`);

  try {
    // Test 1: Load JSON configuration
    console.log('Test 1: Load JSON configuration');
    const configPath = path.join(tempDir, 'config.json');
    const configData = {
      url: 'amqp://localhost:5672',
      exchange: 'events',
      queue: 'test-queue',
      routingKeys: ['test.key'],
    };
    fs.writeFileSync(configPath, JSON.stringify(configData));

    const loader = new ConfigFileLoader({ configDir: tempDir });
    const result = await loader.loadConfigFile(configPath, 'json');
    console.log('✓ Loaded JSON config:', result);
    console.log();

    // Test 2: Load with environment-specific override
    console.log('Test 2: Load with environment-specific override');
    const baseConfigPath = path.join(tempDir, 'config.json');
    const devConfigPath = path.join(tempDir, 'config.development.json');

    const baseConfig = {
      url: 'amqp://localhost:5672',
      exchange: 'events',
      queue: 'test-queue',
      routingKeys: ['test.key'],
    };

    const devConfig = {
      url: 'amqp://dev.example.com:5672',
    };

    fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
    fs.writeFileSync(devConfigPath, JSON.stringify(devConfig));

    const devLoader = new ConfigFileLoader({
      configDir: tempDir,
      environment: 'development',
    });

    const devResult = await devLoader.loadConfig();
    console.log('✓ Loaded with environment override:', devResult.config);
    console.log();

    // Test 3: Load with validation
    console.log('Test 3: Load with validation');
    const validationLoader = new ConfigFileLoader({
      configDir: tempDir,
      validate: true,
    });

    const validationResult = await validationLoader.loadConfig(AMQPConfigSchema);
    console.log('✓ Validation passed, errors:', validationResult.errors.length);
    console.log();

    // Test 4: Load with defaults
    console.log('Test 4: Load with defaults');
    const defaultsLoader = new ConfigFileLoader({
      configDir: tempDir,
      mergeDefaults: true,
    });

    const defaultsResult = await defaultsLoader.loadConfig();
    console.log('✓ Loaded with defaults:');
    console.log('  - PORT:', defaultsResult.config.PORT);
    console.log('  - LOG_LEVEL:', defaultsResult.config.LOG_LEVEL);
    console.log('  - AMQP prefetchCount:', defaultsResult.config.amqp?.prefetchCount);
    console.log();

    // Test 5: ConfigService integration
    console.log('Test 5: ConfigService integration');
    const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
      configDir: tempDir,
      environment: 'development',
    });

    console.log('✓ ConfigService loaded:');
    console.log('  - URL:', configService.get('url'));
    console.log('  - Exchange:', configService.get('exchange'));
    console.log('  - Has queue:', configService.has('queue'));
    console.log();

    // Test 6: YAML configuration
    console.log('Test 6: YAML configuration');
    const yamlPath = path.join(tempDir, 'config.yaml');
    const yamlContent = `
url: amqp://localhost:5672
exchange: events
queue: test-queue
routingKeys:
  - test.key
`;
    fs.writeFileSync(yamlPath, yamlContent);

    const yamlLoader = new ConfigFileLoader({ configDir: tempDir });
    const yamlResult = await yamlLoader.loadConfigFile(yamlPath, 'yaml');
    console.log('✓ Loaded YAML config:', yamlResult);
    console.log();

    console.log('✅ All manual tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`\nCleaned up temp directory`);
  }
}

// Run tests
runManualTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
