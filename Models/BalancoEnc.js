const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BalancoEnc = new Schema({
    periodo:{
        type: String,
        required: true
    },
    agencia:{
        type: Schema.Types.ObjectId,
        ref: "agencias",
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
        type: Schema.Types.ObjectId,
        ref: "empresas",
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
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    }
})

mongoose.model('balancoEnc',BalancoEnc)