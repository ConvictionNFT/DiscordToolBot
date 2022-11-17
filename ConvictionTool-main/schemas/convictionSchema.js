const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true,
}

const convictionSchema = mongoose.Schema({
  
  guildId:reqString,
  userId: reqString,
  code: reqString,
  wallet:reqString,
  Nftholdings: {type:Array,default:[]},
  totalHoldings: {type:Number,default:0},
  
  
},{
 timestamps:true,
})

module.exports = mongoose.model('ConvictionWallets', convictionSchema)
