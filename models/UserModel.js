const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    mail: String,
    mail_type: Number,
    isActive: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
