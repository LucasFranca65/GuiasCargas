const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Agencia = new Schema({

    numero: {
        type: String,
        required: true
    },
    cidade: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    },
    indiceComissao: {
        type: Number,
        required: true
    },
    emitecte: {
        type: Boolean,
        default: false
    }
})

mongoose.model('agencias', Agencia)