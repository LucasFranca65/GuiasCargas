const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { eAdmin, lOgado } = require('../helpers/eAdmin')
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
require('../Models/Cliente')
const Cliente = mongoose.model('clientes')

//Rotas de Administração de Usuarios
//Rota Principal
router.get('/users', eAdmin, (req, res) => {
    User.find().populate('agencia').then((users) => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {
            for (let i = 0; i < users.length; i++) {
                if (users[i].eAdmin == true) {
                    users[i]['tipoUser'] = "Administrador"
                } else {
                    users[i]['tipoUser'] = "Padrão"
                }
            }
            res.render('administracao/users/adm_users', { users, agencias })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Carregar agencias " + err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Carregar usuarios " + err)
        res.redirect('/painel')
    })
})

router.post('/users/add_user', eAdmin, (req, res) => {
    const { nome, login, agencia, senha1, senha2, eAdmin } = req.body

    var error = []
    //  Validação de usuario

    if (!nome || typeof nome == undefined || nome == null) {
        error.push({ texto: "Nome Invalido" })
    }
    if (nome.length < 5) {
        error.push({ texto: "Nome Muito Curto, minimo 5 caracteres" })
    }
    //  Validação de Login
    if (!login || typeof login == undefined || login == null) {
        error.push({ texto: "Login Invalido" })
    }
    if (login.length < 3) {
        error.push({ texto: "Login Muito Curto minimo 3 caracteres" })
    }
    if (agencia == "selecione") {
        error.push({ texto: "Selecione uma agencia" })
    }
    //  Validando Senha
    if (!senha1 || typeof senha1 == undefined || senha1 == null) {
        error.push({ texto: "Senha Invalida" })
    }
    if (senha1.length < 6) {
        error.push({ texto: "Senha Muito Curta, minimo 6 caracteres" })
    }
    if (senha2 != req.body.senha1) {
        error.push({ texto: "As Senhas não conferem" })
    }
    //  Verificando erros
    if (error.length > 0) {
        User.find().populate('agencia').then((users) => {
            Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                for (let i = 0; i < users.length; i++) {
                    if (users[i].eAdmin == true) {
                        users[i]['tipoUser'] = "Administrador"
                    } else {
                        users[i]['tipoUser'] = "Padrão"
                    }
                }
                res.render('administracao/users/adm_users', { users, agencias, error })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Carregar agencias " + err)
                res.redirect('/painel')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Carregar usuarios " + err)
            res.redirect('/painel')
        })

    } else {
        //  Verificando se usuario é Administrador 
        if (eAdmin == "true") { //Se campo é admin estiver marcado ele grava usuario como administrador
            //verifica se o usuario já existe
            User.findOne({ login: login }).then((users) => {
                if (users) {
                    req.flash('error_msg', "Já existe um usuario com esse login")
                    res.redirect('/administracao/users')
                } else {

                    const novoUsuario = new User({
                        nome: nome,
                        login: login,
                        senha: senha1,
                        agencia: agencia,
                        eAdmin: true
                    })
                    bcrypt.genSalt(10, (erro, salt) => {
                        bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                            if (erro) {
                                req.flash('error_msg', "Houve um erro ao salvar usuario Administrador")
                                res.redirect('/administracao/users/add_user')
                            }
                            novoUsuario.senha = hash
                            novoUsuario.save().then(() => {
                                req.flash('success_msg', "Usuario Administrador Cadastrado com sucesso")
                                res.redirect('/administracao/users')
                            }).catch((err) => {
                                req.flash('error_msg', "Erro ao criar usuario Administrador")
                                res.redirect('/administracao/users/add_user')
                            })
                        })
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro Interno", err)
                res.redirect('/administracao/users')
            })

        } else { //Se campo é admin não estiver marcado ele grava como usuario comun
            User.findOne({ login: login }).then((users) => {
                if (users) {
                    req.flash('error_msg', "Já existe um usuario com esse login")
                    res.redirect('/administracao/users')
                } else {

                    const novoUsuario = new User({
                        nome: nome,
                        login: login,
                        senha: senha1,
                        agencia: agencia
                    })
                    bcrypt.genSalt(10, (erro, salt) => {
                        bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                            if (erro) {
                                req.flash('error_msg', "Houve um erro ao salvar usuario")
                                res.redirect('/administracao/users')
                            }
                            novoUsuario.senha = hash
                            novoUsuario.save().then(() => {
                                req.flash('success_msg', "Usuario Cadastrado com sucesso")
                                res.redirect('/administracao/users')
                            }).catch((err) => {
                                req.flash('error_msg', "Erro ao criar usuario")
                                res.redirect('/administracao/users')
                            })
                        })
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro Interno", err)
                res.redirect('/administracao/users')

            })
        }
    }

})

//Fim rota adição

router.post('/users/dell_user', eAdmin, (req, res) => {
    if (req.body.ident == undefined) {
        req.flash('error_msg', "Nenhum Usuario Selecionado para exclusão")
        res.redirect('/administracao/users')
    } else {
        var query = { "_id": { $in: req.body.ident } }
        User.deleteMany(query).then(() => {
            req.flash('success_msg', "Usuarios selecionados Excluidos com sucesso")
            res.redirect('/administracao/users')
        }).catch((err) => {
            req.flash('error_msg', "Não foi encontrados usuarios com os parametros informados")
            res.redirect('/administracao/users')
        })
    }
})

router.get('/users/reset_pass/:id', eAdmin, (req, res) => {
    User.findOne({ _id: req.params.id }).then((usuario) => {
        res.render('administracao/users/admin_resetpass', { usuario })
    }).catch((err) => {
        req.flash('error_msg', "Não foi encontrado usuario com esses parametros")
        res.redirect('/administracao/users')
    })
})

router.post('/reset_pass/reset', eAdmin, (req, res) => {
    const { senha1, senha2, user_id } = req.body
    User.findOne({ _id: user_id }).then((usuario) => {

        var error = []

        if (!senha1 || typeof senha1 == undefined || senha1 == null) {
            error.push({ texto: "Senha Invalida" })
        }
        if (senha1.length < 6) {
            error.push({ texto: "Senha Muito Curta, minimo 6 caracteres" })
        }
        if (senha1 != senha2) {
            error.push({ texto: "As Senhas não conferem" })
        } if (error.length > 0) {
            res.render('administracao/users/admin_resetpass', { usuario, error })
        } else {

            bcrypt.genSalt(10, (erro, salt) => {
                bcrypt.hash(senha1, salt, (erro, hash) => {
                    if (erro) {
                        req.flash('error_msg', "Houve um erro Interno " + erro)
                        res.redirect('/administracao/users')
                    }
                    usuario.senha = hash
                    usuario.save().then(() => {
                        req.flash('success_msg', "Senha alterada com sucesso")
                        res.redirect('/administracao/users')
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao alterar senha", err)
                        res.redirect('/administracao/users')
                    })
                })
            })
        }

    }).catch((err) => {
        req.flash('erro_msg', "Não foi possivel carregar informações da conta", err)
        res.redirect('/')
    })
})

//Rotas para Administrar Guias
//excluir selecionados
router.post('/guias/excluir', eAdmin, (req, res) => {
    if (req.body.ident == undefined) {
        req.flash('error_msg', "Nenhuma Guia Selecionado para exclusão")
        res.redirect('/guias')
    } else {
        var query = { "_id": { $in: req.body.ident } }
        GuiaCarga.deleteMany(query).then(() => {
            req.flash('success_msg', "Guias selecionadas Excluidas com sucesso")
            res.redirect('/guias')
        }).catch((err) => {
            req.flash('error_msg', "Não foi encontradas guias para exclusão")
            res.redirect('/guias')
        })
    }
})
//excuir indicidualmente
router.get('/guias/exclusao/:id', eAdmin, (req, res) => {
    if (req.params.id == undefined) {
        req.flash('error_msg', "Nenhuma Guia Selecionado para exclusão")
        res.redirect('/guias')
    } else {
        var query = { "_id": req.params.id }
        GuiaCarga.deleteMany(query).then(() => {
            req.flash('success_msg', "Guias selecionadas Excluidas com sucesso")
            res.redirect('/guias')
        }).catch((err) => {
            req.flash('error_msg', "Não foi encontradas guias para exclusão")
            res.redirect('/guias')
        })
    }
})

//Rotas Administração de agencias
router.get('/agencias', eAdmin, (req, res) => {

    Agencia.find().sort({ cidade: 1 }).then((agencias) => {
        for (let i = 0; i < agencias.length; i++) {
            if (agencias[i].emitecte == true || agencias[i].emitecte == "true") {
                agencias[i]['emitecteExib'] = "SIM"
            } else {
                agencias[i]['emitecteExib'] = "NÂO"
            }
        }
        res.render('administracao/agencias/index_agencias', { agencias })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Carregar Agencias " + err)
        res.redirect('/painel')
    })


})
//Rota para cadastrar agencia no banco de dados 
router.post('/agencias/add_agencia', eAdmin, (req, res) => {
    const { numero, cidade, indice, emite_cte } = req.body
    let error = []
    if (!cidade || typeof cidade == undefined || cidade == null) {
        error.push({ texto: "Nome Invalido" })
    }
    if (!numero || numero == undefined || numero == null) {
        error.push({ texto: "Numero Invalido" })
    }
    if (emite_cte == 'selecione') {
        error.push({ texto: "Informe se emite CTE" })
    }
    if (!indice || typeof indice == undefined || indice == null) {
        error.push({ texto: "Indice informado é invalido" })
    }
    if (error.length > 0) {
        Agencia.find().populate('agencia').then((agencias) => {
            for (let i = 0; i < agencias.length; i++) {
                if (agencias[i].emitecte == true || agencias[i].emitecte == "true") {
                    agencias[i]['emitecteExib'] == "SIM"
                } else {
                    agencias[i]['emitecteExib'] == "NÂO"
                }
            }
            res.render('administracao/agencias/index_agencias', { error, agencias })
        })
    } else {
        Agencia.findOne({ $or: [{ cidade: cidade }, { numero: numero }] }).then((agencias) => {
            if (agencias) {
                req.flash('error_msg', "Numero ou cidade já cadastrada")
                res.redirect('/administracao/agencias')
            } else {

                const newAgencia = {
                    numero: numero,
                    cidade: cidade,
                    emitecte: emite_cte,
                    indiceComissao: indice
                }
                new Agencia(newAgencia).save().then(() => {
                    req.flash('success_msg', "Agencia Cadastrada com sucesso")
                    res.redirect('/administracao/agencias')
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Cadastrar Agencia")
                    res.redirect('/administracao/agencias')
                })
            }
        })
    }
})
router.get('/agencias/edit_agencia/:id', eAdmin, (req, res) => {
    const ident = req.params.id
    Agencia.findById(ident).then((agencia) => {
        if (agencia) {

            if (agencia.emitecte == true || agencia.emitecte == "true") {
                agencia['emitecteExib'] = "SIM"
            } else {
                agencia['emitecteExib'] = "NÂO"
            }
            res.render('administracao/agencias/edit_agencias', { agencia })
        } else {
            req.flash('error_msg', "Não foi encontrado agencia com o parametro informado")
            res.redirect('/administracao/agencias')
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar a agencia")
        res.redirect('/administracao/agencias')
    })
})
router.post('/agencias/edit_agencia/save', eAdmin, (req, res) => {
    const { numero, cidade, indice, emite_cte, ident } = req.body
    let error = []
    if (!cidade || typeof cidade == undefined || cidade == null) {
        error.push({ texto: "Nome Invalido" })
    }
    if (!numero || numero == undefined || numero == null) {
        error.push({ texto: "Numero Invalido" })
    }
    if (emite_cte == 'selecione') {
        error.push({ texto: "Informe se emite CTE" })
    }
    if (!indice || typeof indice == undefined || indice == null) {
        error.push({ texto: "Indice informado é invalido" })
    }
    if (error.length > 0) {
        Agencia.findById(ident).then((agencia) => {
            if (agencia) {
                if (agencia.emitecte == true || agencia.emitecte == "true") {
                    agencia['emitecteExib'] == "SIM"
                } else {
                    agencia['emitecteExib'] == "NÂO"
                }
                res.render('administracao/agencias/edit_agencias', { agencia, error })
            } else {
                req.flash('error_msg', "Não foi encontrado agencia com o parametro informado")
                res.redirect('/administracao/agencias')
            }
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar a agencia")
            res.redirect('/administracao/agencias')
        })
    } else {
        Agencia.findById(ident).then((agencia) => {
            if (!agencia) {
                req.flash('error_msg', "Parametro invalido")
                res.redirect('/administracao/agencias')
            } else {
                agencia.numero = numero
                agencia.cidade = cidade
                agencia.emitecte = emite_cte
                agencia.indiceComissao = indice

                agencia.save().then(() => {
                    req.flash('success_msg', "Agencia Atualizada com sucesso")
                    res.redirect('/administracao/agencias/edit_agencia/' + ident)
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Cadastrar Agencia")
                    res.redirect('/administracao/agencias/edit_agencia/' + ident)
                })
            }
        })
    }

})
//Rota que exclui agencias selecionadas
router.post('/agencias/excluir', eAdmin, (req, res) => {
    if (req.body.ident == undefined) {
        req.flash('error_msg', "Nenhuma Agencia Selecionado para exclusão")
        res.redirect('/administracao/agencias')
    } else {
        var query = { "_id": { $in: req.body.ident } }
        Agencia.deleteMany(query).then(() => {
            req.flash('success_msg', "Agencias selecionadas Excluidas com sucesso")
            res.redirect('/administracao/agencias')
        }).catch((err) => {
            req.flash('error_msg', "Não foi encontradas agencias para exclusão")
            res.redirect('/administracao/agencias')
        })
    }
})

//Rotas Administração de Empresas
router.get('/empresas', eAdmin, (req, res) => {
    Empresa.find().then((empresas) => {
        if (empresas.length == 0) {
            res.render('administracao/empresas/index_empresas')
        } else {
            for (let i = 0; i < empresas.length; i++) {
                if (empresas[i].status == true) {
                    empresas[i]["statusExib"] = "Ativo"
                } else {
                    empresas[i]["statusExib"] = "Inativo"
                }
            }
            res.render('administracao/empresas/index_empresas', { empresas })
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Carregar Empresas " + err)
        res.redirect('/painel')
    })
})
//Rota para cadastrar agencia no banco de dados 
router.post('/empresas/save', eAdmin, (req, res) => {

    if (req.body.status == "selecione") {
        req.flash('error_msg', "Selecione um status")
        res.redirect('/administracao/empresas')
    } else {
        Empresa.findOne({ $or: [{ numero: req.body.numero }, { empresa: req.body.empresa }] }).then((empresa) => {
            if (empresa) {
                req.flash('error_msg', "Empresa Já Cadastrada com esse número ou Nome")
                res.redirect('/administracao/empresas')
            } else {

                const newEmpresa = {
                    numero: req.body.numero,
                    empresa: req.body.empresa,
                    status: req.body.status
                }

                new Empresa(newEmpresa).save().then(() => {
                    req.flash('success_msg', "Empresa Cadastrada com sucesso")
                    res.redirect('/administracao/empresas')
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Cadastrar Empresa ERRO: " + err)
                    res.redirect('/administracao/empresas')
                })
            }
        })
    }
})
//Rota que exclui agencias selecionadas
router.get('/empresas/excluir/:ident', eAdmin, (req, res) => {
    const ident = req.params.ident
    if (ident == undefined) {
        req.flash('error_msg', "Nenhuma Agencia Selecionado para exclusão")
        res.redirect('/administracao/empresas')
    } else {
        var query = { "_id": { $in: ident } }
        GuiaCarga.findOne({ empresa: ident }).then((guia) => {
            PContas.findOne({ empresa: ident }).then((contas) => {
                if (guia || contas) {
                    req.flash('error_msg', "Existem Prestações de COntas ou Guias de cargas cadastradas para essa empresa, não é possivel excluir, necessario manter o historico")
                    res.redirect('/administracao/empresas')
                } else {
                    Empresa.deleteMany(query).then(() => {
                        req.flash('success_msg', "Empresas selecionadas Excluidas com sucesso")
                        res.redirect('/administracao/empresas')
                    }).catch((err) => {
                        req.flash('error_msg', "Não foi encontradas Empresas para exclusão")
                        res.redirect('/administracao/empresas')
                    })
                }

            })
        })
    }
})

//Rotas Administração de Clientes
router.get('/clientes', lOgado, (req, res) => {
    Cliente.find().then((clientes) => {
        if (clientes.length == 0) {
            res.render('administracao/clientes/index_clientes')
        } else {
            for (let i = 0; i < clientes.length; i++) {
                if (clientes[i].perm_fatura == true || clientes[i].perm_fatura == "true") {
                    clientes[i]["premFatExib"] = "Permite Faturar"
                } else {
                    clientes[i]["premFatExib"] = "Não Permite Faturar"
                }
            }
            res.render('administracao/clientes/index_clientes', { clientes })
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Carregar Clientes " + err)
        res.redirect('/painel')
    })
})

router.post('/clientes/add_cliente', lOgado, (req, res) => {
    const { name_client, tipo_doc, documento, contato, perm_fatura } = req.body
    if (!name_client || !tipo_doc || !documento || !contato || !perm_fatura) {
        req.flash('error_msg', "Todos os compos devem ser preenchidos")
        res.redirect('/administracao/clientes')
    } else {
        const newCliente = {
            name_client,
            tipo_doc,
            documento,
            contato,
            perm_fatura,
            user: req.user._id
        }

        new Cliente(newCliente).save().then(() => {
            req.flash('success_msg', "Cliente Cadastrado com sucesso")
            res.redirect('/administracao/clientes')
        }).catch((err) => {
            req.flash('error_msg', "Erro ao cadastrar Cliente")
            res.redirect('/administracao/clientes')
        })
    }

})

router.post('/clientes/excluir/', eAdmin, (req, res) => {
    const ident = req.body.ident
    if (ident == undefined) {
        req.flash('error_msg', "Nenhum cliente selecionado para exclusão")
        res.redirect('/administracao/clientes')
    } else {
        var query = { "_id": { $in: ident } }

        Cliente.deleteMany(query).then(() => {
            req.flash('success_msg', "Clientes selecionados excluidos com sucesso")
            res.redirect('/administracao/clientes')
        }).catch((err) => {
            req.flash('error_msg', "Não foi encontradas Cliente para exclusão")
            res.redirect('/administracao/clientes')
        })

    }
})




module.exports = router