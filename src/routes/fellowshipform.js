const express = require("express");
const route = express.Router();
const multer = require('multer');
const upload = multer();

const {
    create_followship_form, get_all_fellowship_candidates,
    get_specific_fellowship_form

} = require("../controllers/fellowshipformController");

route.post("/fellowship_candidate_form", upload.fields([{ name: "image", maxCount: 1 }]), create_followship_form);

route.get("/fellowship_candidates", get_all_fellowship_candidates)
    .get("/fellowship_candidates/:id", get_specific_fellowship_form)


module.exports = route;