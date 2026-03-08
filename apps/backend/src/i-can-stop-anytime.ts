// Entry point. The moment you run this, you've committed.
// There is no step 3. You're already coding on the bus.

import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { openChapter } from './services/dear-diary.js';

// The entry point gets its own chapter because it deserves to be seen
const log = openChapter('startup');

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  // Clean shutdown. Walk away slowly.
  const shutdown = async (signal: string): Promise<void> => {
    log.info(`Received ${signal}. Shutting down gracefully.`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    const address = await app.listen({ port: config.port, host: config.host });
    log.info(`Server listening at ${address}. You could have been reading.`);
  } catch (err) {
    log.fatal(err, 'Failed to start server. This is not fine.');
    process.exit(1);
  }
}

void main();
