const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { CandidateBin, AptiCandidateBin } = require("./campaignBinModel");

// ------------------ Schema ------------------
const interviewCandidateSchema = new mongoose.Schema(
    {
        campaign_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "interview_campaigns",
        },
        name: {
            type: String,
            required: [true, "name required"],
        },
        user_role: {
            type: String,
            default: "interview_candidate",
        },
        age: {
            type: Number,
            required: [true, "age required"],
        },
        phoneNumber: {
            type: Number,
            required: [true, "phoneNumber required"],
            validate: {
                validator: function (val) {
                    return val.toString().length === 10;
                },
                message: "Mobile number should be 10 digit.",
            },
        },
        password: String,
        oneTimeLoggedin: {
            type: Boolean,
            default: false,
        },
        email: {
            type: String,
            required: [true, "Please enter email"],
            unique: true,
            validate: [validator.isEmail, "Please enter valid email address"],
        },
        gender: { type: String, required: true },
        address: { type: String, required: true },
        parentName: { type: String, required: true },
        parentOccupation: { type: String, required: true },
        maritalStatus: { type: String, required: true },
        childrens: String,
        siblings: String,
        addressIfAnyCbe: String,
        sslcSchoolName: { type: String, required: true },
        hscSchoolName: { type: String, required: true },
        collegeName: { type: String, required: true },
        sslcMarks: { type: Number, required: true },
        hscMarks: { type: Number, required: true },
        collegeMarks: { type: Number, required: true },
        canditateRole: { type: String, required: true },
        canditateExpType: String,
        candidateQualification: String,
        previousCompanyName: String,
        desigination: String,
        experience: { type: String, required: true },
        currentSalary: { type: String, required: true },
        expectedSalary: { type: String, required: true },
        remarks: String,
        // timestamps will manage createdAt, updatedAt
        token: String,
        resetPasswordToken: String,
        resetPasswordTokenExpire: Date,
        profile_photo_path: String,
        involved_in_tab_switching: { type: Number, default: 2 },
    },
    {
        timestamps: { created_at: true, updated_at: true }, // <-- createdAt fixed at insert
    }
);

// ------------------ Cascade Delete to Bin ------------------
interviewCandidateSchema.post("findOneAndDelete", async function (doc) {
    if (!doc) return;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const candidateId = doc._id;
        console.log("Deleting candidate:", candidateId.toString());

        // 1. Save candidate to CandidateBin (preserve original createdAt)
        await CandidateBin.create(
            [{ data: doc.toObject(), deletedAt: new Date() }],
            { session }
        );

        // 2. Find related apti questions
        const aptis = await mongoose
            .model("interview_candidate_apti_questions")
            .find({ candidate_id: candidateId })
            .session(session);

        if (aptis.length > 0) {
            await AptiCandidateBin.insertMany(
                aptis.map((a) => ({
                    data: a.toObject(),
                    deletedAt: new Date(),
                })),
                { session }
            );
        }

        // 3. Delete related apti docs
        await mongoose
            .model("interview_candidate_apti_questions")
            .deleteMany({ candidate_id: candidateId }, { session });

        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        console.error("Candidate cascade delete failed:", err);
    } finally {
        session.endSession();
    }
});

// ------------------ Password Hashing ------------------
interviewCandidateSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ------------------ Auth Methods ------------------
interviewCandidateSchema.methods.getCandidateJwtToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME,
    });
};

interviewCandidateSchema.methods.getCandidateRefreshJwtToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET);
};

interviewCandidateSchema.methods.isCandidateValidPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

interviewCandidateSchema.methods.getResetToken = function () {
    const token = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;
    return token;
};

// ------------------ Model ------------------
const interviewCandidateModel = mongoose.model("interview_candidates", interviewCandidateSchema);
module.exports = interviewCandidateModel;
