import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    companyName: String,
    email: String,
    password: String,
    phone: String,
    city: String,
    address: String,
    companyModel: String,
    companyEmployees: String,
    workingTime: String,
    workOverTime: String,
    logo: String,
    description: String,
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  }
);

const AccountCompany = mongoose.model(
  "AccountCompany",
  schema,
  "accounts-company"
);

export default AccountCompany;
