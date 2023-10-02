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
require('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/PContas')
const PContas = mongoose.model('pContas')

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
            res.render('administracao/users/adm_users',{users})
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
    
    router.get('/users/reset_pass/:id',eAdmin,(req,res)=>{
        User.findOne({_id: req.params.id}).then((usuario)=>{
            res.render('administracao/users/admin_resetpass',{usuario})
        }).catch((err)=>{
            req.flash('error_msg',"Não foi encontrado usuario com esses parametros")
            res.redirect('/administracao/users')
        })
    })    

    router.post('/reset_pass/reset',eAdmin,(req,res)=>{
        const {senha1, senha2, user_id} = req.body
        User.findOne({_id: user_id}).then((usuario)=>{
            
            var error = []
    
            if(!senha1 || typeof senha1 == undefined || senha1 == null){
                error.push({texto:"Senha Invalida"})
            }
            if(senha1.length < 6){
                error.push({texto:"Senha Muito Curta, minimo 6 caracteres"})
            }
            if(senha1 != senha2){
                error.push({texto:"As Senhas não conferem"})
            }if(error.length > 0) {
                res.render('administracao/users/admin_resetpass',{usuario,error})
            }else{
                                
                bcrypt.genSalt(10, (erro, salt)=>{
                    bcrypt.hash(senha1, salt,(erro,hash)=>{
                        if(erro){
                            req.flash('error_msg',"Houve um erro Interno "+erro)
                            res.redirect('/administracao/users')
                        }
                        usuario.senha = hash
                        usuario.save().then(()=>{
                            req.flash('success_msg',"Senha alterada com sucesso")
                            res.redirect('/administracao/users')
                        }).catch((err)=>{
                            req.flash('error_msg',"Erro ao alterar senha",err)
                            res.redirect('/administracao/users')
                        })
                    })
                })
            }       
    
        }).catch((err)=>{
        req.flash('erro_msg',"Não foi possivel carregar informações da conta",err)
        res.redirect('/') 
        })
    })

//Rotas para Administrar Guias
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
        Empresa.find().then((empresas)=>{
            Agencia.find().populate("empresa").sort({cidade: 1}).then((agencias)=>{
                res.render('administracao/agencias/index_agencias',{agencias, empresas})
            }).catch((err)=>{
                req.flash('error_msg',"Erro ao Carregar Agencias "+err)
                res.redirect('/painel')
            }) 
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Carregar Agencias "+err)
            res.redirect('/painel')
        }) 
               
    })
    //Rota para cadastrar agencia no banco de dados 
    router.post('/agencias/add_agencia',eAdmin,(req,res)=>{
        const {numero, cidade, uf, empresa, indice} = req.body
        let error = []
        if(!cidade || typeof cidade == undefined || cidade == null){
            error.push({texto:"Nome Invalido"})
        }
        if(!numero || typeof numero == undefined || numero == null){
            error.push({texto:"Numero Invalido"})
        }
        if(uf == "selecione"){
            error.push({texto:"Selecione um UF Estado"})
        }
        if(empresa == "selecione"){
            error.push({texto:"Selecione uma empresa"})
        }
        if(!indice || typeof indice == undefined || indice == null){
            error.push({texto:"Indice informado é invalido"})
        }
        if(error.length > 0){
            Agencia.find().then((agencias)=>{
                res.render('administracao/agencias/index_agencias',{error, agencias})
            })
        }else{
            Agencia.findOne({ $or: [{cidade: req.body.cidade},{numero: req.body.numero}]}).then((agencias)=>{
                if(agencias){
                    req.flash('error_msg',"Numero ou cidade já cadastrada")
                    res.redirect('/administracao/agencias')
                }else{
                    
                    const newAgencia = {
                        numero: numero,
                        cidade: cidade,
                        uf: uf,
                        empresa: empresa,
                        indiceComissao: indice
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
    //Rota que exclui agencias selecionadas
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

//Rotas Administração de Empresas
    router.get('/empresas',eAdmin,(req,res)=>{
        Empresa.find().then((empresas)=>{
            if(empresas.length == 0){
                res.render('administracao/empresas/index_empresas')    
            }else{
                for(let i = 0; i < empresas.length; i++){
                    if(empresas[i].status == true){
                        empresas[i]["statusExib"]="Ativo"
                    }else{
                        empresas[i]["statusExib"]="Inativo"
                    }
                }
                res.render('administracao/empresas/index_empresas',{empresas})
            }            
        }).catch((err)=>{
            req.flash('error_msg',"Erro ao Carregar Empresas "+err)
            res.redirect('/painel')
        })        
    })
    //Rota para cadastrar agencia no banco de dados 
    router.post('/empresas/save',eAdmin,(req,res)=>{
        
        if(req.body.status == "selecione"){
            req.flash('error_msg',"Selecione um status")
            res.redirect('/administracao/empresas')
        }else{
            Empresa.findOne({ $or: [{numero: req.body.numero},{empresa: req.body.empresa}]}).then((empresa)=>{
                if(empresa){
                    req.flash('error_msg',"Empresa Já Cadastrada com esse número ou Nome")
                    res.redirect('/administracao/empresas')
                }else{

                    const newEmpresa = {
                        numero: req.body.numero,
                        empresa: req.body.empresa,
                        status: req.body.status
                    }

                    new Empresa(newEmpresa).save().then(()=>{
                        req.flash('success_msg',"Empresa Cadastrada com sucesso")
                        res.redirect('/administracao/empresas')
                    }).catch((err)=>{
                        req.flash('error_msg',"Erro ao Cadastrar Empresa ERRO: "+err)
                        res.redirect('/administracao/empresas')
                    })        
                }
            })
        }
    })
    //Rota que exclui agencias selecionadas
    router.get('/empresas/excluir/:ident',eAdmin,(req,res)=>{
        const ident = req.params.ident
        if(ident == undefined){
            req.flash('error_msg',"Nenhuma Agencia Selecionado para exclusão")
            res.redirect('/administracao/empresas')
           }else{       
               var query = {"_id":{$in: ident}}
                    GuiaCarga.findOne({empresa: ident}).then((guia)=>{
                        PContas.findOne({empresa: ident}).then((contas)=>{
                            if(guia || contas){
                                req.flash('error_msg',"Existem Prestações de COntas ou Guias de cargas cadastradas para essa empresa, não é possivel excluir, necessario manter o historico")
                                res.redirect('/administracao/empresas')
                            }else{
                                Empresa.deleteMany(query).then(()=>{
                                    req.flash('success_msg',"Empresas selecionadas Excluidas com sucesso")
                                    res.redirect('/administracao/empresas')
                                }).catch((err)=>{
                                    req.flash('error_msg',"Não foi encontradas Empresas para exclusão")
                                    res.redirect('/administracao/empresas')
                                })
                            }
                        
                        })                            
                    })
            }
    })

    
    
module.exports = router