const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PContas = new Schema({
//Dados do Sumario
    numero:{
        type: Number,
        required: true
    },
    talao:{
        type: Schema.Types.ObjectId,
        ref: "taloes",
        required: true
    },
    periodo:{
        type: Schema.Types.ObjectId,
        ref: "periodos",
        required: true
    }, 
    agencia: {
        type: Schema.Types.ObjectId,
        ref: "agencias",
        required: true
    },   
    empresa:{
        type: Schema.Types.ObjectId,
        ref: "empresas",
        required: true
    },
    dateOperacao:{
        type: Date,
        required: true
    },
//Entradas    
    qtdBilhetes:{
        type: Number,
        default: 0
    },
    totalBilhetes:{
        type: Number,
        default: 0.0
    },
    qtdSeguro:{
        type: Number,
        default: 0
    },    
    totalSeguro:{
        type: Number,
        default: 0.0
    },    
    qtdPedagio:{
        type: Number,
        default: 0
    },    
    totalPedagio:{
        type: Number,
        default: 0.0
    },
    qtdCargas:{
        type: Number,
        default: 0
    },    
    totalCargas:{
        type: Number,
        default: 0.0
    },
    qtdBagagem:{
        type: Number,
        default: 0
    },
    totalBagagem:{
        type: Number,
        default: 0.0
    },     
    totalOutrosEntradas:{
        type: Number,
        default: 0.0
    },
    obsOutrosEntradas:{
        type: String        
    },
    //Saidas
    qtdRequisicao:{
        type: Number,
        default: 0
    },    
    totalRequisicao:{
        type: Number,
        default: 0.0
    },
    qtdCortesia:{
        type: Number,
        default: 0
    },    
    totalCortesia:{
        type: Number,
        default: 0.0
    },
    qtdDevolucao:{
        type: Number,
        default: 0
    },    
    totalDevolucao:{
        type: Number,
        default: 0.0
    },
    qtdDesconto:{
        type: Number,
        default: 0
    },    
    totalDesconto:{
        type: Number,
        default: 0.0
    },
    qtdVale:{
        type: Number,
        default: 0
    },    
    totalVale:{
        type: Number,
        default: 0.0
    },
    totalOutrosSaidas:{
        type: Number,
        default: 0.0
    },
    obsOutrosSaidas:{
        type: String,
        required: true
    },
    //Resumo
    totalEntradas:{
        type: Number,
        default: 0.0
    },
    totalSaidas:{
        type: Number,
        default: 0.0
    },
    liquido:{
        type: Number,
        default: 0.0
    },
    deposito:{
        type: Number,
        default: 0.0
    },
    cheque:{
        type: Number,
        default: 0.0
    },
    rvr:{
        type: Number,
        default: 0.0
    },
    pendencia:{
        type: Boolean,
        default: false
    },
    valorPendente:{
        type: Number,
        default: 0.0
    },

    //Controles e Logs        
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

mongoose.model('pContas',PContas)