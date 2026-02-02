require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Teacher = require("../models/Teacher");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // yeah i just leaked logins creds
  const email = "rasikar@rknec.edu";
  const password = "rasika123";

  const existing = await Teacher.findOne({ email });
  if (existing) {
    console.log("Teacher already exists");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await Teacher.create({
    name: "Imported Teacher",
    email,
    password: hashedPassword,
  });

  console.log("Teacher created with hashed password");
  process.exit(0);
})();
