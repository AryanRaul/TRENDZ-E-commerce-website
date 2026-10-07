const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDatabase } = require('../config/database');

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

async function migratePasswordHashes() {
  await connectDatabase();
  const users = await mongoose.connection.collection('users').find({
    $or: [{ password: { $type: 'string' } }, { passwordHash: { $type: 'string' } }]
  }).toArray();
  let updated = 0;
  for (const user of users) {
    const candidate = user.passwordHash || user.password;
    if (!candidate || BCRYPT_HASH.test(candidate)) {
      if (user.password !== undefined) {
        await mongoose.connection.collection('users').updateOne({ _id: user._id }, { $unset: { password: '' } });
        updated += 1;
      }
      continue;
    }
    await mongoose.connection.collection('users').updateOne(
      { _id: user._id },
      { $set: { passwordHash: await bcrypt.hash(candidate, 12) }, $unset: { password: '' } }
    );
    updated += 1;
  }
  console.log(`Password hash migration completed: ${updated} account(s) updated.`);
  await mongoose.disconnect();
}

migratePasswordHashes().catch(async (error) => {
  console.error(`Password hash migration failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
