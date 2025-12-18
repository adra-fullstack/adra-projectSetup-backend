const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandling");

// Base schema for bin collections
const baseBinSchema = new mongoose.Schema({
  data: { type: Object, required: true },
  deletedAt: { type: Date, default: Date.now },
});

// Separate bin collections
const CampaignBin = mongoose.model("campaign_bin", baseBinSchema);
const CandidateBin = mongoose.model("interview_candidates_bin", baseBinSchema);
const AptiCandidateBin = mongoose.model("interview_candidate_apti_questions_bin", baseBinSchema);

function normalizeId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return id.toString();
  }
}

/**
 * Restore Campaign + related candidates + apti
 */
CampaignBin.restoreCampaign = async function (campaignId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const idQuery = {
      $or: [
        { "data._id": normalizeId(campaignId) },
        { "data._id": campaignId.toString() }
      ]
    };

    const campaignDoc = await this.findOne(idQuery).session(session);
    if (!campaignDoc) throw new ErrorHandler("Campaign not found in bin", 404);

    const CampaignModel = mongoose.model("interview_campaigns");
    // Preserve timestamps
    await CampaignModel.create(
      [{ ...campaignDoc.data, createdAt: campaignDoc.data.createdAt, updatedAt: campaignDoc.data.updatedAt }],
      { session, timestamps: false }
    );

    const candidateQuery = {
      $or: [
        { "data.campaign_id": normalizeId(campaignId) },
        { "data.campaign_id": campaignId.toString() }
      ]
    };

    const candidateDocs = await CandidateBin.find(candidateQuery).session(session);

    if (candidateDocs.length > 0) {
      const CandidateModel = mongoose.model("interview_candidates");
      const candidateIds = candidateDocs.map((c) => c.data._id);

      await CandidateModel.insertMany(
        candidateDocs.map((c) => ({
          ...c.data,
          createdAt: c.data.createdAt,
          updatedAt: c.data.updatedAt
        })),
        { session, timestamps: false }
      );

      const aptiQuery = {
        $or: [
          { "data.candidate_id": { $in: candidateIds.map(normalizeId) } },
          { "data.candidate_id": { $in: candidateIds.map((id) => id.toString()) } }
        ]
      };

      const aptiDocs = await AptiCandidateBin.find(aptiQuery).session(session);

      if (aptiDocs.length > 0) {
        const AptiModel = mongoose.model("interview_candidate_apti_questions");
        await AptiModel.insertMany(
          aptiDocs.map((a) => ({
            ...a.data,
            createdAt: a.data.createdAt,
            updatedAt: a.data.updatedAt
          })),
          { session, timestamps: false }
        );

        await AptiCandidateBin.deleteMany(
          { _id: { $in: aptiDocs.map((a) => a._id) } },
          { session }
        );
      }

      await CandidateBin.deleteMany(
        { _id: { $in: candidateDocs.map((c) => c._id) } },
        { session }
      );
    }

    await this.deleteOne({ _id: campaignDoc._id }, { session });

    await session.commitTransaction();
    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    console.error("Restore failed:", err.message);
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Restore Candidate + related apti
 */
CandidateBin.restoreCandidate = async function (candidateId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const idQuery = {
      $or: [
        { "data._id": normalizeId(candidateId) },
        { "data._id": candidateId.toString() }
      ]
    };

    const candidateDoc = await this.findOne(idQuery).session(session);
    if (!candidateDoc) throw new ErrorHandler("Candidate not found in bin", 404);

    const CandidateModel = mongoose.model("interview_candidates");
    await CandidateModel.create(
      [{ ...candidateDoc.data, createdAt: candidateDoc.data.createdAt, updatedAt: candidateDoc.data.updatedAt }],
      { session, timestamps: false }
    );

    const aptiQuery = {
      $or: [
        { "data.candidate_id": normalizeId(candidateId) },
        { "data.candidate_id": candidateId.toString() }
      ]
    };

    const aptiDocs = await AptiCandidateBin.find(aptiQuery).session(session);

    if (aptiDocs.length > 0) {
      const AptiModel = mongoose.model("interview_candidate_apti_questions");
      await AptiModel.insertMany(
        aptiDocs.map((a) => ({
          ...a.data,
          createdAt: a.data.createdAt,
          updatedAt: a.data.updatedAt
        })),
        { session, timestamps: false }
      );

      await AptiCandidateBin.deleteMany(
        { _id: { $in: aptiDocs.map((a) => a._id) } },
        { session }
      );
    }

    await this.deleteOne({ _id: candidateDoc._id }, { session });

    await session.commitTransaction();
    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    console.error("Candidate restore failed:", err.message);
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { CampaignBin, CandidateBin, AptiCandidateBin };
