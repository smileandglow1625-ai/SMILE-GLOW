const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    name: String,
    dob: String,
    gender: String,
    phone: String,
    email: String,
    address: String,

    preferred_date: String,
    alternate_date: String,

    preferred_time: String,
    alternate_time: String,

    appointment_type: String,
    reason: String,
  },
  { timestamps: true }
); // createdAt & updatedAt

module.exports = mongoose.model("Appointment", appointmentSchema);
