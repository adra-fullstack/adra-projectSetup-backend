const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ErrorHandler = require("./errorHandling");
let upload;
let limits = {};

// filter the format is valid or not
const fileFilter = (req, file, cb) => {
  let allowedTypes;
  const url = req.route.path.split("/")[1];
  switch (url) {
    case "fellowship_candidate_form":
      allowedTypes = ["jpg", "jpeg", "png"];
      break;

    case "upload_document":
      allowedTypes = ["pdf", "doc", "docx", "jpg", "png"];
      break;

    case "employees":
      allowedTypes = ["jpg", "jpeg", "png", "svg", "webp"];
      break;

    case "updateEmployeePhoto":
      allowedTypes = ["jpg", "jpeg", "png", "svg", "webp"];
      break;

    case "employeeDocuments":
      allowedTypes = [
        "jpg",
        "jpeg",
        "png",
        "svg",
        "webp",
        "pdf",
        "doc",
        "docx",
      ];
      break;

    case "import_attendance":
      allowedTypes = ["xls"];
      break;

    default:
      return cb(new Error("Invalid upload type"), false);
  }

  const ext = path.extname(file.originalname).toLowerCase().split(".")[1];
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    const err = new ErrorHandler("Invalid file type", 201);
    cb(err, false);
  }
};

// create dir and multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    const url = req.route.path.split("/")[1];

    switch (url) {
      case "fellowship_candidate_form":
        uploadPath = path.join(__dirname, "../../uploads");
        break;

      case "upload_document":
        uploadPath = path.join(__dirname, "../../uploads");
        break;

      case "employees":
        uploadPath = path.join(__dirname, "..", "uploads", "employees");
        limits = { fileSize: 10 * 100 * 1024 };
        break;

      case "updateEmployeePhoto":
        uploadPath = path.join(__dirname, "..", "uploads", "employees");
        limits = { fileSize: 10 * 1024 * 1024 };
        break;

      case "employeeDocuments":
        uploadPath = path.join(
          __dirname,
          "..",
          "uploads",
          "employeesDocuments"
        );
        break;

      case "import_attendance":
        uploadPath = path.join(__dirname, "../../uploads");
        break;

      default:
        return cb(new Error("Invalid upload type"), false);
    }
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    } catch (error) {
      new ErrorHandler("Failed to create upload directory", 500);
    }
  },
  limits: {},

  filename: (req, file, cb) => {
    const filename = req?.body?.email_id?.split("@")[0] + path.extname(file.originalname)
    // const uniqueName = `${Date.now()}-${Math.round(
    //   Math.random() * 1e9
    // )}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

// if the format and storage return true it store that in upload
if (storage && fileFilter) {
  upload = multer({ storage, fileFilter, limits });
}

module.exports = upload;
