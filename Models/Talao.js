const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Talao = new Schema({

    numeroControle: {
        type: Number,
        required: true
    },
    numeroInicial: {
        type: Number,
        required: true
    },
    numeroFinal: {
        type: Number,
        required: true
    },
    agencia: {
        type: Schema.Types.ObjectId,
        ref: "agencias",
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    },
    tipo: {
        type: String,
        required: true
    },
    disponiveis: {
        type: Number,
        required: true
    },
    qtdGuias: {
        type: Number,
        required: true
    }
})

mongoose.model('taloes', Talao)