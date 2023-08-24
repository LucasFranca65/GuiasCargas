const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Comissao = new Schema({

    periodo:{
        type: String,
        required: true
    },
    agencia:{
        type: String,
        required: true
    },    
    empresa:{
        type: String,
        required: true
    },    
    dateInit:{
        type: Date,
        required: true
        
    },
    dateFin:{
        type: Date,
        required: true
    },
    date:{
        type: Date,
        default: new Date()
    },
    indiceComissao:{
        type: Number,
        required: true
    },
    valor:{
        type: Number,
        required: true
    },
    totalVendas:{
        type: Number,
        required: true
    },
})

mongoose.model('comissoes',Comissao)