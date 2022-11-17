const mongoose = require('mongoose')
require('dotenv').config();

const { MONGOOSE } = process.env;
module.exports = async () => {
  await mongoose.connect(MONGOOSE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  return mongoose
}