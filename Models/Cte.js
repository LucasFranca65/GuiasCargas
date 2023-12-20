const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Cte = new Schema({
    numero: {
        type: String,
        required: true
    },
    periodo: {
        type: Schema.Types.ObjectId,
        ref: "periodos",
        required: true
    },
    origem: {
        type: Schema.Types.ObjectId,
        ref: "agencias",
        required: true
    },
    destino: {
        type: Schema.Types.ObjectId,
        ref: "agencias",
        required: true
    },
    cliente: {
        type: Schema.Types.ObjectId,
        ref: "clientes",
        required: true
    },
    empresa: {
        type: Schema.Types.ObjectId,
        ref: "empresas",
        required: true
    },
    dateEntrada: {
        type: Date,
        required: true
    },
    datePagamento: {
        type: Date,
        require: true
    },
    valor: {
        type: Number,
        required: true
    },
    formaPag: {
        type: String,
        required: true
    },
    n_fatura: {
        type: String
    },
    baixa: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: new Date(),
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
        required: true
    }
})

mongoose.model('ctes', Cte)