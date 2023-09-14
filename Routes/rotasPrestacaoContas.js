const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const {lOgado} = require('../helpers/eAdmin')

//Models
require('../Models/PContas')
const PContas = mongoose.model('pContas')
require ('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')
require('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/Talao')
const Talao = mongoose.model('taloes')

router.get('/',lOgado,(req,res)=>{
    Empresa.find().then((empresas)=>{
        Agencia.find().sort({cidade: 1}).then((agencias)=>{
            PContas.find().populate('empresa').populate('origem').populate('destino').limit(5).sort({date: 1}).then((sumarios)=>{
                
                res.render('prestacaoContas/index_p_contas',({empresas,agencias,sumarios}))
            }).catch((err)=>{
                req.flash('error_msg',"erros ao caregar prestação de contas, ERRO: ",err)
                res.redirect('prestacaoContas/index_p_contas')
            })
            
        }).catch((err)=>{
            console.log("erros ao caregar guias, ERRO: ",err)
            res.render('guiasDeCargas/index_guias')
        })
    }).catch((err)=>{
        console.log("erros ao caregar guias, ERRO: ",err)
        res.render('guiasDeCargas/index_guias')
    })    
})

//Rota de adição de guia
router.post('/adicionar',lOgado,(req,res)=>{
    const {
        numero, empresa,agencia ,dateOperacao,qtdBilhetes,
        totalBilhetes,qtdSeguro,totalSeguro,qtdPedagio,
        totalPedagio,qtdCargas,totalCargas,qtdBagagem,
        totalBagagem,totalOutrosEntradas,obsOutrosEntradas,
        qtdRequisicao,totalRequisicao,qtdCortesia,totalCortesia,
        qtdDevolucao,totalDevolucao,qtdDesconto,totalDesconto,
        qtdVale,totalVale,totalOutrosSaidas,obsOutrosSaidas,
        totalEntradas,totalSaidas,liquido,deposito,cheque,
        rvr,pendencia,valorPendente
    } = req.body

    console.log(numero, empresa,agencia ,dateOperacao,qtdBilhetes,
        totalBilhetes,qtdSeguro,totalSeguro,qtdPedagio,
        totalPedagio,qtdCargas,totalCargas,qtdBagagem,
        totalBagagem,totalOutrosEntradas,obsOutrosEntradas,
        qtdRequisicao,totalRequisicao,qtdCortesia,totalCortesia,
        qtdDevolucao,totalDevolucao,qtdDesconto,totalDesconto,
        qtdVale,totalVale,totalOutrosSaidas,obsOutrosSaidas,
        totalEntradas,totalSaidas,liquido,deposito,cheque,
        rvr,pendencia,valorPendente)
})

module.exports = router