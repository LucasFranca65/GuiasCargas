const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({

    nome: {
        type: String,
        required: true
    },
    login: {
        type: String,
        required: true
    },
    senha: {
        type: String,
        required: true
    },
    agencia: {
        type: Schema.Types.ObjectId,
        ref: "agencias",
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    perfil: {
        type: String,
        require: true
    },
    eAdmin: {
        type: Boolean,
        default: false
    },
    eControle: {
        type: Boolean,
        default: false
    },
    eDigitador: {
        type: Boolean,
        default: false
    }

})

mongoose.model("users", User)