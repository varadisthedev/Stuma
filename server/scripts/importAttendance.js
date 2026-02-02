/**
 * FINAL CSV → MongoDB Attendance Import Script
 * -------------------------------------------
 * - Auto creates Teacher, Class, Students
 * - Imports attendance date-wise
 * - Idempotent (safe to re-run)
 * - Highly debuggable via logs
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");

const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");

// ---------------------------------------------
// CONFIG
// ---------------------------------------------
const CSV_FILE_NAME = "b2.csv"; // 👈 your CSV file name
const CLASS_SECTION = "B2";

// ---------------------------------------------
// CONNECT DB
// ---------------------------------------------
console.log("[DB] Connecting to:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI);

// ---------------------------------------------
// HELPERS
// ---------------------------------------------
const parseDate = (dateStr) => {
  const [dd, mm, yy] = dateStr.split("/");
  const year = yy.length === 2 ? "20" + yy : yy;
  return new Date(`${year}-${mm}-${dd}`);
};

// ---------------------------------------------
// SETUP TEACHER & CLASS
// ---------------------------------------------
const getOrCreateTeacherAndClass = async () => {
  let teacher = await Teacher.findOne({ email: "imported.teacher@local" });

  if (!teacher) {
    teacher = await Teacher.create({
      name: "Imported Teacher",
      email: "imported.teacher@local",
      password: "import_dummy_password",
    });
    console.log("[SETUP] Teacher created");
  } else {
    console.log("[SETUP] Teacher found");
  }

  let cls = await Class.findOne({
    subject: "Imported Attendance",
    section: CLASS_SECTION,
    teacher: teacher._id,
  });

  if (!cls) {
    cls = await Class.create({
      subject: "Imported Attendance",
      section: CLASS_SECTION,
      day: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      teacher: teacher._id,
    });
    console.log("[SETUP] Class created");
  } else {
    console.log("[SETUP] Class found");
  }

  return { teacherId: teacher._id, classId: cls._id };
};

// ---------------------------------------------
// MAIN
// ---------------------------------------------
const runImport = async () => {
  const csvPath = path.join(__dirname, CSV_FILE_NAME);

  if (!fs.existsSync(csvPath)) {
    console.error("[ERROR] CSV file not found:", csvPath);
    process.exit(1);
  }

  const rows = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      console.log(`[CSV] Loaded ${rows.length} rows`);

      const { teacherId, classId } = await getOrCreateTeacherAndClass();

      // -----------------------------------------
      // FIND DATE COLUMNS
      // -----------------------------------------
      const dateColumns = Object.keys(rows[0]).filter((key) =>
        key.includes("/"),
      );

      console.log("[CSV] Date columns found:", dateColumns.length);

      // -----------------------------------------
      // CREATE / MAP STUDENTS
      // -----------------------------------------
      const studentsMap = {};

      for (const row of rows) {
        const rollNo = row["Roll No"];
        const name = row["Name"];
        const section = row["Section"];

        let student = await Student.findOne({
          rollNo,
          section,
          teacher: teacherId,
        });

        if (!student) {
          try {
            student = await Student.create({
              name,
              rollNo,
              section,
              teacher: teacherId,
            });
            console.log(`[STUDENT] Created: ${name}`);
          } catch (err) {
            if (err.code === 11000) {
              student = await Student.findOne({
                rollNo,
                teacher: teacherId,
              });
              console.log(`[STUDENT] Exists: ${name}`);
            } else {
              throw err;
            }
          }
        } else {
          console.log(`[STUDENT] Exists: ${name}`);
        }

        studentsMap[rollNo] = student._id;
      }

      console.log("[STUDENT] Mapping complete");

      // -----------------------------------------
      // CREATE ATTENDANCE
      // -----------------------------------------
      for (const dateCol of dateColumns) {
        const records = [];

        rows.forEach((row) => {
          const status = row[dateCol];
          if (!status) return;

          records.push({
            student: studentsMap[row["Roll No"]],
            status: status.toLowerCase(),
          });
        });

        const date = parseDate(dateCol);

        const exists = await Attendance.findOne({
          class: classId,
          date,
        });

        if (exists) {
          console.log(`[SKIP] Attendance already exists for ${dateCol}`);
          continue;
        }

        await Attendance.create({
          class: classId,
          teacher: teacherId,
          date,
          records,
        });

        console.log(`[ATTENDANCE] Saved for ${dateCol}`);
      }

      console.log("✅ IMPORT COMPLETE");
      mongoose.disconnect();
      process.exit(0);
    });
};

runImport();
