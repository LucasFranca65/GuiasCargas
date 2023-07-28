const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../Models/User')
const User = mongoose.model('users')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
const bcrypt = require('bcryptjs')
const {eAdmin} = require('../helpers/eAdmin')

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



module.exports = router