const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado, eAdmin } = require('../helpers/eAdmin')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')

//Painel principal das guias

router.get('/', lOgado, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        res.redirect('/agencias')
    } else if (usuario.perfil == "FINANCEIRO" || usuario.perfil == "ARRECADACAO") {
        res.redirect('/painel/financeiro')
    } else {
        const anoBusca = moment(new Date()).format("YYYY")
        const mesBusca = moment(new Date()).format("MM")
        const { empresa } = req.query
        if (!empresa) {
            Empresa.find().then(empresas => {
                Periodo.findOne({ ano: anoBusca, mes: mesBusca }).populate('empresa').then(periodo => {
                    if (!periodo) {
                        var erros = [{ text: "Não existe perido de digitação criado para o mês atual" }];
                        res.render('painelPrincipal/painelGaragem', { erros, empresas })
                    } else {
                        GuiaCarga.find({ periodo: periodo._id }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('cliente').then((guias) => {

                            const titulo = {
                                empresa: periodo.empresa.empresa,
                                ano: periodo.ano,
                                mes: periodo.mes
                            }

                            const graficos = {
                                qtdTotal: 0,
                                valorTotal: 0,
                                qtdCancel: 0,
                                valorCancel: 0,
                                qtdPago: 0,
                                valorPago: 0,
                                qtdVenciados: 0,
                                valorVencido: 0,
                                qtdPendente: 0,
                                valorPendente: 0,
                                pendenteExib: ""
                            }
                            const guiasPp = guias.filter(g => g.baixaPag == false)
                            graficos.qtdPendente = guiasPp.length
                            for (let i = 0; i < guiasPp.length; i++) {
                                graficos.valorPendente += guiasPp[i].valor
                                guiasPp[i]["date_entrada"] = moment(guiasPp[i].dateEntrada).format('DD/MM/YYYY')
                                guiasPp[i]["date_vencimento"] = moment(guiasPp[i].vencimento).format('DD/MM/YYYY')
                                guiasPp[i]["valorExib"] = guiasPp[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                                if (moment(guiasPp[i].vencimento).format("YYYY-MM-DD") >= moment(new Date()).format("YYYY-MM-DD")) {
                                    guiasPp[i]["statusBaixa"] = "PENDENTE"
                                } else {
                                    guiasPp[i]["statusBaixa"] = "VENCIDO"
                                }

                            }
                            graficos.pendenteExib = graficos.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            const guiasCancel = guias.filter(g => g.condPag == "CANCELADO")
                            graficos.qtdCancel = guiasCancel.length
                            for (let i = 0; i < guiasCancel.length; i++) {
                                graficos.valorCancel += guiasCancel[i].valor
                            }

                            const guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                            graficos.qtdPago = guiasPagas.length
                            for (let i = 0; i < guiasPagas.length; i++) {
                                graficos.valorPago += guiasPagas[i].valor
                            }

                            const guiasVencidas = guias.filter(g => moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                            graficos.qtdVenciados = guiasVencidas.length
                            for (let i = 0; i < guiasVencidas.length; i++) {
                                graficos.valorVencido += guiasVencidas[i].valor
                            }

                            graficos.qtdTotal = guias.length
                            for (let i = 0; i < guias.length; i++) {
                                graficos.valorTotal += guias[i].valor
                            }

                            res.render('painelPrincipal/painelGaragem', { guiasPp, periodo, graficos, empresas, titulo })
                        }).catch((err) => {
                            req.flash('error_msg', "Painel principal, busca de guias ERRO: " + err)
                            res.redirect('/error')
                        })
                    }

                }).catch((err) => {
                    req.flash('error_msg', "Painel principal, busca de periodo ERRO: " + err)
                    res.redirect('/error')
                })
            }).catch((err) => {
                req.flash('error_msg', "Painel principal, busca de empresa ERRO: " + err)
                res.redirect('/error')
            })
        } else {
            const anoBusca = moment(new Date()).format("YYYY")
            const mesBusca = moment(new Date()).format("MM")
            Empresa.find().then(empresas => {
                Periodo.findOne({ ano: anoBusca, mes: mesBusca, empresa: empresa }).populate('empresa').then(periodo => {
                    if (!periodo) {
                        var erros = [{ text: "Não existe perido criado para o mês atual, referentes a empresa " }];
                        res.render('painelPrincipal/painelGaragem', { erros, empresas })
                    } else {
                        GuiaCarga.find({ periodo: periodo._id }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('cliente').then((guias) => {
                            const titulo = {
                                empresa: periodo.empresa.empresa,
                                ano: periodo.ano,
                                mes: periodo.mes
                            }
                            const graficos = {
                                qtdTotal: 0,
                                valorTotal: 0,
                                qtdCancel: 0,
                                valorCancel: 0,
                                qtdPago: 0,
                                valorPago: 0,
                                qtdVenciados: 0,
                                valorVencido: 0,
                                qtdPendente: 0,
                                valorPendente: 0,
                                pendenteExib: ""
                            }
                            const guiasPp = guias.filter(g => g.baixaPag == false)
                            graficos.qtdPendente = guiasPp.length
                            for (let i = 0; i < guiasPp.length; i++) {
                                graficos.valorPendente += guiasPp[i].valor
                                guiasPp[i]["date_entrada"] = moment(guiasPp[i].dateEntrada).format('DD/MM/YYYY')
                                guiasPp[i]["date_vencimento"] = moment(guiasPp[i].vencimento).format('DD/MM/YYYY')
                                guiasPp[i]["valorExib"] = guiasPp[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                                if (moment(guiasPp[i].vencimento).format("YYYY-MM-DD") >= moment(new Date()).format("YYYY-MM-DD")) {
                                    guiasPp[i]["statusBaixa"] = "PENDENTE"
                                } else {
                                    guiasPp[i]["statusBaixa"] = "VENCIDO"
                                }

                            }
                            graficos.pendenteExib = graficos.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            const guiasCancel = guias.filter(g => g.condPag == "CANCELADO")
                            graficos.qtdCancel = guiasCancel.length
                            for (let i = 0; i < guiasCancel.length; i++) {
                                graficos.valorCancel += guiasCancel[i].valor
                            }

                            const guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                            graficos.qtdPago = guiasPagas.length
                            for (let i = 0; i < guiasPagas.length; i++) {
                                graficos.valorPago += guiasPagas[i].valor
                            }

                            const guiasVencidas = guias.filter(g => moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                            graficos.qtdVenciados = guiasVencidas.length
                            for (let i = 0; i < guiasVencidas.length; i++) {
                                graficos.valorVencido += guiasVencidas[i].valor
                            }

                            graficos.qtdTotal = guias.length
                            for (let i = 0; i < guias.length; i++) {
                                graficos.valorTotal += guias[i].valor
                            }

                            res.render('painelPrincipal/painelGaragem', { guiasPp, periodo, graficos, empresas, titulo })
                        }).catch((err) => {
                            req.flash('error_msg', "Painel principal, busca de guias ERRO: " + err)
                            res.redirect('/error')
                        })
                    }

                }).catch((err) => {
                    req.flash('error_msg', "Painel principal, busca de periodo ERRO: " + err)
                    res.redirect('/error')
                })
            }).catch((err) => {
                req.flash('error_msg', "Painel principal, busca de empresa ERRO: " + err)
                res.redirect('/error')
            })
        }
    }
})

router.get('/financeiro', lOgado, (req, res) => {
    Agencia.find().then((agencias) => {
        GuiaCarga.find({ baixaPag: false }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guias) => {
            const titulo = {
                qtd_guias: guias.length,
                total: 0,
                totalExib: ""
            }
            for (let i = 0; i < guias.length; i++) {
                titulo.total += parseFloat(guias[i].valor)
            }
            titulo.totalExib = titulo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            var dados = []
            agencias.forEach(agencia => {
                const guiasPendentes = guias.filter(g => String(g.origem._id) == String(agencia._id))
                if (guiasPendentes.length > 0) {
                    var resumo = {
                        agenciaId: agencia._id,
                        agencia: agencia.cidade,
                        pendentes: guiasPendentes.length,
                        valor: 0,
                        valorExib: ""
                    }
                    for (let i = 0; i < guiasPendentes.length; i++) {
                        resumo.valor += guiasPendentes[i].valor
                    }
                    resumo.valorExib = resumo.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    dados.push(resumo)
                }
            });
            res.render('painelPrincipal/painelFinanc', { dados, titulo })


        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar guias pendentes")
            res.render('painelPrincipal/index')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Agencia")
        res.render('painelPrincipal/index')
    })
})

/*router.get('/garagem', lOgado, (req, res) => {

    //const dataAtual = moment('01/15/2024', 'MM/DD/YYYY', true).format()
    const anoBusca = moment(new Date()).format("YYYY")
    const mesBusca = moment(new Date()).format("MM")
    const { empresa } = req.query
    if (!empresa) {
        Empresa.find().then(empresas => {
            Periodo.findOne({ ano: anoBusca, mes: mesBusca }).populate('empresa').then(periodo => {
                if (!periodo) {
                    var erros = [{ text: "Não existe perido de digitação criado para o mês atual" }];
                    res.render('painelPrincipal/painelGaragem', { erros, empresas })
                } else {
                    GuiaCarga.find({ periodo: periodo._id }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('cliente').then((guias) => {
                        const graficos = {
                            qtdTotal: 0,
                            valorTotal: 0,
                            qtdCancel: 0,
                            valorCancel: 0,
                            qtdPago: 0,
                            valorPago: 0,
                            qtdVenciados: 0,
                            valorVencido: 0,
                            qtdPendente: 0,
                            valorPendente: 0,
                            pendenteExib: ""
                        }
                        const guiasPp = guias.filter(g => g.baixaPag == false)
                        graficos.qtdPendente = guiasPp.length
                        for (let i = 0; i < guiasPp.length; i++) {
                            graficos.valorPendente += guiasPp[i].valor
                            guiasPp[i]["date_entrada"] = moment(guiasPp[i].dateEntrada).format('DD/MM/YYYY')
                            guiasPp[i]["date_vencimento"] = moment(guiasPp[i].vencimento).format('DD/MM/YYYY')
                            guiasPp[i]["valorExib"] = guiasPp[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            if (moment(guiasPp[i].vencimento).format("YYYY-MM-DD") >= moment(dataAtual).format("YYYY-MM-DD")) {
                                guiasPp[i]["statusBaixa"] = "PENDENTE"
                            } else {
                                guiasPp[i]["statusBaixa"] = "VENCIDO"
                            }

                        }
                        graficos.pendenteExib = graficos.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                        const guiasCancel = guias.filter(g => g.condPag == "CANCELADO")
                        graficos.qtdCancel = guiasCancel.length
                        for (let i = 0; i < guiasCancel.length; i++) {
                            graficos.valorCancel += guiasCancel[i].valor
                        }

                        const guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                        graficos.qtdPago = guiasPagas.length
                        for (let i = 0; i < guiasPagas.length; i++) {
                            graficos.valorPago += guiasPagas[i].valor
                        }

                        const guiasVencidas = guias.filter(g => moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                        graficos.qtdVenciados = guiasVencidas.length
                        for (let i = 0; i < guiasVencidas.length; i++) {
                            graficos.valorVencido += guiasVencidas[i].valor
                        }

                        graficos.qtdTotal = guias.length
                        for (let i = 0; i < guias.length; i++) {
                            graficos.valorTotal += guias[i].valor
                        }

                        res.render('painelPrincipal/painelGaragem', { guiasPp, periodo, graficos, empresas })
                    }).catch((err) => {
                        req.flash('error_msg', "Painel principal, busca de guias ERRO: " + err)
                        res.redirect('/error')
                    })
                }

            }).catch((err) => {
                req.flash('error_msg', "Painel principal, busca de periodo ERRO: " + err)
                res.redirect('/error')
            })
        }).catch((err) => {
            req.flash('error_msg', "Painel principal, busca de empresa ERRO: " + err)
            res.redirect('/error')
        })
    } else {
        const anoBusca = moment(new Date()).format("YYYY")
        const mesBusca = moment(new Date()).format("MM")
        Empresa.find().then(empresas => {
            Periodo.findOne({ ano: anoBusca, mes: mesBusca, empresa: empresa }).populate('empresa').then(periodo => {
                if (!periodo) {
                    var erros = [{ text: "Não existe perido criado para o mês atual, referentes a empresa " }];
                    res.render('painelPrincipal/painelGaragem', { erros, empresas })
                } else {
                    GuiaCarga.find({ periodo: periodo._id }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('cliente').then((guias) => {
                        const graficos = {
                            qtdTotal: 0,
                            valorTotal: 0,
                            qtdCancel: 0,
                            valorCancel: 0,
                            qtdPago: 0,
                            valorPago: 0,
                            qtdVenciados: 0,
                            valorVencido: 0,
                            qtdPendente: 0,
                            valorPendente: 0,
                            pendenteExib: ""
                        }
                        const guiasPp = guias.filter(g => g.baixaPag == false)
                        graficos.qtdPendente = guiasPp.length
                        for (let i = 0; i < guiasPp.length; i++) {
                            graficos.valorPendente += guiasPp[i].valor
                            guiasPp[i]["date_entrada"] = moment(guiasPp[i].dateEntrada).format('DD/MM/YYYY')
                            guiasPp[i]["date_vencimento"] = moment(guiasPp[i].vencimento).format('DD/MM/YYYY')
                            guiasPp[i]["valorExib"] = guiasPp[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            if (moment(guiasPp[i].vencimento).format("YYYY-MM-DD") >= moment(dataAtual).format("YYYY-MM-DD")) {
                                guiasPp[i]["statusBaixa"] = "PENDENTE"
                            } else {
                                guiasPp[i]["statusBaixa"] = "VENCIDO"
                            }

                        }
                        graficos.pendenteExib = graficos.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                        const guiasCancel = guias.filter(g => g.condPag == "CANCELADO")
                        graficos.qtdCancel = guiasCancel.length
                        for (let i = 0; i < guiasCancel.length; i++) {
                            graficos.valorCancel += guiasCancel[i].valor
                        }

                        const guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                        graficos.qtdPago = guiasPagas.length
                        for (let i = 0; i < guiasPagas.length; i++) {
                            graficos.valorPago += guiasPagas[i].valor
                        }

                        const guiasVencidas = guias.filter(g => moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                        graficos.qtdVenciados = guiasVencidas.length
                        for (let i = 0; i < guiasVencidas.length; i++) {
                            graficos.valorVencido += guiasVencidas[i].valor
                        }

                        graficos.qtdTotal = guias.length
                        for (let i = 0; i < guias.length; i++) {
                            graficos.valorTotal += guias[i].valor
                        }

                        res.render('painelPrincipal/painelGaragem', { guiasPp, periodo, graficos, empresas })
                    }).catch((err) => {
                        req.flash('error_msg', "Painel principal, busca de guias ERRO: " + err)
                        res.redirect('/error')
                    })
                }

            }).catch((err) => {
                req.flash('error_msg', "Painel principal, busca de periodo ERRO: " + err)
                res.redirect('/error')
            })
        }).catch((err) => {
            req.flash('error_msg', "Painel principal, busca de empresa ERRO: " + err)
            res.redirect('/error')
        })
    }


})*/

module.exports = router