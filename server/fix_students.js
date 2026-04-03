const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  try {
    await db.collection('students').dropIndex('admin_1_rollNo_1');
    console.log('Dropped old index');
  } catch (e) {
    console.log('Index drop err (maybe not exist):', e.message);
  }
  const students = await db.collection('students').find().toArray();
  for(const s of students) {
    if(s.section) {
      await db.collection('students').updateOne(
        { _id: s._id },
        { $set: { section: s.section.trim().toUpperCase() } }
      );
    }
  }
  console.log('Fixed old data');
  process.exit(0);
}

fix();
