const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
const flash = require('connect-flash')
const {lOgado} = require('../helpers/eAdmin')

//Painel principal das guias
router.get('/',lOgado,(req,res)=>{
    GuiaCarga.find({empresa:'REGIONAL', statusPag:'A COBRAR' }).sort({dateEntrada: 1}).then((guiReg)=>{
        GuiaCarga.find({empresa:'JAUA', statusPag:'A COBRAR' }).then((guiJau)=>{
            let i=0
            let totalReg = 0, totalJau = 0
            
            while(i < guiReg.length){                   
                guiReg[i]["date_entrada"] = moment(guiReg[i].dateEntrada).format('DD/MM/YYYY')
                guiReg[i]["date_pagamento"] = moment(guiReg[i].datePagamento).format('DD/MM/YYYY')
                guiReg[i]["valor_exib"] = guiReg[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                totalReg = totalReg + guiReg[i].valor
                i++                
            }
            i=0
            while(i < guiJau.length){                   
                guiJau[i]["date_entrada"] = moment(guiJau[i].dateEntrada).format('DD/MM/YYYY')
                guiJau[i]["date_pagamento"] = moment(guiJau[i].datePagamento).format('DD/MM/YYYY')
                guiJau[i]["valor_exib"]= guiJau[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                totalJau = totalJau + guiJau[i].valor
                i++
            }
            totalReg = totalReg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            totalJau = totalJau.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            res.render('painelPrincipal/index',{guiJau,guiReg, totalJau, totalReg})
        }).catch((err)=>{
            req.flash('error_msg',"Erro interno 004 "+err)
            res.redirect('/error')
        })
    }).catch((err)=>{
        req.flash('error_msg',"Erro interno 003 "+err)
        res.redirect('/error')
    })
        
})

module.exports = router