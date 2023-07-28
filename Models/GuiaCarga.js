const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GuiaCarga = new Schema({
    numero:{
        type: Number,
        required: true
    },
    origem:{
        type: String,
        required: true
    },
    destino: {
        type: String,
        required: true
    },
    cliente:{
        type: String,
        required: true
    },
    empresa:{
        type: String,
        required: true
    },
    dateEntrada:{
        type: Date
    },
    datePagamento:{
        type: Date
    },
    valor:{
        type: Number,
        required: true
    },
    statusPag:{
        type: String,
        required: true
    },
    baixa:{
        type: Boolean,
        default: false
    },
    date:{
        type: Date,
        required: true
    },
    user:{
        type: String,
        required: true
    }
})

mongoose.model('guiascargas',GuiaCarga)