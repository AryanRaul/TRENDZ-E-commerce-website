const app = require('./app');
const { connectDatabase } = require('./config/database');
const { port, jwtSecret } = require('./config/env');
const { bootstrapAdmin } = require('./scripts/bootstrapAdmin');

async function start() {
  jwtSecret();
  await connectDatabase();
  await bootstrapAdmin();
  app.listen(port, () => console.log(`TRENDS API listening on port ${port}`));
}

start().catch((error) => {
  console.error(`Unable to start TRENDS API: ${error.message}`);
  process.exit(1);
});
