const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const {lOgado, eAdmin} = require('../helpers/eAdmin')

//Mongoose Models
require('../Models/System')
const System = mongoose.model('systens')
require ('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Talao')
const Talao = mongoose.model('taloes')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')

//Painel principal das guias
router.get('/',lOgado,(req,res)=>{
    let numCont = 0
    Agencia.find().sort({cidade: 1}).then((agencias)=>{
        System.findOne().then((system)=>{
            Talao.find().populate("agencia").sort({_id: -1}).limit(20).then((taloes)=>{
                for(let i =0; i<taloes.length;i++){
                    taloes[i]['date_exib'] = moment(taloes[i].date).format('DD/MM/YYYY')
                }
                numCont = system.nTalao+1
                res.render('taloes/index_talao',{numCont,agencias, taloes})
            }).catch((err)=>{
                console.log(err)
                req.flash('error_msg',"Erro ao carregar talões para exibição")
                res.redirect('/painel')
            })            
        }).catch((err)=>{
            console.log(err)
            req.flash('error_msg',"Erro ao conferir proxima numeração de talao")
            res.redirect('/painel')
        }) 
    }).catch((err)=>{
            console.log(err)
            req.flash('error_msg',"Erro ao conferir proxima numeração de talao")
            res.redirect('/painel')
        })       
})

router.post('/adicionar',lOgado,(req,res)=>{
    let erro = []
    if(req.body.empresa == "selecione"){
        erro.push({text: "Selecione uma empresa"})
    }
    if(req.body.agencia == "selecione"){
        erro.push({text: "Selecione uma Agencia"})
    }
    if(req.body.numInit > req.body.numFin){
        erro.push({text: "A numeração final não pode ser menor que a inicial"})
    }
    if(erro.length > 0){
        let numCont = 0
        Agencia.find().sort({cidade: 1}).then((agencias)=>{
            System.findOne().then((system)=>{
                numCont = system.nTalao+1
                res.render('taloes/index',{numCont,agencias,erro})
            }).catch((err)=>{
                console.log(err)
                req.flash('error_msg',"Erro ao conferir proxima numeração de talao")
                res.redirect('/painel')
            }) 
        }).catch((err)=>{
            console.log(err)
            req.flash('error_msg',"Erro ao conferir proxima numeração de talao")
            res.redirect('/painel')
        })       
        
    }else{
        let numI = parseInt(req.body.numInit)
        let numF = parseInt(req.body.numFin)
        Talao.find({empresa: req.body.empresa , $or:[{numeroInicial:{$gte: numI, $lt: numF}},{numeroFinal:{$gte: req.body.numInit, $lt: req.body.numFin}}]}).then((taloes)=>{
            if(taloes.length > 0){
                req.flash("error_msg",'já existe talao cadastrado dentro desse intervalo')
                res.redirect('/talao')
            }else{
                System.findOne().then((system)=>{
                    const newTalao = {
                        numeroControle: req.body.numCont,
                        numeroInicial: req.body.numInit,
                        numeroFinal: req.body.numFin,
                        agencia : req.body.agencia,
                        tipo: req.body.tipo
                    }
        
                    new Talao(newTalao).save().then(()=>{
                        req.flash('success_msg',"Talão "+newTalao.numeroControle+" cadastrado com sucesso")
                        //console.log("Talão "+newTalao.numCont+" cadastrado com sucesso")
                        system.nTalao = req.body.numCont
                        system.save().then(()=>{
                        console.log('Número de controle do talao atualizado')   
                        res.redirect('/talao')             
                            }).catch((err)=>{
                                console.log('Erro ao Tentar atualizar numero do talão, '+err)
                                req.flash('error_msg',"Erro ao Tentar atualizar numero do talão")
                                res.redirect('/talao')
                            })
                    }).catch((err)=>{
                        req.flash('error_msg',"Erro ao tentar salvar novo talão"+err)
                        res.redirect('/talao')
                    }) 
                }).catch((err)=>{
                    console.log(err)
                    req.flash('error_msg',"Erro ao conferir proxima numeração de talao")
                    res.redirect('/painel')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao tentar carregar taloes ~> ERRO: "+err)
            res.redirect('/talao')
        })                
    }
})

router.post('/excluir',eAdmin,(req,res)=>{  
        ident = req.body.ident
        var query = {"_id":{$in: ident}}
        Talao.deleteMany(query).then(()=>{
            req.flash('success_msg',"Talões selecionados excluidos com sucesso")
            res.redirect('/talao')
        
        }).catch((err)=>{
            console.log(err)
            req.flash('error_msg',"Erro ao excluir talões selecionados")
            res.redirect('/talao')
        })        
    
})

router.get('/guias',lOgado,(req,res)=>{
    var {ident,offset,page} = req.query    
    const limit = 20
        if(!offset){
            offset=0
        }
        if(offset<0){
            offset=0
        }
        else{
            offset = parseInt(offset)
        }
        if(!page){
            page = 1
        }
        if(page<1){
            page = 1
        }else{
            page = parseInt(page)
        }
        Talao.findById(ident).then((talao)=>{            
            if(talao){
                let numI = talao.numeroInicial
                let numF = talao.numeroFinal
                let empresaT = talao.empresa
                talao["date_exib"] = moment(talao.date).format('DD/MM/YYYY')
                let query = {empresa: empresaT, numero:{$gte: numI, $lt: numF}}
                GuiaCarga.find(query).limit(limit).skip(offset).sort({dateEntrada: 1}).then((dados)=>{
                    console.log(dados)
                    if(dados.length == 0){
                        req.flash('error_msg',"Não foi encontrado guias para o periodo Informado")
                        res.redirect('/talao')
                    }else{
                        var next, prev
                        if(page == 1){
                            prev = "disabled"
                        }
                        if(dados.length<=limit){
                            next = "disabled"
                        }
                        var nextUrl = {
                            ofst: offset+limit,
                            pag: page+1, 
                        }
                        var prevUrl = {
                            ofst: offset-limit,
                            pag: page-1                    
                        }        
                        var i=0
                        while(i < dados.length){                   
                            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                            dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            dados[i]["n"] = (i+1)+offset
                            if(dados[i].baixa==true && dados[i].statusPag != "CANCELADO"){
                                dados[i]["statusBaixa"] = "BAIXADO"
                            }
                            if(dados[i].baixa==true && dados[i].statusPag == "CANCELADO"){
                                dados[i]["statusBaixa"] = "CANCELADO"
                            }
                            else{
                                dados[i]["statusBaixa"] = "PENDENTE"
                            }
                            i++                      
                        }
                         res.render('taloes/guias',{talao,dados,nextUrl,prevUrl,page,prev,next})
                    }        
                           
                }).catch((err)=>{
                    req.flash('error_msg',"Não foi encontrado guias para os parametros no periodo informado" + err)
                    res.redirect('/talao')
                })
               
            }else{
                req.flash('error_msg',"Talão não encontrado")
                res.redirect('/talao')
            }
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao realizar buscar por talao" +err)
            res.redirect('/talao')        
        })
    
})

module.exports = router