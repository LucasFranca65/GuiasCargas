const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const {lOgado, eAdmin} = require('../helpers/eAdmin')

//Mongoose Models
require('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')


//Painel principal das guias
//Falta fazer Paginação 
router.get('/',eAdmin,(req,res)=>{
    Empresa.find().then((empresas)=>{
        Periodo.find({status:"Fechado"}).populate('empresa').limit(5).sort({_id: -1}).then((periodosFechados)=>{
            Periodo.find({status:"Aberto"}).populate('empresa').limit(5).sort({_id: -1}).then((periodosAbertos)=>{
                if(periodosFechados.length>0){
                    for(let i = 0; i<periodosFechados.length; i++){
                        periodosFechados[i]["dateExibInit"] = moment(periodosFechados[i].dateInit).format('DD/MM/YYYY')
                        periodosFechados[i]["dateExibFin"] = moment(periodosFechados[i].dateFin).format('DD/MM/YYYY')
                    }
                }
                if(periodosAbertos.length > 0){
                    for(let i = 0; i<periodosAbertos.length; i++){
                        periodosAbertos[i]["dateExibInit"] = moment(periodosAbertos[i].dateInit).format('DD/MM/YYYY')
                        periodosAbertos[i]["dateExibFin"] = moment(periodosAbertos[i].dateFin).format('DD/MM/YYYY')
                        
                    }
                }                
                res.render('administracao/periodos/index_periodos',{empresas,periodosAbertos,periodosFechados})
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao Buscar  periodos Abertos para digitação, ERRO: "+err)
                res.redirect('/painel')
            })
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Buscar  periodos encerrados para digitação, ERRO: "+err)
            res.redirect('/painel')
        })        
    }).catch((err)=>{
        req.flash('error_msg',"erro ao buscar empresas, ERRO: "+err)
        res.redirect('/painel')
    })    
})

router.post('/adicionar',eAdmin,(req,res)=>{
    
    if(req.body.empresa == "selecione"){
        req.flash('error_msg',"Selecione uma empresa mês e ano para gerar um periodo de controle")
        res.redirect('/administracao/controle')
    }
    Empresa.findOne({_id: req.body.empresa}).then((empresa)=>{
    var strEmp = empresa.empresa.replace(/\s/g, '')
    const reference = (strEmp+"-"+req.body.mes+"-"+req.body.ano)
        Periodo.findOne({nome: reference}).then((periodo)=>{
            if(periodo){
                req.flash('error_msg',"Já existe um periodo criado para esses dados")
                res.redirect('/administracao/controle') 
            }else{             
                var uDia = 31               
                if(req.body.mes == 2){
                    if((req.body.ano % 4) > 0){                        
                        uDia = 28
                    }else{
                        uDia = 29
                    }
                }
                if(req.body.mes == 4 || req.body.mes == 6|| req.body.mes == 9|| req.body.mes == 11  ){
                    uDia = 30
                }
                                  
            }
            
            const newPeriodo = {
                nome: reference,
                empresa: req.body.empresa,
                dateInit: moment(req.body.ano+'-'+req.body.mes+'-01').format("YYYY-MM-DDT00:00:00.SSSZ"),
                dateFin: moment(req.body.ano+'-'+req.body.mes+'-'+uDia).format("YYYY-MM-DDT23:59:59.SSSZ")
            } 
            new Periodo(newPeriodo).save().then(()=>{
                console.log("Periodo "+reference+" Criado com sucesso")
                req.flash('success_msg',"Periodo "+reference+" Criado com sucesso")
                res.redirect('/periodos')                    
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao criar periodo "+err)
                res.redirect('/periodos')
            })            
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Buscar periodo "+err)
            res.redirect('/periodos')
        })
    }).catch((err)=>{
        req.flash('error_msg',"Erro ao Buscar empresa "+err)
        res.redirect('/periodos')
    })
    
})

router.get('/dadosPeriododeControle/:reference',eAdmin, async(req,res)=>{
    const reference = req.params.reference 
    /*await Periodo.findOne({nome: reference}).then((periodo)=>{
        periodo['inicio'] = moment(periodo.dateInit).format('DD/MM/YYYY')
        periodo['final'] = moment(periodo.dateFin).format('DD/MM/YYYY')
        Controle.find({periodo: periodo.nome }).then((dados)=>{                
            if(dados.length > 0){                    
                for(let i = 0; i < dados.length; i++){
                    dados[i]["pgExib"] = dados[i].pg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    dados[i]["acExib"] = dados[i].ac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    dados[i]["ccExib"] = dados[i].cc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    dados[i]["totalexib"] = dados[i].total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    
                }
                res.render('administracao/dadosPeriodo',{dados,periodo})
            }else{
                Agencia.find({empresa: periodo.empresa}).sort({cidade: 1}).then((agencia)=>{
                    var dateMax = periodo.dateFin
                    var dateMin = periodo.dateInit
                    var empresa = periodo.empresa
                    let totalPg = []
                    let totalAc = []
                    let totalCc = []
                    let total = []                                               
                    for(let j = 0; j<agencia.length; j ++){                               
                         GuiaCarga.find({dateEntrada: {$gte: dateMin, $lt: dateMax}, statusPag: "PAGO", origem: agencia[j].cidade}).then((guiasPg)=>{                                    
                            GuiaCarga.find({dateEntrada: {$gte: dateMin, $lt: dateMax}, empresa: empresa, statusPag: "A COBRAR", origem: agencia[j].cidade}).then((guiasAc)=>{                                        
                                GuiaCarga.find({dateEntrada: {$gte: dateMin, $lt: dateMax}, empresa: empresa, statusPag: "CONTA CORRENTE", origem: agencia[j].cidade}).then((guiasCc)=>{                                            
                                    totalPg[j] = 0
                                    totalAc[j] = 0
                                    totalCc[j] = 0
                                    total[j] = 0
                                    for(let i=0; i<guiasPg.length; i++){
                                        totalPg[j] = totalPg[j] + guiasPg[i].valor
                                    }
                                    for(let i=0; i<guiasAc.length; i++){
                                        totalAc[j] = totalAc[j] + guiasAc[i].valor
                                    }
                                    for(let i=0; i<guiasCc.length; i++){
                                        totalCc[j] = totalCc[j] + guiasCc[i].valor
                                    }                                        
                                    total[j] = totalPg[j] + totalAc[j] + totalCc[j]
                                    console.log("Agencia: "+agencia[j].cidade+" Pago: "+ totalPg[j] +" A Cobrar: "+totalAc[j]+" Conta Corrente: "+totalCc[j] )
                                    const newControle = {
                                        periodo: periodo.nome,
                                        agencia: agencia[j].cidade,
                                        cc: totalCc[j], 
                                        ac: totalAc[j],
                                        pg: totalPg[j],
                                        total: total[j],
                                        empresa: empresa,
                                        dateInit: dateMin,
                                        dateFin: dateMax,
                                        user: req.user.nome
                                    }                                        
                                    //console.log(newControle)                                      
                                    new BalancoEnc(newControle).save().then(()=>{
                                        console.log('Controle da agencia: '+newControle.agencia +' criada com suceso ')
                                    }).catch((err)=>{
                                        console.log('Controle da agencia: '+newControle.agencia + ' erro ao criar '+err)    
                                    })                                   
                                }).catch((err)=>{
                                    console.log("Falha ao localizar Guias CONTA CORRENTE para a agencia "+agencia[j].cidade+"Erro: " + err) 
                                })           
                            }).catch((err)=>{
                                console.log("Falha ao localizar Guias A COBRAR para a agencia "+agencia[j].cidade+"Erro: " + err)  
                            })                      
                        }).catch((err)=>{
                            console.log("Falha ao localizar Guias PAGAS para a agencia "+agencia[j].cidade+"Erro: " + err)                                 
                        }) 
                    }
                }).catch((err)=>{
                    req.flash('error_msg',"Falha ao localizar agencias" + err)
                    res.redirect('/administracao/controle')  
                }) 
                res.redirect('/administracao/dadosPeriododeControle/'+periodo.nome)
            }
        }).catch((err)=>{
            req.flash('error_msg',"Falha ao carregar dados do periodo ou dados inexistentes" + err)
            res.redirect('/administracao/controle')
        })                     
    }).catch((err)=>{
        req.flash('error_msg',"Esse Periodo não foi encontrado ou não existe"+err)
        res.redirect('/administracao/controle')
    })*/
})

router.post('/encerrar',eAdmin,(req,res)=>{
    const ident = req.body.ident
    console.log(ident)
    if(Array.isArray(ident) == true){
        for(let i=0;i<ident.length;i++){
            Periodo.findOne({_id: ident[i]}).then((periodo)=>{
                if(!periodo){
                    console.log("Não Foi Encontrado o "+periodo.nome)
                }else{
                    periodo.status = "Fechado"
                    periodo.save().then(()=>{
                        console.log("Periodo "+periodo.nome+" Editado com sucesso")                        
                    }).catch((err)=>{
                        console.log("Erro ao Salvar Encerramento do periodo "+periodo.nome+", ERRO: "+err)
                        res.redirect('/periodos')
                    })
                }
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao Buscar Periodos, ERRO: "+err)
                res.redirect('/periodos')
            }) 
        }
        req.flash('success_msg','Periodos Selecionados Encerrados com sucesso')
        res.redirect('/periodos')

    }else{
        Periodo.findOne({_id: ident}).then((periodo)=>{
            if(!periodo){
                req.flash('error_msg',"Não foi encontrado Periodo referente ao paramentro ")
                res.redirect('/periodos')
            }else{
                periodo.status = "Fechado"
                periodo.save().then(()=>{
                    req.flash('success_msg','Periodo Selecionado Encerrado com sucesso')
                    res.redirect('/periodos')
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao Salvar Encerramento do periodo, ERRO: "+err)
                    res.redirect('/periodos')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Buscar Periodos, ERRO: "+err)
            res.redirect('/periodos')
        })  
    }    
})

router.post('/reabrir',eAdmin,(req,res)=>{
    const ident = req.body.ident
    console.log(ident)
    if(Array.isArray(ident) == true){
        for(let i=0;i<ident.length;i++){
            Periodo.findOne({_id: ident[i]}).then((periodo)=>{
                if(!periodo){
                    console.log("Não Foi Encontrado o "+periodo.nome)
                }else{
                    periodo.status = "Aberto"
                    periodo.save().then(()=>{
                        console.log("Periodo "+periodo.nome+" Editado com sucesso")                        
                    }).catch((err)=>{
                        console.log("Erro ao tentar Reabrir o periodo "+periodo.nome+", ERRO: "+err)
                        res.redirect('/periodos')
                    })
                }
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao Buscar Periodos, ERRO: "+err)
                res.redirect('/periodos')
            }) 
        }
        req.flash('success_msg','Periodos Selecionados Reabertos com sucesso')
        res.redirect('/periodos')

    }else{
        Periodo.findOne({_id: ident}).then((periodo)=>{
            if(!periodo){
                req.flash('error_msg',"Não foi encontrado Periodo referente ao paramentro ")
                res.redirect('/periodos')
            }else{
                periodo.status = "Aberto"
                periodo.save().then(()=>{
                    req.flash('success_msg','Periodo Selecionado Reaberto com sucesso')
                    res.redirect('/periodos')
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao Salvar Encerramento do periodo, ERRO: "+err)
                    res.redirect('/periodos')
                })
            }
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Buscar Periodos, ERRO: "+err)
            res.redirect('/periodos')
        })  
    }    
})

module.exports = router