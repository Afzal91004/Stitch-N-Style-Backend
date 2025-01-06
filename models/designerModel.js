import mongoose from "mongoose";

const designerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isTopDesigner: { type: Boolean, default: false },
  profileImage: {
    type: String,
    default:
      "https://i0.wp.com/toppng.com/uploads/preview/instagram-default-profile-picture-11562973083brycehrmyv.png",
  },
});

const designerModel =
  mongoose.models.designer || mongoose.model("designer", designerSchema);

export default designerModel;
