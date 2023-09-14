const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const {lOgado} = require('../helpers/eAdmin')
require ('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')

//Painel principal das guias

router.get('/',lOgado,(req,res)=>{    
   
    GuiaCarga.find({baixa: false}).populate('origem').populate('destino').populate('empresa').then((guias)=>{
        for(let i = 0 ; i< guias.length; i++){
            guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
            guias[i]["date_pagamento"] = moment(guias[i].datePagamento).format('DD/MM/YYYY')
            guias[i]["valorExib"] = guias[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })    
            if(guias[i].baixa == true){
                guias[i]["statusBaixa"] = "Baixado"  
            }else{
                guias[i]["statusBaixa"] = "Pendente" 
            }                                        
        }
            res.render('painelPrincipal/index',{guias})
    }).catch((err)=>{
        req.flash('error_msg',"Erro ao Buscar guias pendentes")
        res.render('painelPrincipal/index')
    })
})

module.exports = router