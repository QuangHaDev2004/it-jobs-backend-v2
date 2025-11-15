import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    companyId: String,
    userId: String,
    rating: Number,
    title: String,
    pros: String,
    cons: String,
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  }
);

const Review = mongoose.model("Review", schema, "reviews");

export default Review;
