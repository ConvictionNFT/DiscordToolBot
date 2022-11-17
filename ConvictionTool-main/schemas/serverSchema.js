const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true,
}

const serverInfo = mongoose.Schema({
  
  guildId:reqString,
  currentMerkle:reqString,
  holderRoles: {type:Array,default:[]},
  snapshotWallets: {type:Array,default:[]},
  contractAddress:reqString,
  
  
  
},{
 timestamps:true,
})

module.exports = mongoose.model('ConvictionServer', serverInfo)
