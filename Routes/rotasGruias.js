const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado } = require('../helpers/eAdmin')

//Models
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')
require('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/Talao')
const Talao = mongoose.model('taloes')
require('../Models/Cliente')
const Cliente = mongoose.model('clientes')

router.get('/', lOgado, (req, res) => {
    let usuario = req.user
    Agencia.findById(usuario.agencia).then((agencia) => {
        if (agencia.cidade == "Geral") {
            Empresa.find().then((empresas) => {
                Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                    GuiaCarga.find().populate('empresa').populate('origem').populate('destino').populate('cliente').limit(10).sort({ _id: -1 }).then((guias) => {
                        Cliente.find().sort({ nome: 1 }).then((clientes) => {
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
                            res.render('guiasDeCargas/index_guias', { guias, agencias, empresas, clientes })
                        }).catch((err) => {
                            console.log("erros ao caregar clientes, ERRO: ", err)
                            res.render('guiasDeCargas/index_guias')
                        })
                    }).catch((err) => {
                        console.log("erros ao caregar guias, ERRO: ", err)
                        res.render('guiasDeCargas/index_guias')
                    })

                }).catch((err) => {
                    console.log("erros ao caregar guias, ERRO: ", err)
                    res.render('guiasDeCargas/index_guias')
                })
            }).catch((err) => {
                console.log("erros ao caregar guias, ERRO: ", err)
                res.render('guiasDeCargas/index_guias')
            })
        } else {
            const origem = {
                id: agencia._id,
                cidade: agencia.cidade
            }
            Empresa.find().then((empresas) => {
                Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                    GuiaCarga.find({ origem: agencia._id }).populate('empresa').populate('origem').populate('destino').populate('cliente').limit(10).sort({ date: -1 }).then((guias) => {
                        Cliente.find().sort({ nome: 1 }).then((clientes) => {
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
                            res.render('guiasDeCargas/index_guias', { guias, agencias, empresas, clientes, origem })
                        }).catch((err) => {
                            console.log("erros ao caregar clientes, ERRO: ", err)
                            res.render('guiasDeCargas/index_guias')
                        })
                    }).catch((err) => {
                        console.log("erros ao caregar guias, ERRO: ", err)
                        res.render('guiasDeCargas/index_guias')
                    })

                }).catch((err) => {
                    console.log("erros ao caregar guias, ERRO: ", err)
                    res.render('guiasDeCargas/index_guias')
                })
            }).catch((err) => {
                console.log("erros ao caregar guias, ERRO: ", err)
                res.render('guiasDeCargas/index_guias')
            })
        }
    })




})

router.get('/minhas_guias/remetente', lOgado, (req, res) => {

    var { offset, page } = req.query
    const limit = 30
    if (!offset) {
        offset = 0
    }
    if (offset < 0) {
        offset = 0
    }
    else {
        offset = parseInt(offset)
    }
    if (!page) {
        page = 1
    }
    if (page < 1) {
        page = 1
    } else {
        page = parseInt(page)
    }

    //console.log('agencia= '+agencia +', dateMin= '+ dateMin+', dateMax= '+dateMax+'limit ='+limit+'Offset='+offset)    
    let usuario = req.user
    let agId = usuario.agencia

    Agencia.findById(agId).then((agencia) => {
        GuiaCarga.find({ origem: agId }).limit(limit).skip(offset).populate('empresa').populate('cliente').populate('destino').populate('origem').sort({ dateEntrada: 1 }).then((dados) => {
            var next, prev
            if (page == 1) {
                prev = "disabled"
            }
            if (dados.length < limit) {
                next = "disabled"
            }
            var nextUrl = {
                agen: agencia,
                ofst: offset + limit,
                pag: page + 1,
            }
            var prevUrl = {
                agen: agencia,
                ofst: offset - limit,
                pag: page - 1
            }

            if (dados.length < 1) {
                req.flash('error_msg', "Não há mais guias cadastradas para a agencia")
                res.redirect('/painel')
            } else {
                var i = 0
                while (i < dados.length) {
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    dados[i]["n"] = (i + 1) + offset
                    if (dados[i].baixaPag == true) {
                        dados[i]["statusBaixa"] = "BAIXADO"
                    }
                    if (dados[i].baixaPag == true && dados[i].statusPag == "CANCELADO") {
                        dados[i]["statusBaixa"] = "CANCELADO"
                    }
                    else {
                        dados[i]["statusBaixa"] = "PENDENTE"
                    }
                    i++
                }
                res.render('guiasDeCargas/minhas_guias', { dados, agencia, nextUrl, prevUrl, page, prev, next })
            }

        }).catch((err) => {
            req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro interno ao carregar agencias" + err)
        res.redirect('/painel')
    })

})

router.get('/minhas_guias/destinatario', lOgado, (req, res) => {

    var { offset, page } = req.query
    const limit = 30
    if (!offset) {
        offset = 0
    }
    if (offset < 0) {
        offset = 0
    }
    else {
        offset = parseInt(offset)
    }
    if (!page) {
        page = 1
    }
    if (page < 1) {
        page = 1
    } else {
        page = parseInt(page)
    }

    //console.log('agencia= '+agencia +', dateMin= '+ dateMin+', dateMax= '+dateMax+'limit ='+limit+'Offset='+offset)    
    let usuario = req.user
    let agId = usuario.agencia

    Agencia.findById(agId).then((agencia) => {
        GuiaCarga.find({ destino: agId }).limit(limit).skip(offset).populate('cliente').populate('destino').populate('origem').sort({ dateEntrada: 1 }).then((dados) => {
            var next, prev
            if (page == 1) {
                prev = "disabled"
            }
            if (dados.length < limit) {
                next = "disabled"
            }
            var nextUrl = {
                agen: agencia,
                ofst: offset + limit,
                pag: page + 1,
            }
            var prevUrl = {
                agen: agencia,
                ofst: offset - limit,
                pag: page - 1
            }

            if (dados.length < 1) {
                req.flash('error_msg', "Não há mais guias cadastradas para a agencia")
                res.redirect('/painel')
            } else {
                var i = 0
                while (i < dados.length) {
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    dados[i]["n"] = (i + 1) + offset
                    if (dados[i].baixaPag == true) {
                        dados[i]["statusBaixa"] = "BAIXADO"
                    }
                    if (dados[i].statusPag = "CANCELADO") {
                        dados[i]["statusBaixa"] = "CANCELADO"
                    }
                    else {
                        dados[i]["statusBaixa"] = "PENDENTE"
                    }
                    i++
                }
                res.render('guiasDeCargas/minhas_guias', { dados, agencia, nextUrl, prevUrl, page, prev, next })
            }

        }).catch((err) => {
            req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro interno ao carregar agencias" + err)
        res.redirect('/painel')
    })

})

router.get('/guias_cadastradas', lOgado, (req, res) => {

    var { offset, page } = req.query
    const limit = 30
    if (!offset) {
        offset = 0
    }
    if (offset < 0) {
        offset = 0
    }
    else {
        offset = parseInt(offset)
    }
    if (!page) {
        page = 1
    }
    if (page < 1) {
        page = 1
    } else {
        page = parseInt(page)
    }

    GuiaCarga.find().limit(limit).skip(offset).populate('cliente').populate('destino').populate('origem').sort({ dateEntrada: -1 }).then((dados) => {
        var next = ""
        var prev = ""

        if (page == 1) {
            prev = "disabled"
        }
        if (limit > dados.length) {
            next = "disabled"
        }
        var nextUrl = {
            ofst: offset + limit,
            pag: page + 1,
        }
        var prevUrl = {
            ofst: offset - limit,
            pag: page - 1
        }

        if (dados.length < 1) {
            req.flash('error_msg', "Não há mais guias cadastradas")
            res.redirect('/guias/guias_cadastradas')
        } else {
            var i = 0
            while (i < dados.length) {
                dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                dados[i]["n"] = (i + 1) + offset
                if (dados[i].baixaPag == true && dados[i].statusPag == "CANCELADO") {
                    dados[i]["statusBaixa"] = "CANCELADO"
                }
                if (dados[i].baixaPag == true) {
                    dados[i]["statusBaixa"] = "PAGO"
                }
                else {
                    dados[i]["statusBaixa"] = "PENDENTE"
                }
                i++
            }
            res.render('guiasDeCargas/todas_guias', { dados, nextUrl, prevUrl, page, prev, next })
        }

    }).catch((err) => {
        req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
        res.redirect('/painel')
    })


})
//Rota de adição de guia
router.post('/adicionar', lOgado, (req, res) => {
    const { numero, origem, destino, client, empresa, dateEntrada, vencimento, valor, condPag, baixa, n_fatura } = req.body

    var erro = []
    if (condPag == "FATURADO" && !n_fatura) {
        erro.push({ text: "Para venda Faturada o numero da Fatura é Obrigatorio" })
    }
    if (origem === destino) {
        erro.push({ text: "Cidade de oriegem não pode ser igual a cidade de destino" })
    }
    if (!dateEntrada || dateEntrada == undefined) {
        erro.push({ text: "Informe a data de Entrada" })
    }
    if (!vencimento || vencimento == undefined) {
        erro.push({ text: "Informe a data de Pagamento ou data de Previsão de Pagamento" })
    }
    if (origem == "selecione") {
        erro.push({ text: "Selecione uma cidade de origem" })
    }
    if (destino == "selecione") {
        erro.push({ text: "Selecione uma cidade de destino" })
    }
    if (empresa == "selecione") {
        erro.push({ text: "Selecione uma empresa" })
    }
    if (condPag == "selecione") {
        erro.push({ text: "Selecione uma forma de pagamento" })
    }
    if (erro.length > 0) {
        Empresa.find().then((empresas) => {
            Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                GuiaCarga.find().populate('empresa').populate('origem').populate('destino').populate('cliente').limit(10).sort({ date: 1 }).then((guias) => {
                    Cliente.find().sort({ nome: 1 }).then((clientes) => {
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
                        res.render('guiasDeCargas/index_guias', { guias, agencias, empresas, clientes, erro })
                    }).catch((err) => {
                        console.log("erros ao caregar clientes, ERRO: ", err)
                        res.render('guiasDeCargas/index_guias')
                    })
                }).catch((err) => {
                    console.log("erros ao caregar guias, ERRO: ", err)
                    res.render('guiasDeCargas/index_guias')
                })

            }).catch((err) => {
                console.log("erros ao caregar guias, ERRO: ", err)
                res.render('guiasDeCargas/index_guias')
            })
        }).catch((err) => {
            console.log("erros ao caregar guias, ERRO: ", err)
            res.render('guiasDeCargas/index_guias')
        })
    } else {
        if (condPag == "FATURADO") {
            Cliente.findById(client).then((client) => {
                if (client.perm_fatura == false || client.perm_fatura == "false") {
                    req.flash("Cliente não autorizado paravenda Faturada")
                    res.redirect('/guias')
                } else {
                    Periodo.findOne({ dateInit: { $lte: moment(dateEntrada).format() }, dateFin: { $gte: moment(dateEntrada).format() }, empresa: empresa }).then((periodo) => {
                        if (!periodo) {
                            req.flash('error_msg', "Não foi encontrado periodo para a data de entrada informada, favor criar um periodo para essa data")
                            res.redirect('/guias')
                        } else {
                            if (periodo.status != "Aberto") {
                                req.flash('error_msg', "Periodo referente a data de entrada informada, Já está encerrado, caso necessario reabra o periodo")
                                res.redirect('/guias')
                            } else {
                                Talao.findOne({ numeroInicial: { $lte: numero }, numeroFinal: { $gte: numero }, tipo: "ENCOMENDAS", agencia: origem }).then((talao) => {
                                    if (!talao) {
                                        req.flash('error_msg', "Não foi encontrado talão cadastrado para a numeração de guia ou agencia, a oriegem deve corresponder a agengia que foi destinado o talão, favor verificar")
                                        res.redirect('/guias')
                                    } else {
                                        const newGuia = {
                                            numero: numero,
                                            n_fatura: n_fatura,
                                            periodo: periodo._id,
                                            talao: talao._id,
                                            origem: origem,
                                            destino: destino,
                                            cliente: client,
                                            empresa: empresa,
                                            dateEntrada: dateEntrada,
                                            vencimento: vencimento,
                                            condPag: condPag,
                                            valor: valor,
                                            user: req.user._id
                                        }
                                        GuiaCarga.findOne({ $or: [{ numero: numero, empresa: empresa }, { n_fatura: n_fatura, empresa: empresa, condPag: "FATURADO" }] }).then((guia) => {
                                            if (guia) {
                                                req.flash('error_msg', "Numero de Guia informada já cadastrado para essa empresa, ou existe guia cadastrada com o mesmo numero de fatura")
                                                res.redirect('/guias')
                                            } else {
                                                new GuiaCarga(newGuia).save().then(() => {
                                                    req.flash('success_msg', "Guia de Encomenda Nº " + numero + " cadastrada com sucesso")
                                                    res.redirect('/guias')
                                                }).catch((err) => {
                                                    req.flash('error_msg', "Erro na Salvar nova guia Pg, ERRO: " + err)
                                                    res.redirect('/guias')
                                                })
                                            }
                                        }).catch((err) => {
                                            req.flash('error_msg', "Erro na busca das guias Pagas, ERRO: " + err)
                                            res.redirect('/guias')
                                        })
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', "Erro ao Buscar Talão, ERRO: " + err)
                                    res.redirect('/guias')
                                })
                            }
                        }
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao tentar buscar Periodo, ERRO: " + err)
                        res.redirect('/guias')
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar Clientes, ERRO: " + err)
                res.redirect('/guias')
            })
        } else {
            Periodo.findOne({ dateInit: { $lte: moment(dateEntrada).format() }, dateFin: { $gte: moment(dateEntrada).format() }, empresa: empresa }).then((periodo) => {
                if (!periodo) {
                    req.flash('error_msg', "Não foi encontrado periodo para a data de entrada informada, favor criar um periodo para essa data")
                    res.redirect('/guias')
                } else {
                    if (periodo.status != "Aberto") {
                        req.flash('error_msg', "Periodo referente a data de entrada informada, Já está encerrado, caso necessario reabra o periodo")
                        res.redirect('/guias')
                    } else {
                        Talao.findOne({ numeroInicial: { $lte: numero }, numeroFinal: { $gte: numero }, tipo: "ENCOMENDAS", agencia: origem }).then((talao) => {
                            if (!talao) {
                                req.flash('error_msg', "Não foi encontrado talão cadastrado para a numeração de guia ou agencia, a oriegem deve corresponder a agengia que foi destinado o talão, favor verificar")
                                res.redirect('/guias')
                            } else {
                                const newGuia = {
                                    numero: numero,
                                    n_fatura: n_fatura,
                                    periodo: periodo._id,
                                    talao: talao._id,
                                    origem: origem,
                                    destino: destino,
                                    cliente: client,
                                    empresa: empresa,
                                    dateEntrada: moment(dateEntrada).format(),
                                    vencimento: moment(vencimento).format(),
                                    condPag: condPag,
                                    valor: parseFloat(valor),
                                    baixaPag: baixa,
                                    user: req.user._id
                                }
                                GuiaCarga.findOne({ numero: numero, empresa: empresa }).then((guia) => {
                                    if (guia) {
                                        req.flash('error_msg', "Numero de Guia informada já cadastrado para essa empresa")
                                        res.redirect('/guias')
                                    } else {

                                        new GuiaCarga(newGuia).save().then(() => {
                                            req.flash('success_msg', "Guia de Encomenda Nº " + numero + " cadastrada com sucesso")
                                            res.redirect('/guias')
                                        }).catch((err) => {
                                            req.flash('error_msg', "Erro na Salvar nova guia Pg, ERRO: " + err)
                                            res.redirect('/guias')
                                        })
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', "Erro na busca das guias Pagas, ERRO: " + err)
                                    res.redirect('/guias')
                                })
                            }
                        }).catch((err) => {
                            req.flash('error_msg', "Erro ao Buscar Talão, ERRO: " + err)
                            res.redirect('/guias')
                        })
                    }
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar Periodo, ERRO: " + err)
                res.redirect('/guias')
            })
        }

    }
})

//Baixar Guias Pendentes
router.get('/baixar', lOgado, (req, res) => {
    var erros = []
    const { ident } = req.query
    const usuario = req.user

    GuiaCarga.findById(ident).then((guia) => {

        if (guia.baixaPag) {
            req.flash('error_msg', "Guia já baixada")
            res.redirect('/guias/selectEdit/' + ident)
        }

        guia.condPag = "PAGO"
        guia.baixaPag = true
        guia.user = usuario._id
        guia.save().then(() => {
            req.flash('success_msg', "Baixa Realizada com sucesso ")
            res.redirect('/guias/selectEdit/' + ident)
        }).catch((err) => {
            req.flash('error_msg', "erro ao salvavar baixa da guia selecionada, ERRO" + err)
            res.redirect('/guias/selectEdit/' + ident)
        })
    }).catch((err) => {
        req.flash('error_msg', "erro ao salvavar baixa da guia selecionada, ERRO" + err)
        res.redirect('/guias/selectEdit/' + ident)
    })


})

//Rotas de edição de guia
//Selecionando guia
router.get('/selectEdit/:id', lOgado, (req, res) => {

    Empresa.find().then((empresas) => {
        Agencia.find().then((agencias) => {
            Cliente.find().sort({ nome: 1 }).then((clientes) => {
                GuiaCarga.findOne({ _id: req.params.id }).populate('user_conf_entr').populate('user_conf_pag').populate('origem').populate('destino').populate('empresa').populate('user').populate('cliente').then((guia) => {

                    guia["date_entrada"] = moment(guia.dateEntrada).format('YYYY-MM-DD')
                    guia["date_vencimento"] = moment(guia.vencimento).format('YYYY-MM-DD')
                    guia["date_pagamento"] = moment(guia.datePagamento).format('YYYY-MM-DD')
                    guia["date_exib"] = moment(guia.date).format('DD/MM/YYYY HH:mm')
                    guia["date_entrega"] = moment(guia.dateEntrega).format('DD/MM/YYYY HH:mm')

                    if (guia.baixaPag == true || guia.baixaPag == "true") {
                        guia["statusBaixa"] = "PAGO"
                        guia["baixaExib"] = "BAIXADO"
                        if (guia.baixaPag == true && guia.condPag == "CANCELADO") {
                            guia["statusBaixa"] = "CANCELADO"
                            guia["baixaExib"] = "CANCELADO"
                        }
                    } else {
                        if (moment(guia.vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            guia["statusBaixa"] = "VENCIDO"
                            guia["baixaExib"] = "PENDENTE"
                        } else {
                            guia["statusBaixa"] = "NO PRAZO"
                        }
                    }

                    res.render('guiasDeCargas/vizualizar', { guia, empresas, agencias, clientes })

                }).catch((err) => {
                    req.flash('error_msg', "Erro Buscar Guia Paga " + err)
                    res.redirect('/guias')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro Buscar Clientes " + err)
                res.redirect('/guias')
            })

        }).catch((err) => {
            req.flash('error_msg', "Erro Buscar Empresas " + err)
            res.redirect('/guias')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro Buscar Agencias " + err)
        res.redirect('/guias')
    })

})

//Editando Guia
router.post('/editar', lOgado, (req, res) => {

    const { id, user, origem, destino, cliente, empresa, dateEntrada, vencimento, valor, condPag, baixa, n_fatura } = req.body
    if (condPag == 'FATURADO' && !n_fatura) {
        req.flash('error_msg', "Condição de Pagamento Faturado, deve ser informado o numero da fatura")
        res.redirect('/guias/selectEdit/' + id)
    }
    let erro = []

    if (origem == "selecione") {
        erro.push({ text: "Selecione a Cidade de Oriegem" })
    }
    if (destino == "selecione") {
        erro.push({ text: "Selecione a Cidade de Destino" })
    }
    if (empresa == "selecione") {
        erro.push({ text: "Selecione a Empresa da Guia" })
    }
    if (condPag == "selecione") {
        erro.push({ text: "Informe o Status do pagamento" })
    }
    if (origem === destino) {
        erro.push({ text: "Cidade de oriegem não pode ser igual a cidade de destino" })
    }
    if (cliente == "selecione") {
        erro.push({ text: "Selecione um cliente" })
    }
    if (!dateEntrada || typeof dateEntrada == undefined || dateEntrada == null) {
        erro.push({ text: "Data de entrada informada é  invalida" })
    }
    if (!vencimento || typeof vencimento == undefined || vencimento == null) {
        erro.push({ text: "Data de Pagamento iinformada é invalida" })
    }
    if (erro.length > 0) {
        Empresa.find().then((empresas) => {
            Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                GuiaCarga.find().populate('empresa').populate('origem').populate('destino').populate('cliente').limit(10).sort({ date: 1 }).then((guias) => {
                    Cliente.find().sort({ nome: 1 }).then((clientes) => {
                        for (let i = 0; i < guias.length; i++) {
                            guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
                            guias[i]["date_vencimento"] = moment(guias[i].vencimento).format('DD/MM/YYYY')
                            guias[i]["valorExib"] = guias[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            if (guias[i].baixaPag == true || guias[i].baixaPag == "true") {
                                guias[i]["statusBaixa"] = "PAGO"
                            } else {
                                if (guias[i].vencimento < moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ")) {
                                    guias[i]["statusBaixa"] = "VENCIDO"
                                } else {
                                    guias[i]["statusBaixa"] = "PENDENTE"
                                }
                            }
                        }
                        res.render('guiasDeCargas/index_guias', { guias, agencias, empresas, clientes, erro })
                    }).catch((err) => {
                        console.log("erros ao caregar clientes, ERRO: ", err)
                        res.render('guiasDeCargas/index_guias')
                    })
                }).catch((err) => {
                    console.log("erros ao caregar guias, ERRO: ", err)
                    res.render('guiasDeCargas/index_guias')
                })

            }).catch((err) => {
                console.log("erros ao caregar guias, ERRO: ", err)
                res.render('guiasDeCargas/index_guias')
            })
        }).catch((err) => {
            console.log("erros ao caregar guias, ERRO: ", err)
            res.render('guiasDeCargas/index_guias')
        })
    } else {
        if (condPag == "CANCELADO") {
            GuiaCarga.findById(id).then((guia) => {
                if (!guia) {
                    req.flash('error_msg', "Guia não encontrada")
                    res.redirect('/guias')
                } else {

                    guia.user = user
                    guia.origem = origem
                    guia.destino = destino
                    guia.cliente = cliente
                    guia.empresa = empresa
                    guia.dateEntrada = moment(dateEntrada).format()
                    guia.vencimento = moment(vencimento).format()
                    guia.valor = valor
                    guia.date = moment(new Date()).format()
                    guia.user_conf_pag = req.user._id
                    guia.datePagamento = moment(new Date()).format()
                    guia.formaPag = condPag
                    guia.condPag = condPag
                    guia.baixaPag = true
                    guia.entrega = condPag
                    guia.baixaEntr = true
                    guia.dateEntrada = moment(new Date()).format()

                    guia.save().then(() => {
                        req.flash('success_msg', "Guia " + guia.numero + "Cancelada com sucesso")
                        res.redirect('/guias/selectEdit/' + guia._id)
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao realizar Cancelamnto da Guia " + guia.numero + " ERRO: " + err)
                        res.redirect('/guias')
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro Buscar Guia " + err)
                res.redirect('/guias')
            })
        } else {
            GuiaCarga.findById(id).then((guia) => {
                if (!guia) {
                    req.flash('error_msg', "Guia não encontrada")
                    res.redirect('/guias')
                } else {
                    let baixado
                    //console.log(baixa)
                    if (baixa == undefined) {
                        baixado = false
                    } else {
                        baixado = true
                    }
                    guia.user = user
                    guia.origem = origem
                    guia.destino = destino
                    guia.cliente = cliente
                    guia.empresa = empresa
                    guia.baixaPag = baixado
                    guia.dateEntrada = moment(dateEntrada).format()
                    guia.vencimento = moment(vencimento).format()
                    guia.valor = valor
                    guia.condPag = condPag
                    guia.date = moment(new Date()).format()

                    guia.save().then(() => {
                        req.flash('success_msg', "Edição da Guia " + guia.numero + " Realizada com sucesso")
                        res.redirect('/guias/selectEdit/' + guia._id)
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao realizar a Edição da Guia " + guia.numero + " ERRO: " + err)
                        res.redirect('/guias')
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', "Erro Buscar Guia " + err)
                res.redirect('/guias')
            })
        }
    }
})

router.post('/atualizar_entrega', lOgado, (req, res) => {
    const { id, status_entrega, recebedor, cpfRecebedor } = req.body
    const usuario = req.user

    if (status_entrega == "DEVOLVIDO AO REMETENTE" && !recebedor || status_entrega == "DEVOLVIDO AO REMETENTE" && !cpfRecebedor || status_entrega == "ENTREGUE AO DESTINATARIO" && !recebedor || status_entrega == "ENTREGUE AO DESTINATARIO" && !cpfRecebedor) {
        req.flash('error_msg', "Encomendas entregues e devolvidas, deve ser informado os dados do recebedor, Nome e CPF")
        res.redirect('/guias/selectEdit/' + id)
    } else {
        GuiaCarga.findById(id).then((guia) => {
            if (status_entrega == "ENTREGUE AO DESTINATARIO" || status_entrega == "DEVOLVIDO AO REMETENTE") {
                guia.dateEntrega = moment(new Date()).format()
                guia.recebedor = recebedor
                guia.cpfRecebedor = cpfRecebedor
                guia.baixaEntr = true
                guia.user_conf_entr = usuario._id
            }

            guia.entrega = status_entrega
            guia.date = moment(new Date()).format()
            guia.user = usuario._id

            guia.save().then(() => {
                req.flash('success_msg', "Edição da Guia " + guia.numero + " Realizada com sucesso")
                res.redirect('/guias/selectEdit/' + guia._id)
            }).catch((err) => {
                req.flash('error_msg', "Erro ao realizar a Edição da Guia " + guia.numero + " ERRO: " + err)
                res.redirect('/guias')
            })

        }).catch((err) => {
            req.flash('error_msg', "Erro Buscar Guia " + err)
            res.redirect('/guias')
        })
    }



})
//Rotas de buscar guias por numero de conhecimento
router.post('/buscar', lOgado, (req, res) => {
    GuiaCarga.findOne({ numero: req.body.numero }).then((guia) => {
        guia["date_entrada"] = moment(guia.dateEntrada).format('YYYY-MM-DD')
        guia["date_vencimento"] = moment(guia.vencimento).format('YYYY-MM-DD')
        res.render('guiasDeCargas/vizualizar', { guia })
    }).catch((err) => {
        req.flash('error_msg', "Guias Nº " + req.body.numero + " não encontrada")
        res.redirect('/guias')
    })
})

router.post('/informar_pagamento_guia', lOgado, (req, res) => {
    const { ident, date_pagamento, formaPag, date_entrada } = req.body

    if (formaPag == "selecione") {
        req.flash('error_msg', "A forma de Pagamento é Obrigatoria")
        res.redirect('/guias/selectEdit/' + ident)
    } else {
        if (date_pagamento < date_entrada) {
            req.flash('error_msg', "A data de pagamento deve ser igual ou maior a data de entrada")
            res.redirect('/guias/selectEdit/' + ident)
        } else {
            if (formaPag == "CANCELADO") {
                GuiaCarga.findById(ident).then((guia) => {
                    guia.user_conf_pag = req.user._id
                    guia.date = moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ")
                    guia.datePagamento = date_pagamento
                    guia.formaPag = formaPag
                    guia.condPag = formaPag
                    guia.baixaPag = true
                    guia.entrega = formaPag
                    guia.baixaEntr = true
                    guia.dateEntrada = date_pagamento
                    guia.save().then(() => {
                        req.flash('success_msg', "Guia " + guia.numero + "informado pagamento e baixada realizada com sucesso")
                        res.redirect('/guias/selectEdit/' + ident)
                    }).catch((err) => {
                        req.flash('error_msg', "Guia " + guia.numero + " Erro na opração, ERR " + err)
                        res.redirect('/guias/selectEdit/' + ident)
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar a guia" + err)
                    res.redirect('/guias/selectEdit/' + ident)
                })

            } else {
                if (formaPag == "BOLETO FATURA") {
                    if (req.user.perfil == "FINANCEIRO") {
                        GuiaCarga.findById(ident).then((guia) => {
                            guia.user_conf_pag = req.user._id
                            guia.date = moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ")
                            guia.datePagamento = date_pagamento
                            guia.formaPag = formaPag
                            guia.baixaPag = true
                            guia.save().then(() => {
                                req.flash('success_msg', "Guia " + guia.numero + "informado pagamento e baixada realizada com sucesso")
                                res.redirect('/guias/selectEdit/' + ident)
                            }).catch((err) => {
                                req.flash('error_msg', "Guia " + guia.numero + " Erro na opração, ERR " + err)
                                res.redirect('/guias/selectEdit/' + ident)
                            })
                        }).catch((err) => {
                            req.flash('error_msg', "Erro ao Buscar a guia" + err)
                            res.redirect('/guias/selectEdit/' + ident)
                        })
                    } else {
                        req.flash('error_msg', "Você não possue autorização para informar pagamento de guias Faturadas")
                        res.redirect('/guias/selectEdit/' + ident)
                    }
                } else {
                    GuiaCarga.findById(ident).then((guia) => {
                        guia.user_conf_pag = req.user._id
                        guia.date = moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ")
                        guia.datePagamento = date_pagamento
                        guia.formaPag = formaPag
                        guia.baixaPag = true
                        guia.save().then(() => {
                            req.flash('success_msg', "Guia " + guia.numero + "informado pagamento e baixada realizada com sucesso")
                            res.redirect('/guias/selectEdit/' + ident)
                        }).catch((err) => {
                            req.flash('error_msg', "Guia " + guia.numero + " Erro na opração, ERR " + err)
                            res.redirect('/guias/selectEdit/' + ident)
                        })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao Buscar a guia" + err)
                        res.redirect('/guias/selectEdit/' + ident)
                    })
                }
            }
        }
    }
})

module.exports = router