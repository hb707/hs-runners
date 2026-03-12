import { env } from './config/env';
import { ensureDir } from './utils/file.utils';
import app from './app';
import cron from 'node-cron';
import { calculateAllTeamsFines } from './services/fines.service';
import { supabase } from './lib/supabase';

async function initRuntimeDirs(): Promise<void> {
  await ensureDir(env.UPLOADS_DIR);
}

async function assertDatabaseConnection(): Promise<void> {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
}

async function startServer(): Promise<void> {
  await initRuntimeDirs();
  await assertDatabaseConnection();

  // Weekly fine calculation - every Monday at 00:05
  cron.schedule('5 0 * * 1', async () => {
    console.log('[Cron] Calculating weekly fines for all teams...');
    await calculateAllTeamsFines();
    console.log('[Cron] Weekly fines calculated.');
  });

  const port = parseInt(env.PORT, 10);
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
