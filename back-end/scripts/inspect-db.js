const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/user.model');
dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select('role authentication.email profile.firstName profile.lastName sellerProfile');
  for (const u of users) {
    console.log(JSON.stringify({
      id: String(u._id),
      role: u.role,
      email: u.authentication?.email,
      name: u.profile?.firstName + ' ' + u.profile?.lastName,
      sellerProfile: u.sellerProfile
    }));
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
