const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Talao = new Schema({
    
    numeroControle:{
        type: Number,
        required: true
    },    
    numeroInicial:{
        type: Number,
        required: true
    },
    numeroFinal:{
        type: Number,
        required: true
    },
    agencia:{
        type: String,        
        required: true
    },    
    empresa:{
        type: String,
        required: true
    },    
    date:{
        type: Date,
        default: new Date()
    }
})

mongoose.model('taloes',Talao)