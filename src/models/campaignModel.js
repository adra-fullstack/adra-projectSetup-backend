const mongoose = require("mongoose");
const { CampaignBin, CandidateBin, AptiCandidateBin } = require("./campaignBinModel");

const campaignSchema = new mongoose.Schema(
    {
        job_title: String,
        interview_date: Date,
        test_time_duration: Number,
        is_enabled: { type: Boolean, default: true },
        question_pattern: {
            type: [
                {
                    question_id: { type: mongoose.Schema.Types.ObjectId, ref: "questions" },
                    question_type: String,
                    difficulty_level: String,
                    questions_count: Number,
                },
            ],
            default: [],
        },
    },
    {
        timestamps: { created_at: true, updated_at: true }, // <-- createdAt fixed at insert
    }
);

campaignSchema.post("findOneAndDelete", async function (doc) {
    if (!doc) return;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const campaignId = doc._id;

        // 1. Save campaign into campaign_bin
        await CampaignBin.create([{ data: doc.toObject(), deletedAt: new Date() }], { session });

        // 2. Move candidates into candidate_bin
        const candidates = await mongoose
            .model("interview_candidates")
            .find({ campaign_id: campaignId })
            .session(session);

        if (candidates.length > 0) {
            await CandidateBin.insertMany(
                candidates.map((c) => ({
                    data: c.toObject(),
                    deletedAt: new Date(),
                })),
                { session }
            );

            // Extract all candidate_ids
            const candidateIds = candidates.map((c) => c._id);

            // 3. Move apti questions into apti_candidate_bin
            const aptis = await mongoose
                .model("interview_candidate_apti_questions")
                .find({ candidate_id: { $in: candidateIds } })
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

            // 4. Delete related docs
            await mongoose.model("interview_candidates").deleteMany({ campaign_id: campaignId }, { session });
            await mongoose
                .model("interview_candidate_apti_questions")
                .deleteMany({ candidate_id: { $in: candidateIds } }, { session });
        }

        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        console.error("Cascade delete failed:", err);
    } finally {
        session.endSession();
    }
});

const CampaignModel = mongoose.model("interview_campaigns", campaignSchema);
module.exports = { CampaignModel };
