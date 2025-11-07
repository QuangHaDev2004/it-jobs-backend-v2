import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCompany",
    },
    title: String,
    salaryMin: Number,
    salaryMax: Number,
    position: String,
    workingForm: String,
    technologies: [String],
    description: String,
    images: [String],
    search: String,
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  }
);

const Job = mongoose.model("Job", schema, "jobs");

export default Job;
