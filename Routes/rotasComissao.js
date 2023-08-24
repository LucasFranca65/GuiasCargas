const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const {eAdmin} = require('../helpers/eAdmin')
const moment = require('moment')

//Models

require('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')
require('../Models/Controle')
const Controle = mongoose.model('controles')
require('../Models/Comissao')
const Comissao = mongoose.model('comissoes')

router.get('/',(req,res)=>{
    Agencia.find().then((agencias)=>{
        Periodo.find({comissao: "true"}).then((periodos)=>{
            if(periodos.length>0){
                for(let j=0; j<periodos.length; j++){
                periodos[j]["dInitExib"] = moment(periodos[j].dateInit).format('DD/MM/YYYY')
                periodos[j]["dtFimExib"] = moment(periodos[j].dateFin).format('DD/MM/YYYY')
                periodos[j]["totalExib"] = periodos[j].totalComiss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })           
                }
            }            
            res.render('comissao/index',{periodos, agencias})
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao tentar buscar comissoes", err)
            res.redirect('/painel')
        })
    }).catch((err)=>{
        req.flash('error_msg',"Erro ao tentar buscar agencias", err)
        res.redirect('/painel')
    })
}) 

router.get('/calcular',(req,res)=>{
    const {mes, ano, empresa} = req.query     
    var uDia = 31    
    let erro = []
    if(!mes || typeof mes || mes == undefined){
        erro.push({text: "Mes informado invalido"})
    }
    if(!ano || typeof ano || ano == undefined){
        erro.push({text: "Ano informado invalido"})
    }    
    if(erro.length > 0){
        Agencia.find().then((agencias)=>{
            Comissao.find().limit(agencias.length).then((comissoes)=>{
                res.render('comissao/index',{comissoes, agencias, erro})
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao tentar buscar comissoes", err)
                res.redirect('/painel')
            })        
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao tentar buscar agencias", err)
            res.redirect('/painel')
        }) 
    }else{
        if(mes == 2){
            if((ano % 4) > 0){                        
                uDia = 28
            }else{
                uDia = 29
            }
        }
        if(mes == 4 || mes == 6|| mes == 9|| mes == 11 ){
            uDia = 30
        }
        const dateInit = moment(ano+'-'+mes+'-01').format("YYYY-MM-DDT00:00:00.SSSZ")
        const dateFin = moment(ano+'-'+mes+'-'+uDia).format("YYYY-MM-DDT23:59:59.SSSZ")
        const reference = (empresa+"-"+mes+"-"+ano)
        Periodo.findOne({nome: reference}).then((periodo)=>{        
            if(periodo){
                Comissao.find({periodo: reference}).then((comissoes)=>{
                    if(comissoes.length > 0){
                        req.flash('error_msg',"Já foram feitos calculos de comissao das agencias para esse periodo")
                        res.redirect('/comissoes')
                    }else{
                        var newComissao = {}                
                        Agencia.find({empresa: empresa}).then((agenc)=>{
                            var toralPeriodo = 0                    
                            for(let j=0;j<agenc.length;j++){
                                Controle.findOne({periodo: reference, agencia: agenc[j].cidade}).then((controle)=>{
                                    newComissao = {
                                        periodo: reference,
                                        agencia: agenc[j].cidade,
                                        empresa: empresa,
                                        dateInit: dateInit,
                                        dateFin: dateFin,
                                        indiceComissao: agenc[j].indiceComissao,
                                        totalVendas: controle.total,
                                        valor: ((controle.total * agenc[j].indiceComissao)/100)                                
                                    }
                                    new Comissao(newComissao).save().then(()=>{
                                        console.log("Comissão da agencia "+agenc[j].cidade+" calculada com sucesso")
                                    }).catch((err)=>{
                                        console.log("Erro ao calcular comissao da agencia "+agenc[j].cidade+" ERRO: "+err)                                
                                    })                            
                                }).catch((err)=>{
                                    console.log("Erro ao buscar controles da agencia "+agenc[j].cidade+" Erro: "+err)
                                })
                                toralPeriodo += newComissao.valor   
                            }
                            periodo.comissao = true,
                            periodo.totalComiss = toralPeriodo
                            periodo.save().then(()=>{
                                console.log("periodo atualizado")
                                req.flash('sucess_msg',"Realizado calculo de comissão com sucesso")                                
                            }).catch((err)=>{
                                req.flash('error_msg',"Erro Realizar calculo de comissão"+err)
                                res.redirect('/comissao')                               
                            })
                            res.redirect('/comissao')                    
                        }).catch((err)=>{                    
                            req.flash('error_msg',"Erro ao buscar agencias",err)
                            res.redirect('/comissao')
                        })
                    }   
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao verificar existencia de comissoes, ERRO: "+err)
                    res.redirect('/comissoes')
                }) 
            }else{
                req.flash('error_msg',"O periodo informado não teve a digitação encerrada, necessario encerrar a digitação para calcular comissão")
                res.redirect('/comissao')
            }      
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao buscar o periodo informado "+err)
            res.redirect('/comissao')
        })
    }
})

module.exports = router