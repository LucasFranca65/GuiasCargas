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
require('../Models/BalancoEnc')
const BalancoEnc = mongoose.model('balancoEnc')
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
    const {empresa, mes, ano} = req.query     
    var uDia = 31    
    let error = []
    if(!mes || mes == undefined){
        error.push({text: "Mes informado invalido"})
    }
    if(!ano || ano == undefined){
        error.push({text: "Ano informado invalido"})
    }    
    if(error.length > 0){
        Agencia.find().then((agencias)=>{
            Comissao.find().limit(agencias.length).then((comissoes)=>{
                res.render('comissao/index',{comissoes, agencias, error})
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
        let toralPeriodo = 0 
        Periodo.findOne({nome: reference}).then(async (periodo)=>{                    
            if(periodo){
               await Comissao.find({periodo: reference}).then( async(comissoes)=>{
                    if(comissoes.length > 0){
                        req.flash('error_msg',"Já foram feitos calculos de comissao das agencias para esse periodo")
                        res.redirect('/comissao')
                    }else{
                        var newComissao = {}                
                       await Agencia.find({empresa: empresa}).then( async (agenc)=>{                                               
                            for(let j=0;j<agenc.length;j++){
                            await BalancoEnc.findOne({periodo: reference, agencia: agenc[j].cidade}).then((controle)=>{
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
                                    toralPeriodo = toralPeriodo + newComissao.valor 
                                    console.log(toralPeriodo)
                                    new Comissao(newComissao).save().then(()=>{
                                        console.log("Comissão da agencia "+agenc[j].cidade+" calculada com sucesso")
                                        if(j+1 == agenc.length){
                                            console.log(toralPeriodo)
                                            let editPeriodo = {
                                                comissao: true,
                                                totalComiss: toralPeriodo
                                            }
                                            Periodo.updateOne({nome: reference}, editPeriodo,(error,result)=>{
                                                if(error){
                                                    console.log(error)
                                                    req.flash('error_msg',"Erro ao realizado calculo de comissão")
                                                    res.redirect('/comissao')  
                                                }else{
                                                    console.log("periodos atualizados")
                                                    req.flash('sucess_msg',"Realizado calculo de comissão com sucesso")
                                                    res.redirect('/comissao')  
                                                }                                
                                            })
                                        }  
                                    }).catch((err)=>{
                                        console.log("Erro ao calcular comissao da agencia "+agenc[j].cidade+" ERRO: "+err)                                
                                    })                            
                                }).catch((err)=>{
                                    console.log("Erro ao buscar controles da agencia "+agenc[j].cidade+" Erro: "+err)
                                })                                                                
                            }
                                                                     
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

router.get('/detalhado/:periodo',(req,res)=>{
    Periodo.findOne({nome: req.params.periodo}).then((periodo)=>{
        Comissao.find({periodo: req.params.periodo}).sort({agencia: 1}).then((comissoes)=>{       
            for(let j=0; j<comissoes.length; j++){
                comissoes[j]["dInitExib"] = moment(comissoes[j].dateInit).format('DD/MM/YYYY')
                comissoes[j]["dtFimExib"] = moment(comissoes[j].dateFin).format('DD/MM/YYYY')
                comissoes[j]["totalExib"] = comissoes[j].totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })           
                comissoes[j]["valorExib"] = comissoes[j].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })           
            }
            const user = req.user
            periodo["inicio"] = moment(periodo.dateInit).format('DD/MM/YYYY')
            periodo["final"] = moment(periodo.dateFin).format('DD/MM/YYYY')
            res.render('comissao/detalhado',{comissoes, periodo, user})
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao buscar Comissões do periodo, Err"+err)
            res.redirect('/comissao')
        })
    }).catch((err)=>{
        req.flash('error_msg',"Erro ao buscar Periodo, Erro: "+err)
        res.redirect('/comissao')
    })
})

router.post('/excluir',(req,res)=>{
    const periodos = req.body.periodo
    
    if (periodos.length == 0 || periodos == undefined){
        req.flash('error_msg',"Selecione um periodo para exclusão dos calculos de Comissão")
        res.redirect('/comissao')
    }
    if(periodos.length == 1){
        Comissao.deleteMany({periodo: periodos}).then(()=>{
            Periodo.findOne({nome: periodos}).then((periodo)=>{
                periodo.comissao = false
                periodo.totalComiss = 0 
                periodo.save().then(()=>{
                    req.flash('success_msg',"Periodo "+periodos+" editado com sucesso, Calculo das comissões excluidos")
                    res.redirect('/comissao')
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao salvar edição periodo de calculo "+err)
                    res.redirect('/comissao')
                })            
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao disponibilizar periodo para calculo "+err)
                res.redirect('/comissao')
            })
        }).catch((err)=>{
            req.flash('error_msg',"Não foi possivel excluir Calculos para o periodo Informado ERR: "+err)
            res.redirect('/comissao')
        })
    }else{
        for(let j=0 ; j < periodos.length; j++){
            Comissao.deleteMany({periodo: periodos[j]}).then(()=>{
                Periodo.findOne({nome: periodos[j]}).then((periodo)=>{
                    periodo.comissao = false,
                    periodo.totalComiss = 0 
                    periodo.save().then(()=>{
                        req.flash('success_msg',"Periodo "+periodos[j]+" editado com sucesso")
                    }).catch((err)=>{
                        req.flash('error_msg',"Erro ao salvar edição periodo de calculo "+err)
                    })            
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao disponibilizar periodo para calculo "+err)
                })
            }).catch((err)=>{
                req.flash('error_msg',"Não foi possivel excluir Calculos para o periodo Informado ERR: "+err)
            })   
        }
        rq
        res.redirect('/comissao')
   }    
})

module.exports = router