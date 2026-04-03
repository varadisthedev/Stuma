require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'admin' });
  const volunteer = await User.findOne({ role: 'volunteer' });

  const now = new Date();
  
  // Format current local date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  // Create a time window: from 1 hour ago to 1 hour from now
  const start = new Date(now.getTime() - 60 * 60 * 1000);
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = days[now.getDay()];

  const newClass = await Class.create({
    subject: 'Active Testing Class',
    date: todayStr,
    day: dayName,
    startTime,
    endTime,
    admin: admin._id,
    assignedVolunteer: volunteer?._id || undefined,
  });

  console.log('✅ Created active class for testing:');
  console.log(`   Subject: ${newClass.subject}`);
  console.log(`   Window: ${newClass.startTime} to ${newClass.endTime} (${newClass.day}, ${newClass.date})`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
