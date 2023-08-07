const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Controle = new Schema({
    periodo:{
        type: String,
        required: true
    },
    agencia:{
        type: String,
        required: true
    },
    cc:{
        type: Number,
        required: true
    },
    ac: {
        type: Number,
        required: true
    },
    pg:{
        type: Number,
        required: true
    },
    total:{
        type: Number,
        required: true
    },
    empresa:{
        type: String,
        required: true
    },
    dateInit:{
        type: Date
    },
    dateFin:{
        type: Date
    },    
    
    date:{
        type: Date,
        default: new Date()
    },
    user:{
        type: String,
        required: true
    }
})

mongoose.model('controles',Controle)