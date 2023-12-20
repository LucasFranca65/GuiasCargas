const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Cliente = new Schema({

    name_client: {
        type: String,
        required: true
    },
    tipo_doc: {
        type: String,
        required: true
    },
    documento: {
        type: String,
        required: true
    },
    contato: {
        type: String,
        required: true
    },
    perm_fatura: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: new Date()
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    }

})

mongoose.model('clientes', Cliente)