/**
 * seed.js — Seeds DB with 7 students, 12 past classes, and attendance records
 * Run from server/ directory: node seed.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User       = require('./models/User');
const Student    = require('./models/Student');
const Class      = require('./models/Class');
const Attendance = require('./models/Attendance');

function localDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayName(daysAgo) {
  const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return names[d.getDay()];
}

async function main() {
  const uri = process.env.MONGO_URI;
  console.log('Connecting to:', uri ? uri.substring(0, 40) + '...' : 'MISSING URI');
  if (!uri) { console.error('MONGO_URI not found in .env'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) { console.error('No admin found. Create one via /dev first.'); process.exit(1); }
  console.log('Admin:', admin.name, admin._id.toString());

  const volunteer = await User.findOne({ role: 'volunteer' });
  console.log('Volunteer:', volunteer ? `${volunteer.name} ${volunteer._id}` : 'none (classes unassigned)\n');

  // Wipe existing data owned by this admin
  const [ds, dc, da] = await Promise.all([
    Student.deleteMany({ admin: admin._id }),
    Class.deleteMany({ admin: admin._id }),
    Attendance.deleteMany({ admin: admin._id }),
  ]);
  console.log(`Wiped: ${ds.deletedCount} students, ${dc.deletedCount} classes, ${da.deletedCount} attendance\n`);

  // Students
  const studentData = [
    { name: 'Aditi Gupta',       rollNo: '01' },
    { name: 'Reet Advani',       rollNo: '02' },
    { name: 'Shruti Mandlik',    rollNo: '03' },
    { name: 'Devansh Khodaskar', rollNo: '04' },
    { name: 'Varunvi Sahu',      rollNo: '05' },
    { name: 'Dhruv Tambekar',    rollNo: '06' },
    { name: 'Rani Thatkar',      rollNo: '07' },
  ];
  const students = await Student.insertMany(
    studentData.map(s => ({ ...s, section: '8TH MATH', admin: admin._id }))
  );
  console.log(`Created ${students.length} students`);

  // Past classes across 3 weeks
  const classDefs = [
    { subject: 'Mathematics',  daysAgo: 21, start: '09:00', end: '10:00' },
    { subject: 'Mathematics',  daysAgo: 14, start: '09:00', end: '10:00' },
    { subject: 'Mathematics',  daysAgo:  7, start: '09:00', end: '10:00' },
    { subject: 'Mathematics',  daysAgo:  3, start: '09:00', end: '10:00' },
    { subject: 'Science',      daysAgo: 20, start: '10:30', end: '11:30' },
    { subject: 'Science',      daysAgo: 13, start: '10:30', end: '11:30' },
    { subject: 'Science',      daysAgo:  6, start: '10:30', end: '11:30' },
    { subject: 'Science',      daysAgo:  2, start: '10:30', end: '11:30' },
    { subject: 'English',      daysAgo: 18, start: '12:00', end: '13:00' },
    { subject: 'English',      daysAgo: 11, start: '12:00', end: '13:00' },
    { subject: 'English',      daysAgo:  5, start: '12:00', end: '13:00' },
    { subject: 'History',      daysAgo: 17, start: '14:00', end: '15:00' },
    { subject: 'History',      daysAgo:  9, start: '14:00', end: '15:00' },
    { subject: 'Computer Science', daysAgo: 15, start: '15:30', end: '16:30' },
    { subject: 'Computer Science', daysAgo:  4, start: '15:30', end: '16:30' },
    { subject: 'Geography',    daysAgo: 10, start: '11:00', end: '12:00' },
  ];
  const classes = await Class.insertMany(
    classDefs.map(c => ({
      subject:           c.subject,
      date:              localDateStr(c.daysAgo),
      day:               dayName(c.daysAgo),
      startTime:         c.start,
      endTime:           c.end,
      admin:             admin._id,
      assignedVolunteer: volunteer?._id || undefined,
    }))
  );
  console.log(`Created ${classes.length} past classes\n`);

  // Attendance — realistic patterns (true = absent)
  const patterns = [
    [0,0,0,0,0,0,0], // all present
    [1,0,0,0,0,0,0],
    [0,1,0,0,0,0,1],
    [0,0,1,0,0,1,0],
    [0,0,0,1,0,0,0],
    [1,0,0,0,1,0,0],
    [0,0,0,0,0,0,1],
    [0,1,0,1,0,0,0],
    [0,0,0,0,0,0,0],
    [1,0,1,0,0,0,0],
    [0,0,0,0,1,0,0],
    [0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,1,0,1,0,0],
  ];
  const notes = [
    'Regular session. Students were attentive.',
    'Revision class. Good participation.',
    '',
    'Covered chapters 5-7. Homework assigned.',
    '',
    'Quiz conducted. Results to follow.',
    '',
    'Lab session — all equipment working.',
  ];

  const attendanceDocs = classes.map((cls, i) => ({
    class:   cls._id,
    admin:   admin._id,
    takenBy: volunteer?._id || admin._id,
    date:    new Date(cls.date + 'T10:00:00.000Z'),
    note:    notes[i % notes.length],
    records: students.map((s, j) => ({
      student: s._id,
      status:  patterns[i % patterns.length][j] ? 'absent' : 'present',
    })),
  }));

  await Attendance.insertMany(attendanceDocs);
  console.log(`Marked attendance for all ${attendanceDocs.length} classes\n`);

  // Stats summary
  let totalPresent = 0, totalAbsent = 0;
  attendanceDocs.forEach(a => {
    a.records.forEach(r => { r.status === 'present' ? totalPresent++ : totalAbsent++; });
  });
  console.log('=== SEED COMPLETE ===');
  console.log(`Students    : ${students.length}`);
  console.log(`Classes     : ${classes.length}`);
  console.log(`Present recs: ${totalPresent}`);
  console.log(`Absent recs : ${totalAbsent}`);
  console.log('Refresh the dashboard and analytics now!');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
