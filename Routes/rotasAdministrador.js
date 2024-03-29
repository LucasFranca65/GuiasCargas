const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { eAdmin, lOgado, eControle, eDigitador } = require('../helpers/eAdmin')
const moment = require('moment')

//Models
require('../models/User')
const User = mongoose.model('users')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/PContas')
const PContas = mongoose.model('pContas')
require('../models/Cliente')
const Cliente = mongoose.model('clientes')

//Rotas de Administração de Usuarios

router.get('/users', eAdmin, (req, res) => {
    User.find().populate('agencia').then((users) => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {
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
    const { nome, login, agencia, senha1, senha2, perfil } = req.body

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
    if (agencia == 'selecione') {
        error.push({ texto: "Selecione uma agencia" })
    }
    if (perfil == 'selecione') {
        error.push({ texto: "Selecione um perfil de usuario" })
    }
    //  Verificando erros
    if (error.length > 0) {
        User.find().populate('agencia').then((users) => {
            Agencia.find().sort({ cidade: 1 }).then((agencias) => {

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
        Agencia.findById(agencia).then((agc) => {
            User.findOne({ login: login }).then((usuario) => {
                if (usuario) {
                    req.flash('error_msg', "Já existe um usuario com esse login")
                    res.redirect('/administracao/users')
                } else if (agc.cidade == 'Geral' && perfil == "AGENTE" || agc.numero == "9999" && perfil == "AGENTE") {
                    req.flash('error_msg', "Usuarios com perfil de AGENTE não podem ser vinculados a agencia Geral")
                    res.redirect('/administracao/users')
                } else if (perfil != "AGENTE" && agc.cidade != 'Geral' || perfil != "AGENTE" && agc.numero != "9999") {
                    req.flash('error_msg', "Usuarios com perfil " + perfil + " devem ser vinculados a agencia Geral")
                    res.redirect('/administracao/users')
                } else {
                    if (perfil == "ADMINISTRADOR") {
                        const novoUsuario = new User({
                            nome: nome,
                            login: login,
                            perfil: perfil,
                            senha: senha1,
                            agencia: agencia,
                            eAdmin: true,
                            eControle: true,
                            eDigitador: true
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
                                    req.flash('error_msg', "Erro ao criar usuario Administrador", err)
                                    res.redirect('/administracao/users/add_user')
                                })
                            })
                        })
                    } else if (perfil == "FINANCEIRO" || perfil == "ARRECADACAO" || perfil == "CONTROLE") {
                        const novoUsuario = new User({
                            nome: nome,
                            login: login,
                            perfil: perfil,
                            senha: senha1,
                            agencia: agencia,
                            eControle: true,
                            eDigitador: true
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
                                    req.flash('error_msg', "Erro ao criar usuario", err)
                                    res.redirect('/administracao/users')
                                })
                            })
                        })
                    } else if (perfil == "DIGITADOR") {
                        const novoUsuario = new User({
                            nome: nome,
                            login: login,
                            perfil: perfil,
                            senha: senha1,
                            agencia: agencia,
                            eDigitador: true
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
                                    req.flash('error_msg', "Erro ao criar usuario", err)
                                    res.redirect('/administracao/users')
                                })
                            })
                        })
                    } else {
                        const novoUsuario = new User({
                            nome: nome,
                            login: login,
                            perfil: perfil,
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
                                    req.flash('error_msg', "Erro ao criar usuario", err)
                                    res.redirect('/administracao/users')
                                })
                            })
                        })
                    }
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro Interno", err)
                res.redirect('/administracao/users')

            })
        }).catch((err) => {
            req.flash('error_msg', "Erro Interno na busca de uma agencia", err)
            res.redirect('/administracao/users')
        })

    }

})
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
router.post('/guias/excluir', eControle, (req, res) => {
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
router.get('/guias/exclusao', eControle, (req, res) => {
    const { ident } = req.query
    if (ident == undefined) {
        req.flash('error_msg', "Nenhuma Guia Selecionado para exclusão")
        res.redirect('/guias')
    } else {
        var query = { "_id": ident }
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
router.get('/agencias', eControle, (req, res) => {

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
router.post('/agencias/add_agencia', eControle, (req, res) => {
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
router.get('/agencias/edit_agencia/:id', eControle, (req, res) => {
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
router.post('/agencias/edit_agencia/save', eControle, (req, res) => {
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
router.post('/agencias/excluir', eControle, (req, res) => {
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
    Cliente.find().sort({ name_client: 1 }).then((clientes) => {
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
router.post('/clientes/add_cliente', eDigitador, (req, res) => {
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
router.post('/clientes/excluir/', eDigitador, (req, res) => {

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
router.get('/clientes/ver_cliente/:ident', lOgado, (req, res) => {
    const ident = req.params.ident
    Cliente.findById(ident).then((client) => {
        if (!client) {
            req.flash('error_msg', "Não Foi encontrado cliente")
            res.redirect('/administracao/clientes')
        } else {
            if (client.perm_fatura == true) {
                client['perm_faturaExib'] = "Permite faturar"
            } else {
                client['perm_faturaExib'] = "Não permite faturar"
            }
            GuiaCarga.find({ cliente: client._id }).populate('origem').populate('destino').populate('empresa').then((guias) => {
                for (let i = 0; i < guias.length; i++) {
                    guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
                    guias[i]["date_vencimento"] = moment(guias[i].vencimento).format('DD/MM/YYYY')
                    guias[i]["valorExib"] = guias[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (guias[i].baixaPag == true || guias[i].baixaPag == "true") {
                        guias[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(guias[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            guias[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            guias[i]["statusBaixa"] = "PENDENTE"
                        }
                    }
                }
                res.render('administracao/clientes/edit_cliente', { guias, client })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Carregar guias do cliente")
                res.redirect('/administracao/clientes')
            })
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Carregar cadastro do cliente")
        res.redirect('/administracao/clientes')
    })
})
router.post('/clientes/edit_client/editar', eDigitador, (req, res) => {
    const { name_client, tipo_doc, documento, contato, perm_fatura, ident } = req.body
    Cliente.findById(ident).then((client) => {

        client.name_client = name_client
        client.tipo_doc = tipo_doc
        client.documento = documento
        client.contato = contato
        client.perm_fatura = perm_fatura
        client.user = req.user._id

        client.save().then(() => {
            req.flash('success_msg', "Edição Realizada com Sucesso")
            res.redirect('/administracao/clientes/ver_cliente/' + ident)
        }).catch((err) => {
            req.flash('error_msg', "Erro ao realizar edição Cliente ERRO:" + err )
            res.redirect('/administracao/clientes/ver_cliente/' + ident)
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar Cliente ERRO: " + err)
        res.redirect('/administracao/clientes/ver_cliente/' + ident)
    })




})

module.exports = router
