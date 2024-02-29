const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Periodo = new Schema({
    nome: {
        type: String,
        required: true
    },
    empresa: {
        type: Schema.Types.ObjectId,
        ref: "empresas",
        required: true
    },
    dateInit: {
        type: Date,
        required: true
    },
    dateFin: {
        type: Date,
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    },
    comissao: {
        type: Boolean,
        default: false
    },
    totalComiss: {
        type: Number,
        default: 0.0
    },
    totalVendas: {
        type: Number,
        default: 0.0
    },
    status: {
        type: String,
        default: "ABERTO"
    },
    mes: {
        type: String,
        required: true
    },
    ano: {
        type: String,
        required: true
    },

})

mongoose.model('periodos', Periodo)