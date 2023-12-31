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
    Empresa.find().then((empresas) => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {
            GuiaCarga.find().populate('empresa').populate('origem').populate('destino').populate('cliente').limit(10).sort({ date: 1 }).then((guias) => {
                Cliente.find().sort({ nome: 1 }).then((clientes) => {
                    for (let i = 0; i < guias.length; i++) {
                        guias[i]["date_entrada"] = moment(guias[i].dateEntrada).format('DD/MM/YYYY')
                        guias[i]["date_vencimento"] = moment(guias[i].vencimento).format('DD/MM/YYYY')
                        guias[i]["valorExib"] = guias[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        if (guias[i].baixa == true || guias[i].baixa == "true") {
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
})

//Rota de adição de guia
router.post('/adicionar', lOgado, (req, res) => {
    const { numero, origem, destino, client, empresa, dateEntrada, vencimento, valor, condPag, baixa, n_fatura } = req.body

    var erro = []
    if (condPag == "FATURADO" && !n_fatura) {
        erro.push({ text: "Para venda Faturada o numero da Fatura é Obrigatorio" })
    }
    if (req.body.origem === req.body.destino) {
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
                            if (guias[i].baixa == true || guias[i].baixa == "true") {
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
                    Periodo.findOne({ dateInit: { $lte: dateEntrada }, dateFin: { $gte: dateEntrada }, empresa: empresa }).then((periodo) => {
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
            Periodo.findOne({ dateInit: { $lte: dateEntrada }, dateFin: { $gte: dateEntrada }, empresa: empresa }).then((periodo) => {
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
                                    baixa: baixa,
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
router.post('/baixar', lOgado, (req, res) => {
    var erros = []
    const { ident, tipo } = req.body
    if (Array.isArray(ident)) {
        ident.forEach((item) => {
            GuiaCarga.findOne({ _id: item }).then((guia) => {
                guia.condPag = "PAGO",
                    guia.baixa = true
                guia.save().then(() => {
                }).catch((err) => {
                    erros.push({ guia: guia.numero })
                })
            }).catch((err) => {
                req.flash('error_msg', "erro ao salvavar baixa da guia selecionada, ERRO" + err)
                res.redirect('/painel')
            })
        })

        if (erros.length > 0) {
            req.flash('error_msg', "Erro ao realizar a baixa das guias: " + erros)
            res.redirect('/painel')
        } else {
            req.flash('success_msg', "Realizada baixa da guia selecionada")
            res.redirect('/painel')
        }

    } else {
        GuiaCarga.findOne({ _id: ident }).then((guia) => {

            guia.baixa = true
            guia.save().then(() => {
                req.flash('success_msg', "Realizada baixa da guia selecionada")
                res.redirect('/painel')
            }).catch((err) => {
                req.flash('error_msg', "Erro ao realizada baixa da guia selecionada, ERRO" + err)
                res.redirect('/painel')
            })
        }).catch((err) => {
            req.flash('error_msg', "erro ao salvavar baixa da guia selecionada, ERRO" + err)
            res.redirect('/painel')
        })
    }
})

//Rotas de edição de guia
//Selecionando guia
router.get('/selectEdit/:id', lOgado, (req, res) => {

    Empresa.find().then((empresas) => {
        Agencia.find().then((agencias) => {
            Cliente.find().sort({ nome: 1 }).then((clientes) => {
                GuiaCarga.findOne({ _id: req.params.id }).populate('origem').populate('destino').populate('empresa').populate('user').populate('cliente').then((guia) => {

                    guia["date_entrada"] = moment(guia.dateEntrada).format('YYYY-MM-DD')
                    guia["date_vencimento"] = moment(guia.vencimento).format('YYYY-MM-DD')
                    guia["date_pagamento"] = moment(guia.datePagamento).format('YYYY-MM-DD')
                    guia["date_exib"] = moment(guia.date).format('DD/MM/YYYY HH:mm')
                    if (guia.baixa == true || guia.baixa == "true") {
                        guia["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(guia.vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            guia["statusBaixa"] = "VENCIDO"
                        } else {
                            guia["statusBaixa"] = "PENDENTE"
                        }
                    }
                    //console.log(guia)
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
                            if (guias[i].baixa == true || guias[i].baixa == "true") {
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
        //console.log(id, user, origem,destino, cliente,empresa,dateEntrada,datePagamento,valor,condPag,baixa)
        GuiaCarga.findOne({ _id: id }).then((guia) => {
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
                guia.user = user,
                    guia.origem = origem,
                    guia.destino = destino,
                    guia.cliente = cliente,
                    guia.empresa = empresa,
                    guia.baixa = baixado,
                    guia.dateEntrada = moment(dateEntrada).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                    guia.vencimento = moment(vencimento).format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
                    guia.valor = valor,
                    guia.condPag = condPag,
                    guia.date = moment(new Date()).format("YYYY-MM-DDTHH:mm:ss.SSSZ")

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

router.post('/biaxar_guia', lOgado, (req, res) => {
    const { ident, date_pagamento, formaPag } = req.body
    if (formaPag == "selecione") {
        req.flash('error_msg', "A forma de Pagamento é Obrigatoria")
        res.redirect('/guias/selectEdit/' + ident)
    } else {
        GuiaCarga.findById(ident).then((guia) => {
            guia.datePagamento = date_pagamento
            guia.formaPag = formaPag
            guia.baixa = true
            guia.save().then(() => {
                req.flash('success_msg', "Guia " + guia.numero + " baixada com sucesso")
                res.redirect('/guias/selectEdit/' + ident)
            }).catch((err) => {
                req.flash('error_msg', "Guia " + guia.numero + " Erro ao realizar baixa, ERR " + err)
                res.redirect('/guias/selectEdit/' + ident)
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar a guia" + err)
            res.redirect('/guias/selectEdit/' + ident)
        })
    }
})

module.exports = router