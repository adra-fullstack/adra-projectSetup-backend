const s3upload = require("../functionPieces/s3upload");
const send_response = require("../functionPieces/send_reposnse");
const catchAsyncError = require("../middlewares/catchAsyncError");
const { fellowshipModel } = require("../models/fellowShipFormModel");
const ErrorHandler = require("../utils/errorHandling");

exports.create_followship_form = catchAsyncError(async (req, res, next) => {
  const formdata = req.body;
  const { image } = req.files;

  const findExistMail = await fellowshipModel.findOne({
    $or: [
      { email_id: formdata?.email_id },
      { phone_no: formdata?.phone_no }
    ]
  })

  if (findExistMail) return next(new ErrorHandler("Email_id or Phone number already exists", 201));
  if (!image) return next(new ErrorHandler("Kindly Upload the Profile Image"));
  if (!formdata.have_children) formdata.have_children = "No";
  if (!formdata.remarks) formdata.remarks = "None";

  const findNullEmptyValues = Object.values(formdata).some(
    (value) => value === "" || value === null || value === undefined
  );

  if (findNullEmptyValues) return next(new ErrorHandler("All feilds are required", 201));

  const {
    marital_status,
    have_children,
    have_siblings,
    sslc_school_name,
    sslc_percentage,
    hsc_school_name,
    hsc_percentage,
    college_name,
    clg_percentage,
    clg_qualification,
  } = formdata;

  const family_profile = {
    marital_status: marital_status,
    have_children: have_children,
    have_siblings: have_siblings,
  };

  const academics_education = {
    sslc_school: {
      sslc_school_name: sslc_school_name,
      sslc_percentage: sslc_percentage,
    },
    hsc_school: {
      hsc_school_name: hsc_school_name,
      hsc_percentage: hsc_percentage,
    },
    college: {
      college_name: college_name,
      clg_percentage: clg_percentage,
      clg_qualification: clg_qualification,
    },
  };

  formdata.family_profile = family_profile;
  formdata.academics_education = academics_education;

  let s3_result = await s3upload('fellowship_candidates', image)
  formdata.profile_photo_path = s3_result[0]?.key || 'none';


  await fellowshipModel.create(formdata);
  send_response(res, 200, true, 0, {}, "Registered Successfully");
});

exports.get_all_fellowship_candidates = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page_number) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const find = {
    _id: 1,
    fullname: 1,
    address: 1,
    phone_no: 1,
    email_id: 1,
    profile_photo_path: 1,
    work_experience: 1,
    date: 1,
  };

  const [candidates, totalCount] = await Promise.all([
    fellowshipModel.find({}, find).skip(skip).limit(limit),
    fellowshipModel.countDocuments(),
  ]);

  const response = {
    candidates,
    totalCount,
  };

  if (candidates.length < 0) {
    return send_response(res, 200, true, 0, "No data found");
  }
  send_response(res, 200, true, 0, response, "Fetched Successfully");
});

exports.get_specific_fellowship_form = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const response = await fellowshipModel.findById({ _id: id });
  if (!response) return send_response(res, 200, true, 201, {}, "No data found");

  send_response(res, 200, true, 0, response, "fetched successfully");
});