require('dotenv').config();
const mongoose = require('mongoose');

async function wipeDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('No MONGO_URI found in .env');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to Database. Wiping collections...');

    await mongoose.connection.db.dropDatabase();
    console.log('Database successfully wiped.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error wiping database:', error);
    process.exit(1);
  }
}

wipeDatabase();
