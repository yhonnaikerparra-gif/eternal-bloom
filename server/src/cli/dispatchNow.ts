import { getDatabase, closeDatabase } from '../db/index.js';
import { Dispatcher } from '../services/dispatcher.js';
import { config } from '../config/index.js';

async function run() {
  console.log('====================================================');
  console.log('🌸 ETERNAL BLOOM — Autonomous CLI Daily Dispatcher');
  console.log(`⏰ Timezone: ${config.timezone} | System Time: ${new Date().toISOString()}`);
  console.log('====================================================');

  getDatabase();

  const isTest = process.argv.includes('--test');
  const channelArg = process.argv.find(arg => arg.startsWith('--channel='));
  const overrideChannel = channelArg ? (channelArg.split('=')[1] as any) : undefined;

  console.log(`Executing daily dispatch (isTest: ${isTest}, channel: ${overrideChannel || 'DEFAULT'})...`);

  try {
    const result = await Dispatcher.executeDailyDispatch({
      isTest,
      overrideChannel
    });

    console.log('\n--- Dispatch Result ---');
    console.log(`Success: ${result.success}`);
    console.log(`Delivery Status: ${result.deliveryStatus}`);
    console.log(`Channel Used: ${result.channelUsed}`);
    console.log(`Date Key: ${result.dateKey}`);
    console.log(`Flower Created: ${result.flowerCreated}`);
    if (result.elementId) console.log(`Visual Element ID: ${result.elementId}`);
    if (result.providerMessageId) console.log(`Provider Message ID: ${result.providerMessageId}`);
    if (result.error) console.log(`Notice / Error: ${result.error}`);
    console.log('------------------------\n');

    closeDatabase();
    process.exit(result.success ? 0 : 1);
  } catch (err: any) {
    console.error('Fatal dispatch error:', err);
    closeDatabase();
    process.exit(1);
  }
}

run();
