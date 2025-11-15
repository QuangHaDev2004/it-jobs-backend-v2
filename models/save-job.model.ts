import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    jobId: String,
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  }
);

const SaveJob = mongoose.model("SaveJob", schema, "save-jobs");

export default SaveJob;
