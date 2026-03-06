/**
 * FINAL CSV → MongoDB Import Script
 * --------------------------------
 * - Imports students
 * - Optionally imports attendance (if date columns exist)
 * - Teacher ownership enforced
 * - Section-safe
 * - Idempotent
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
const CSV_FILE_NAME = "PIC.csv";
const CLASS_SECTION = "B2";
const TEACHER_EMAIL = "rasikar@rknec.edu"; // 👈 MUST exist in DB

// ---------------------------------------------
// CONNECT DB
// ---------------------------------------------
console.log("[DB] Connecting to:", process.env.MONGO_URI);
const monogoURI = process.env.MONGO_URI.toString();
mongoose.connect(monogoURI);

// ---------------------------------------------
// HELPERS
// ---------------------------------------------
const parseDate = (dateStr) => {
  const [dd, mm, yy] = dateStr.split("/");
  const year = yy.length === 2 ? `20${yy}` : yy;
  return new Date(`${year}-${mm}-${dd}`);
};

// ---------------------------------------------
// SETUP TEACHER & CLASS
// ---------------------------------------------
const getTeacherAndClass = async () => {
  const teacher = await Teacher.findOne({ email: TEACHER_EMAIL });

  if (!teacher) {
    console.error(
      `[ERROR] Teacher ${TEACHER_EMAIL} not found. Create account first.`,
    );
    process.exit(1);
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

      const { teacherId, classId } = await getTeacherAndClass();

      const dateColumns = Object.keys(rows[0]).filter((key) =>
        key.includes("/"),
      );

      console.log("[CSV] Date columns found:", dateColumns.length);

      if (dateColumns.length === 0) {
        console.log(
          "[INFO] No date columns found. Running student-only import.",
        );
      }

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
          student = await Student.create({
            name,
            rollNo,
            section,
            teacher: teacherId,
          });
          console.log(`[STUDENT] Created: ${name}`);
        } else {
          console.log(`[STUDENT] Exists: ${name}`);
        }

        studentsMap[`${rollNo}-${section}`] = student._id;
      }

      console.log("[STUDENT] Mapping complete");

      // -----------------------------------------
      // CREATE ATTENDANCE (ONLY IF DATES EXIST)
      // -----------------------------------------
      if (dateColumns.length > 0) {
        for (const dateCol of dateColumns) {
          const records = [];

          rows.forEach((row) => {
            const status = row[dateCol];
            if (!status) return;

            records.push({
              student: studentsMap[`${row["Roll No"]}-${row["Section"]}`],
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
      }

      console.log("✅ IMPORT COMPLETE");
      mongoose.disconnect();
      process.exit(0);
    });
};

runImport();
