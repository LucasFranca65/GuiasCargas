const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const {lOgado} = require('../helpers/eAdmin')

//Models
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')

//Painel principal das guias
router.get('/',lOgado,(req,res)=>{
    Agencia.find().sort({cidade: 1}).then((agencias)=>{
        GuiaCarga.find().limit(20).sort({date: 1}).then((guias)=>{
            var i=0
            while(i < guias.length){                   
                guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
                guias[i]["date_pagamento"] = moment(guias[i].datePagamento).format('DD/MM/YYYY')
                if(guias[i].baixa==true){
                    guias[i]["statusBaixa"] = "BAIXADO"
                }else{
                    guias[i]["statusBaixa"] = "PENDENTE"
                }
                i++
            }
            res.render('guiasDeCargas/index',{guias,agencias})
        }).catch((err)=>{
            console.log("erros ao caregar guias, ERRO: ",err)
            res.render('guiasDeCargas/index')
        })
        
    }).catch((err)=>{
        console.log("erros ao caregar guias, ERRO: ",err)
        res.render('guiasDeCargas/index')
    })
})

//Rota de adição de guia
router.post('/adicionar',lOgado,(req,res)=>{
    let erro = [] 

    GuiaCarga.findOne({numero: req.body.numero, empresa: req.body.empresa}).then((guia)=>{
        if(guia){
            req.flash('error_msg',"Guia Nº "+guia.numero +"ja existe na empresa "+guia.empresa)
            console.log('guia ja existe, nº' +guia.numero)
            res.redirect('/guias')
        }else{
            if(req.body.origem == "selecione"){
                erro.push({text: "Selecione a Cidade de Oriegem"})
            }
            if(req.body.destino == "selecione"){
                erro.push({text: "Selecione a Cidade de Destino"})
            }
            if(req.body.empresa == "selecione"){
                erro.push({text: "Selecione a Empresa da Guia"})
            }
            if(req.body.statusPag == "selecione"){
                erro.push({text: "Informe o Status do pagamento"})
            }
            if(req.body.origem === req.body.destino){
                erro.push({text: "Cidade de oriegem não pode ser igual a cidade de destino"})
            }
            if(!req.body.numero || typeof req.body.numero == undefined || req.body.numero == null){
                erro.push({text: "Número do conhecimento informado invalido"})
            }
            if(!req.body.cliente || typeof req.body.cliente == undefined || req.body.cliente == null || req.body.cliente.length < 3){
                erro.push({text: "Cliente informado invalido, ou muito curto, minimo 3 caracteres"})
            }
            if(!req.body.dateEntrada || typeof req.body.dateEntrada == undefined || req.body.dateEntrada == null){
                erro.push({text: "Data de entrada informada é  invalida"})
            }            
            if(erro.length > 0){
                GuiaCarga.find().limit(20).sort({date: 1}).then((guias)=>{
                    var i=0
                    while(i < guias.length){                   
                        guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
                        guias[i]["date_pagamento"] = moment(guias[i].datePagamento).format('DD/MM/YYYY')
                        i++
                    }
                    res.render('guiasDeCargas/index',{guias, erro})
                }).catch((err)=>{
                    console.log("erros ao caregar guias, ERRO: ",err)
                    res.render('guiasDeCargas/index')
                })                
            }
            else{
                
            const novaGuia = {
                user: req.user.nome,
                numero: req.body.numero,
                origem: req.body.origem,
                destino: req.body.destino,
                cliente: req.body.cliente,
                empresa: req.body.empresa,
                baixa: req.body.baixa,
                dateEntrada: moment(req.body.dateEntrada).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                datePagamento: moment(req.body.datePagamento).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                valor: req.body.valor,
                statusPag: req.body.statusPagamento,
                date: moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
            }
        
            new GuiaCarga(novaGuia).save().then(()=>{
                req.flash('success_msg',"Guia Nº "+novaGuia.numero+" adicionada com exito")
                console.log('Guia Nº '+novaGuia.numero+" adicionada com exito")
                res.redirect('/guias')
            }).catch((err)=>{
                req.flash('error_msg',"Erro interno rotasGuias 002 "+err)
                console.log('Erro interno rotasGuias 002 '+err)
                res.redirect('/guias')
            })
            }
        }
    }).catch((err)=>{
        req.flash('error_msg',"Erro interno rotasGuias 002 "+err)
        console.log('Erro interno rotasGuias find 001 '+err)
        res.redirect('/guias')
    })
})

//Rotas de edição de guia
    //Selecionando guia
    router.get('/selectEdit/:id',lOgado,(req,res)=>{

        Agencia.find().sort({cidade: 1}).then((agencias)=>{        
            GuiaCarga.findOne({_id: req.params.id}).then((guia)=>{        
                guia["date_entrada"] = moment(guia.dateEntrada).format('YYYY-MM-DD')
                guia["date_pagamento"] = moment(guia.datePagamento).format('YYYY-MM-DD')
                if(guia.baixa == true){
                    guia["check"] = "checked"
                }
                res.render('guiasDeCargas/vizualizar',{guia,agencias})
            }).catch((err)=>{
                req.flash('error_msg',"Guia não encontrada "+err)
                res.redirect('/guias')
            })
        }).catch((err)=>{
            req.flash('error_msg',"Falha ao carregar agencias"+err)
            res.redirect('/guias')
        })
        
        
        
    })
    //Editando Guia
    router.post('/editar',lOgado,(req,res)=>{
        let erro = []        
           
            if(req.body.origem == "selecione"){
                erro.push({text: "Selecione a Cidade de Oriegem"})
            }
            if(req.body.destino == "selecione"){
                 erro.push({text: "Selecione a Cidade de Destino"})
            }
            if(req.body.empresa == "selecione"){
                erro.push({text: "Selecione a Empresa da Guia"})
            }
            if(req.body.statusPag == "selecione"){
                erro.push({text: "Informe o Status do pagamento"})
            }
            if(req.body.origem === req.body.destino){
                erro.push({text: "Cidade de oriegem não pode ser igual a cidade de destino"})
            }                
            if(!req.body.cliente || typeof req.body.cliente == undefined || req.body.cliente == null || req.body.cliente.length < 3){
                erro.push({text: "Cliente informado invalido, ou muito curto, minimo 3 caracteres"})
            }
            if(!req.body.dateEntrada || typeof req.body.dateEntrada == undefined || req.body.dateEntrada == null){
                erro.push({text: "Data de entrada informada é  invalida"})
            }
            if(!req.body.datePagamento || typeof req.body.datePagamento == undefined || req.body.datePagamento == null){
                erro.push({text: "Data de Pagamento iinformada é invalida"})
            }
            if(erro.length > 0){
                Agencia.find().sort({cidade: 1}).then((agencias)=>{
                    GuiaCarga.find().limit(20).sort({date: 1}).then((guias)=>{
                        var i=0
                        while(i < guias.length){                   
                            guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
                            guias[i]["date_pagamento"] = moment(guias[i].datePagamento).format('DD/MM/YYYY')
                            if(guias[i].baixa==true){
                                guias[i]["statusBaixa"] = "BAIXADO"
                            }else{
                                guias[i]["statusBaixa"] = "PENDENTE"
                            }
                            i++
                        }
                        res.render('guiasDeCargas/index',{guias,agencias,erro})
                    }).catch((err)=>{
                        console.log("erros ao caregar guias, ERRO: ",err)
                        res.render('guiasDeCargas/index')
                    })
                    
                }).catch((err)=>{
                    console.log("erros ao caregar guias, ERRO: ",err)
                    res.render('guiasDeCargas/index')
                })                
            }else{
                let baixa                    
                    if(req.body.baixa == "true"){
                        baixa = true
                    }else{
                        baixa = false
                    }
                
                GuiaCarga.findOne({_id: req.body.id}).then((guia)=>{
                    
                    guia.user = req.user.nome,
                    guia.origem = req.body.origem,
                    guia.destino = req.body.destino,
                    guia.cliente = req.body.cliente,
                    guia.empresa = req.body.empresa,
                    guia.baixa = baixa,
                    guia.dateEntrada = moment(req.body.dateEntrada).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                    guia.datePagamento = moment(req.body.datePagamento).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                    guia.valor = req.body.valor,
                    guia.statusPag = req.body.statusPagamento

                guia.save().then(()=>{
                    req.flash('success_msg',"Edição da Guia Realizada com sucesso")
                    res.redirect('/guias/selectEdit/'+guia._id)
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao realizar a Edição da Guia"+ err)
                    res.redirect('/guias/selectEdit/'+guia._id)
                })
                        
                    
                }).catch((err)=>{
                        req.flash('error_msg',"Erro interno rotasGuias 002 "+err)
                        console.log('Erro interno rotasGuias 002 '+err)
                        res.redirect('/guias')
                    })
            }
    })
    //Rotas de buscar guias por numero de conhecimento
    router.post('/buscar',lOgado,(req,res)=>{
        GuiaCarga.findOne({numero: req.body.numero}).then((guia)=>{
            guia["date_entrada"] = moment(guia.dateEntrada).format('YYYY-MM-DD')
            guia["date_pagamento"] = moment(guia.datePagamento).format('YYYY-MM-DD')
            res.render('guiasDeCargas/vizualizar',{guia})              
        }).catch((err)=>{
            req.flash('error_msg',"Guias Nº "+req.body.numero+" não encontrada")
            res.redirect('/guias')
        })
    })    

module.exports = router