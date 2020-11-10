var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var locationSchema = new Schema({
    /*tid:Number,
     reqId:Number,
     name:String,
     region_name:String,
     sub_region_name: String,
     request_status: String,
     call_status: String,
     merchant: String,
     me_location: String,
     */
},{strict:false});

module.exports = mongoose.model('tbl_locations', locationSchema);