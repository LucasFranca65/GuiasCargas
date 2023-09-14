const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Agencia = new Schema({

    numero:{
        type: Number,
        required: true
    },    
    cidade:{
        type: String,
        required: true
    },    
    empresa:{
        type: Schema.Types.ObjectId,
        ref: "empresas",
        required: true
    },    
    date:{
        type: Date,
        default: new Date()
    },
    indiceComissao:{
        type: Number,
        required: true
    }
})

mongoose.model('agencias',Agencia)