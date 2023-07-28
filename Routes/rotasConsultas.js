const express = require('express')
const { default: mongoose } = require('mongoose')
const router = express.Router()
require('../Models/User')
const User = mongoose.model('users')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
const moment = require('moment')
const {lOgado} = require('../helpers/eAdmin')


router.get('/por_empresa',lOgado,(req,res)=>{
    res.render('consultasRelatorios/porEmpresa')
})
router.post('/por_empresa/pesquisar',lOgado,(req,res)=>{
       
    var dateMax = moment(req.body.dateMax).format("YYYY-MM-DDT23:59:59.SSSZ")
    var dateMin = moment(req.body.dateMin).format("YYYY-MM-DDT00:00:00.SSSZ")
    if(dateMax < dateMin){
        req.flash('error_msg',"A data inicial não pode ser menor que a final")
        res.redirect('/consulta/por_empresa')
    }else{
        let query = {dateEntrada: {$gte: dateMin, $lt: dateMax}, empresa: req.body.empresa}
        GuiaCarga.find(query).sort({dateEntrada: 1}).then((dados)=>{
            if(dados.length == 0){
                req.flash('error_msg',"Não foi encontrado guias para o periodo Informado")
                res.redirect('/consultas/por_empresa')
            }else{
                var i=0
                while(i < dados.length){                   
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if(dados[i].baixa==true){
                        dados[i]["statusBaixa"] = "BAIXADO"
                    }else{
                        dados[i]["statusBaixa"] = "PENDENTE"
                    }
                    i++                      
                }
                 res.render('consultasRelatorios/porEmpresa',{dados})
            }        
                   
        }).catch((err)=>{
            req.flash('error_msg',"Não foi encontrado guias para os parametros no periodo informado")
            res.redirect('/consultas/por_empresa')
        })
    }
})

router.get('/por_usuario',lOgado,(req,res)=>{
    User.find().then((users)=>{
        res.render('consultasRelatorios/porUsuario',{users})
    }).catch((err)=>{
        req.flash('error_msg',"Erro interno ao carregar usuarios")
        res.redirect('/painel')
    })
    
})
router.post('/por_usuario/pesquisar',lOgado,(req,res)=>{
       
    var dateMax = moment(req.body.dateMax).format("YYYY-MM-DDT23:59:59.SSSZ")
    var dateMin = moment(req.body.dateMin).format("YYYY-MM-DDT00:00:00.SSSZ")
    if(dateMax < dateMin){
        req.flash('error_msg',"A data inicial não pode ser menor que a final")
        res.redirect('/consulta/por_empresa')
    }else{
        let query = {dateEntrada: {$gte: dateMin, $lt: dateMax}, user: req.body.user}
        GuiaCarga.find(query).sort({dateEntrada: 1}).then((dados)=>{
            if(dados.length == 0){
                req.flash('error_msg',"Não foi encontrado guias para o periodo Informado")
                res.redirect('/consultas/por_empresa')
            }else{
                var i=0
                while(i < dados.length){                   
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if(dados[i].baixa==true){
                        dados[i]["statusBaixa"] = "BAIXADO"
                    }else{
                        dados[i]["statusBaixa"] = "PENDENTE"
                    }
                    i++                      
                }
                 res.render('consultasRelatorios/porUsuario',{dados})
            }        
                   
        }).catch((err)=>{
            req.flash('error_msg',"Não foi encontrado guias para os parametros no periodo informado")
            res.redirect('/consultas/por_usuario')
        })
    }
})

router.get('/comissao',lOgado,(req,res)=>{
    
    res.render('consultasRelatorios/comissao')   
    
})


module.exports = router