const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Empresa = new Schema({

    numero:{
        type: Number,
        required: true
    },  
    empresa:{
        type: String,
        required: true
    },    
    status:{
        type : Boolean,
        required: true,
    }
})

mongoose.model('empresas',Empresa)