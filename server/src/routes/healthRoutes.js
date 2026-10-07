const router = require('express').Router();
const { databaseStatus } = require('../config/database');

router.get('/', (req, res) => {
  const database = databaseStatus();
  res.status(database === 'connected' ? 200 : 503).json({ status: database === 'connected' ? 'ok' : 'degraded', database });
});
module.exports = router;
