const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const bcrypt = require('bcryptjs')
require('../Models/User')
const User = mongoose.model('users')
require('../Models/System')
const System = mongoose.model('systens')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')
const { lOgado } = require('../helpers/eAdmin')

router.get('/', (req, res) => {
    System.find().then((info) => {
        //console.log(info.length)
        if (info.length == 0) {

            const novoInfo = new System({
                firt_conection: moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                version: "V1.1",
                by: "Lucas Oliveira França",
                nTalao: 0
            })

            novoInfo.save().then(() => {
                req.flash('success_msg', "Esse é seu Primeiro Acesso")
            }).catch((err) => {
                req.flash('error_msg', "Erro ao cadastrar primrio acesso")
                res.redirect('/error')
            })
            const newAgencia = new Agencia({
                numero: "99",
                cidade: "Geral",
                indiceComissao: "0"
            })

            newAgencia.save().then(() => {
                req.flash('success_msg', "Agencia Geral Cadastrada")
            }).catch((err) => {
                req.flash('error_msg', "Erro ao cadastrar primrio acesso")
                res.redirect('/error')
            })
            Agencia.findOne().then((agencia) => {
                const novoUsuario = new User({
                    nome: "Administrador",
                    perfil: "ADMINISTRADOR",
                    login: "admin",
                    senha: "admin",
                    agencia: agencia._id,
                    eAdmin: true
                })

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if (erro) {
                            req.flash('error_msg', "Houve um erro ao criar usuario Administrador")
                            res.redirect('/error')
                        }
                        novoUsuario.senha = hash
                        novoUsuario.save().then(() => {
                            req.flash('success_msg', "Usuario Administrador Cadastrado com sucesso utilise Usuario : admin, Senha: admin no seu primeiro acesso, recomendamos alterar a senha")
                            res.redirect('/validation/login')
                        }).catch((err) => {
                            req.flash('error_msg', "Erro ao criar usuario Administrador")
                            res.redirect('/error')
                        })
                    })
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro Interno", err)
                res.redirect('/error')
            })

        } else {
            if (req.isAuthenticated()) {
                res.redirect('/painel');
            } else {
                res.redirect('/validation/login')
            }
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro Interno", err)
        res.redirect('/error')
    })
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/sobre', lOgado, (req, res) => {
    System.find().then((info) => {
        info[0]["desde"] = moment().format("DD/MM/YYYY HH:mm:ss")
        res.render('sobre', { info })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao carregar informações")
        res.redirect('/painel')
    })

})

module.exports = router