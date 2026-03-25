require('dotenv').config({ path: 'd:/TTTN/Back-end/.env' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const Voucher = require('d:/TTTN/Back-end/models/Voucher.js');
  const vouchers = await Voucher.find();
  vouchers.forEach(v => {
      console.log(`Code: ${v.code}`);
      console.log(`isActive: ${v.isActive}`);
      console.log(`startDate: ${v.startDate}`);
      console.log(`endDate: ${v.endDate}`);
      console.log(`now: ${new Date()}`);
      console.log(`isValid virtual: ${v.isValid}`);
      console.log(`minOrderValue: ${v.minOrderValue}`);
      console.log('------------------------');
  });
  process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
