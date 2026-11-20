import mongoose from "mongoose";

const postJobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  },
  companyName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: "",
  },
  companyLocation: {
    type: String,
    default: "",
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  salary: {
    type: String,
    required: true,
  },
  skills: {
    type: String,
    required: true,
  },
  education: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  photos: {
    type: [String],
    required: true
  },
  video: {
    type: String,
    required: true
  }
}, { timestamps: true });

const PostJob = mongoose.model("PostJob", postJobSchema);

export default PostJob;
