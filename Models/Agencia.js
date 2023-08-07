const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Agencia = new Schema({

    numero:{
        type: Number,
        required: true
    },
    uf:{
        type: String,
        required: true
    },
    cidade:{
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

mongoose.model('agencias',Agencia)