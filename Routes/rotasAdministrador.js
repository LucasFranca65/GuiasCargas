const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const {eAdmin} = require('../helpers/eAdmin')
const moment = require('moment')

//Models
require('../Models/User')
const User = mongoose.model('users')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')
require('../Models/Controle')
const Controle = mongoose.model('controles')

//Rotas de Administração de Usuarios
    //Rota Principal
    router.get('/users',eAdmin,(req,res)=>{
        User.find().then((users)=>{
            for(let i = 0; i < users.length; i++){
                if(users[i].eAdmin== true){
                    users[i]['tipoUser']="Administrador"
                }else{
                    users[i]['tipoUser']="Padrão"
                }
            }
            res.render('administracao/adm_users',{users})
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Carregar usuarios "+err)
            res.redirect('/painel')
        })        
    })

    router.post('/users/add_user',eAdmin,(req,res)=>{

        var error = []
        //  Validação de usuario

            if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
                error.push({texto:"Nome Invalido"})
            }
            if(req.body.nome.length < 5){
                error.push({texto:"Nome Muito Curto, minimo 5 caracteres"})
            }
        //  Validação de Login
            if(!req.body.login || typeof req.body.login == undefined || req.body.login == null){
                error.push({texto:"Login Invalido"})
            }
            if(req.body.login.length < 3){
                error.push({texto:"Login Muito Curto minimo 3 caracteres"})
            }
        //  Validação de Setor    
            if(!req.body.setor || typeof req.body.setor == undefined || req.body.setor == null){
                error.push({texto:"Setor Invalido"})
            }
            if(req.body.setor.length < 2){
                error.push({texto:"Nome do Setor Muito Curto, minimo 2 caracteres"})
            }
        //  Validando Senha
            if(!req.body.senha1 || typeof req.body.senha1 == undefined || req.body.senha1 == null){
                error.push({texto:"Senha Invalida"})
            }
            if(req.body.senha1.length < 6){
                error.push({texto:"Senha Muito Curta, minimo 6 caracteres"})
            }
            if(req.body.senha2 != req.body.senha1){
                error.push({texto:"As Senhas não conferem"})
            }    
        //  Verificando erros
            if(error.length > 0){
                User.find().then((users)=>{
                    res.render('administracao/adm_users',{error, users})
                })
                
            }else{            
            //  Verificando se usuario é Administrador 
                if(req.body.eAdmin == "true"){ //Se campo é admin estiver marcado ele grava usuario como administrador
                    //verifica se o usuario já existe
                    User.findOne({login: req.body.login}).then((users)=>{
                        if(users){
                            req.flash('error_msg', "Já existe um usuario com esse login")
                            res.redirect('/administracao/users')
                        }else{                        
                            
                            const novoUsuario = new User({
                                nome : req.body.nome,
                                login: req.body.login,
                                setor: req.body.setor,
                                senha: req.body.senha1,
                                eAdmin: true
                            })
                            bcrypt.genSalt(10, (erro, salt)=>{
                                bcrypt.hash(novoUsuario.senha, salt,(erro,hash)=>{
                                    if(erro){
                                        req.flash('error_msg',"Houve um erro ao salvar usuario Administrador")
                                        res.redirect('/administracao/users/add_user')
                                    }
                                    novoUsuario.senha = hash
                                    novoUsuario.save().then(()=>{
                                        req.flash('success_msg',"Usuario Administrador Cadastrado com sucesso")
                                        res.redirect('/administracao/users')
                                    }).catch((err)=>{
                                        req.flash('error_msg',"Erro ao criar usuario Administrador")
                                        res.redirect('/administracao/users/add_user')
                                    })
                                })
                            })    
                        }    
                    }).catch((err)=>{
                        req.flash('error_msg',"Erro Interno", err)
                        res.redirect('/administracao/users')
                    
                    })   

                }else{ //Se campo é admin não estiver marcado ele grava como usuario comun
                    User.findOne({login: req.body.login}).then((users)=>{
                        if(users){
                            req.flash('error_msg', "Já existe um usuario com esse login")
                            res.redirect('/administracao/users')
                        }else{
                            
                            const novoUsuario = new User({
                                nome : req.body.nome,
                                login: req.body.login,
                                setor: req.body.setor,
                                senha: req.body.senha1
                            })
                            bcrypt.genSalt(10, (erro, salt)=>{
                                bcrypt.hash(novoUsuario.senha,salt,(erro,hash)=>{
                                    if(erro){
                                        req.flash('error_msg',"Houve um erro ao salvar usuario")
                                        res.redirect('/administracao/users')
                                    }
                                    novoUsuario.senha = hash
                                    novoUsuario.save().then(()=>{
                                        req.flash('success_msg',"Usuario Cadastrado com sucesso")
                                        res.redirect('/administracao/users')
                                    }).catch((err)=>{
                                        req.flash('error_msg',"Erro ao criar usuario")
                                        res.redirect('/administracao/users')
                                    })
                                })
                            })    
                        }    
                    }).catch((err)=>{
                        req.flash('error_msg',"Erro Interno", err)
                        res.redirect('administracao/users')
                    
                    })
                }  
            }

    })

    router.post('/users/dell_user',eAdmin,(req,res)=>{
        if(req.body.ident == undefined){
            req.flash('error_msg',"Nenhum Usuario Selecionado para exclusão")
            res.redirect('/administracao/users')
           }else{       
               var query = {"_id":{$in:req.body.ident}}       
                   User.deleteMany(query).then(()=>{
                       req.flash('success_msg',"Usuarios selecionados Excluidos com sucesso")
                       res.redirect('/administracao/users')
                   }).catch((err)=>{
                       req.flash('error_msg',"Não foi encontrados usuarios com os parametros informados")
                       res.redirect('/administracao/users')
                   })
           }
    })
    
    router.get('/users/reset_pass/administracao/:id',eAdmin,(req,res)=>{
        User.findOne({_id: req.params.id}).then((usuario)=>{
            res.render('administracao/admin_resetpass',{usuario})
        }).catch((err)=>{
            req.flash('error_msg',"Não foi encontrado usuario com esses parametros")
            res.redirect('/administracao/users')
        })
    })
    //excluir selecionados
    router.post('/guias/excluir',eAdmin,(req,res)=>{
        if(req.body.ident == undefined){
            req.flash('error_msg',"Nenhuma Guia Selecionado para exclusão")
            res.redirect('/guias')
           }else{       
               var query = {"_id":{$in:req.body.ident}}       
                   GuiaCarga.deleteMany(query).then(()=>{
                       req.flash('success_msg',"Guias selecionadas Excluidas com sucesso")
                       res.redirect('/guias')
                   }).catch((err)=>{
                       req.flash('error_msg',"Não foi encontradas guias para exclusão")
                       res.redirect('/guias')
                   })
           }
    })
    //excuir indicidualmente
    router.get('/guias/exclusao/:id',eAdmin,(req,res)=>{
        if(req.params.id == undefined){
            req.flash('error_msg',"Nenhuma Guia Selecionado para exclusão")
            res.redirect('/guias')
           }else{       
               var query = {"_id": req.params.id}       
                   GuiaCarga.deleteMany(query).then(()=>{
                       req.flash('success_msg',"Guias selecionadas Excluidas com sucesso")
                       res.redirect('/guias')
                   }).catch((err)=>{
                       req.flash('error_msg',"Não foi encontradas guias para exclusão")
                       res.redirect('/guias')
                   })
           }
    })
    //Rotas Administração de agencias
    router.get('/agencias',eAdmin,(req,res)=>{
        Agencia.find().sort({cidade: 1}).then((agencias)=>{
            res.render('administracao/adm_agencias',{agencias})
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Carregar Agencias "+err)
            res.redirect('/painel')
        })        
    })

    router.post('/agencias/add_agencia',eAdmin,(req,res)=>{
        let error = []
        if(!req.body.cidade || typeof req.body.cidade == undefined || req.body.cidade == null){
            error.push({texto:"Nome Invalido"})
        }
        if(!req.body.numero || typeof req.body.numero == undefined || req.body.numero == null){
            error.push({texto:"Numero Invalido"})
        }
        if(req.body.uf == "selecione"){
            error.push({texto:"Selecione um UF Estado"})
        }
        if(req.body.empresa == "selecione"){
            error.push({texto:"Selecione uma empresa"})
        }
        if(error.length > 0){
            Agencia.find().then((agencias)=>{
                res.render('administracao/adm_agencias',{error, agencias})
            })
        }else{
            Agencia.findOne({ $or: [{cidade: req.body.cidade},{numero: req.body.numero}]}).then((agencias)=>{
                if(agencias){
                    req.flash('error_msg',"Numero ou cidade já cadastrada")
                    res.redirect('/administracao/agencias')
                }else{
                    const newAgencia = {
                        numero: req.body.numero,
                        cidade:req.body.cidade,
                        uf: req.body.uf,
                        empresa: req.body.empresa
                    }
                    new Agencia(newAgencia).save().then(()=>{
                        req.flash('success_msg',"Agencia Cadastrada com sucesso")
                        res.redirect('/administracao/agencias')
                    }).catch((err)=>{
                        req.flash('error_msg',"Erro ao Cadastrar Agencia")
                        res.redirect('/administracao/agencias')
                    })        
                }
            })
        }
    })

    router.post('/agencias/excluir',eAdmin,(req,res)=>{
        if(req.body.ident == undefined){
            req.flash('error_msg',"Nenhuma Agencia Selecionado para exclusão")
            res.redirect('/administracao/agencias')
           }else{       
               var query = {"_id":{$in:req.body.ident}}       
                   Agencia.deleteMany(query).then(()=>{
                       req.flash('success_msg',"Agencias selecionadas Excluidas com sucesso")
                       res.redirect('/administracao/agencias')
                   }).catch((err)=>{
                       req.flash('error_msg',"Não foi encontradas agencias para exclusão")
                       res.redirect('/administracao/agencias')
                   })
           }
    })

// Rotas de Controle
    router.get('/controle',eAdmin,(req,res)=>{
        Periodo.find().sort({nome: -1}).limit(12).then((periodos)=>{
            var i=0
            while(i < periodos.length){                   
                periodos[i]["date_init"] = moment(periodos[i].dateInit).format('DD/MM/YYYY')
                periodos[i]["date_fin"] = moment(periodos[i].dateFin).format('DD/MM/YYYY')
                i++
            }
            res.render('administracao/controle',{periodos})
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao tentar localizar periodo" + err)
            res.render('administracao/controle')
        })
    })

    router.post('/controle/gerar',eAdmin,(req,res)=>{
        let reference = (req.body.empresa+"-"+req.body.mes+"-"+req.body.ano)
        
        Periodo.findOne({nome: reference}).then((periodo)=>{
            if(periodo){
                console.log(periodo)
                res.redirect('/administracao/referencia/'+periodo.nome)
            }else{             
                let uDia                
                if(req.body.mes == 2){
                    if((req.body.ano % 4) > 0){                        
                        uDia = 28
                    }else{
                        uDia = 29
                    }
                }else{
                    if(req.body.mes == 4 || req.body.mes == 6|| req.body.mes == 9|| req.body.mes == 11  ){
                        uDia = 30
                    }else{
                        uDia = 31
                    }                    
                }               
                const newPeriodo = {
                    nome: (req.body.empresa+"-"+req.body.mes+"-"+req.body.ano),
                    empresa: req.body.empresa,
                    dateInit: moment(req.body.ano+'-'+req.body.mes+'-01').format("YYYY-MM-DDT00:00:00.SSSZ"),
                    dateFin: moment(req.body.ano+'-'+req.body.mes+'-'+uDia).format("YYYY-MM-DDT23:59:59.SSSZ")
                }
                
                new Periodo(newPeriodo).save().then(()=>{
                    console.log("Periodo "+newPeriodo.nome+" Criado com sucesso")
                    req.flash('success_msg',"Periodo "+newPeriodo.nome+" Criado com sucesso")
                    res.redirect('/administracao/referencia/'+newPeriodo.nome)                    
                }).catch((err)=>{
                    req.flash('error_msg',"Erro ao criar periodo "+err)
                    res.redirect('/administracao/controle')
                })               
                
            }
        })
    })

    router.post('/controle/excluir',eAdmin,(req,res)=>{
        if(req.body.ident == undefined){
            req.flash('error_msg',"Nenhum Perido Selecionado para exclusão")
            res.redirect('/administracao/controle')
           }else{       
               var query = {"_id":{$in:req.body.ident}}       
                    Periodo.find(query).then((periodos)=>{
                        for(var i=0; i<periodos.length; i++){
                            Controle.deleteMany({periodo: periodos[i].nome }).then(()=>{
                                console.log('Guias do periodo '+periodos[i].nome+'excluidas com sucesso')
                            }).catch((err)=>{
                                console.log("Erro ao tentar exluirir controles do periodo: "+err)
                            })
                        }
                        Periodo.deleteMany(query).then(()=>{
                            req.flash('success_msg',"Periodos selecionados excluidos com sucesso, Obs: Todos os controles criados seram excluidos juntamente com o periodo")
                            res.redirect('/administracao/controle')
                        }).catch((err)=>{
                            req.flash('error_msg',"Não foi encontrados periodos para exclusão"+err)
                            res.redirect('/administracao/controle')
                        }) 
                       req.flash('success_msg',"Agencias selecionadas Excluidas com sucesso")
                       res.redirect('/administracao/controle')
                   }).catch((err)=>{
                       req.flash('error_msg',"Não foi encontradas agencias para exclusão" +err)
                       res.redirect('/administracao/controle')
                   })
           }
    })

    router.get('/referencia/:nome',eAdmin,(req,res)=>{
        
        Periodo.findOne({nome: req.params.nome}).then((periodo)=>{
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
                                        console.log(newControle)                                      
                                            new Controle(newControle).save().then(()=>{
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
                        res.redirect('/administracao/referencia/'+periodo.nome)
                        
                    }).catch((err)=>{
                        req.flash('error_msg',"Falha ao localizar agencias" + err)
                        res.redirect('/administracao/controle')  
                    }) 
                }
            }).catch((err)=>{
                req.flash('error_msg',"Falha ao carregar dados do periodo ou dados inexistentes" + err)
                res.redirect('/administracao/controle')
            })                     
        }).catch((err)=>{
            req.flash('error_msg',"Esse Periodo não foi encontrado ou não existe"+err)
            res.redirect('/administracao/controle')
        })
    })    

module.exports = router