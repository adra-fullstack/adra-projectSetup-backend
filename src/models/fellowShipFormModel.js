const mongoose = require("mongoose");
const validator = require("validator");
const { DateTime } = require("luxon");

const followship_form = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    age: {
      type: String,
      required: true,
    },
    phone_no: {
      type: String,
      required: true,
    },
    email_id: {
      type: String,
      required: [true, "Please enter email"],
      validate: [validator.isEmail, "Please enter valid email address"],
    },
    gender: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    parent_name: {
      type: String,
      required: true,
    },
    parent_occupation: {
      type: String,
      required: true,
    },
    family_profile: {
      type: {
        marital_status: {
          type: String,
          required: true,
        },
        have_children: {
          type: String,
          required: true,
        },
        have_siblings: {
          type: String,
          required: true,
        },
      },
    },

    academics_education: {
      sslc_school: {
        sslc_school_name: { type: String, required: true },
        sslc_percentage: { type: String, required: true },
      },
      hsc_school: {
        hsc_school_name: { type: String, required: true },
        hsc_percentage: { type: String, required: true },
      },
      college: {
        college_name: { type: String, required: true },
        clg_percentage: { type: String, required: true },
        clg_qualification: { type: String, required: true },
      },
    },

    work_experience: {
      type: String,
      required: true,
    },
    have_laptop: {
      type: String,
      required: true,
    },
    software_interest_reason: {
      type: String,
      required: true,
    },
    reason_for_joining: {
      type: String,
      required: true,
    },
    commitment_balance_plan: {
      type: String,
      required: true,
    },
    remarks: {
      type: String
    },
    signature_path: {
      type: String,
    },
    date: {
      type: String,
      required: true,
      default: () => DateTime.now().toJSDate(),
    },
    profile_photo_path: {
      type: String,
    },
  }
);

const fellowshipModel = mongoose.model("fellowshipform", followship_form);
module.exports = { fellowshipModel };
