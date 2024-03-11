const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Comissao = new Schema({

    periodo: {
        type: Schema.Types.ObjectId,
        ref: "periodos",
        required: true
    },
    agencia: {
        type: Schema.Types.ObjectId,
        ref: "agencias",
        required: true
    },
    mes: {
        type: String,
        required: true
    },
    ano: {
        type: String,
        required: true
    },
    empresa: {
        type: Schema.Types.ObjectId,
        ref: "empresas",
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    },
    valor: {
        type: Number,
        required: true
    },
    totalVendas: {
        type: Number,
        required: true
    },
    totalValidas: {
        type: Number,
        required: true
    },
    totalCancelado: {
        type: Number,
        required: true
    },
    qtdVendas: {
        type: Number,
        required: true
    },
    qtdValidos: {
        type: Number,
        required: true
    },
    qtdCancelado: {
        type: Number,
        required: true
    },
    indice: {
        type: Number,
        required: true
    }

})

mongoose.model('comissoes', Comissao)