const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Periodo = new Schema({
    nome:{
        type: String,
        required: true
    },
    empresa:{
        type: String,
        required: true
    },
    dateInit:{
        type: Date,
        required: true
    },
    dateFin:{
        type: Date,
        required: true
    },
    date:{
        type: Date,
        default: new Date()
    }
    
})

mongoose.model('periodos',Periodo)