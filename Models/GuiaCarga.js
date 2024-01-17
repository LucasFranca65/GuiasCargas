const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GuiaCarga = new Schema({
    numero: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        default: "2"
    },
    periodo: {
        type: Schema.Types.ObjectId,
        ref: "periodos",
        required: true
    },
    talao: {
        type: Schema.Types.ObjectId,
        ref: "taloes",
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
    },
    vencimento: {
        type: Date,
        require: true
    },
    valor: {
        type: Number,
        required: true
    },
    formaPag: {
        type: String,
    },
    condPag: {
        type: String,
        required: true
    },
    n_fatura: {
        type: String
    },
    baixaPag: {
        type: Boolean,
        default: false
    },
    user_conf_pag: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    date: {
        type: Date,
        default: new Date(),
        required: true
    },
    recebedor: {
        type: String
    },
    cpfRecebedor: {
        type: String
    },
    user_conf_entr: {
        type: Schema.Types.ObjectId,
        ref: "users"
    },
    entrega: {
        type: String,
        default: "NA ORIGEM PARA ENVIO"
    },
    baixaEntr: {
        type: Boolean,
        default: false
    },
    dateEntrega: {
        type: Date
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
})

mongoose.model('guiascargas', GuiaCarga)