const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado } = require('../helpers/eAdmin')
const e = require('connect-flash')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')
require('../models/Comissao')
const Comissao = mongoose.model('comissoes')

router.get('/', lOgado, (req, res) => {
    const usuario = req.user
    Agencia.findById(usuario.agencia).then((agencia) => {
        const dataAtual = moment(new Date()).format()
        const { empresa } = req.query
        if (!empresa) {
            Empresa.find().then(empresas => {
                Periodo.findOne({ dateInit: { $lte: dataAtual }, dateFin: { $gte: dataAtual } }).populate('empresa').then(periodo => {
                    //console.log(periodo)
                    if (!periodo) {
                        var erros = []
                        erros.push({ texto: "Ainda não foram inseridos dados referentes ao mês atual" })
                        res.render('painelPrincipal/painelAgente', { erros, empresas })
                    } else {
                        GuiaCarga.find({ $and: [{ periodo: periodo._id }, { $or: [{ origem: usuario.agencia }, { destino: usuario.agencia }] }] }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('cliente').then((guias) => {
                            var graficos = {
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
                                pendenteExib: "",
                                pendenteEntrega: 0
                            }

                            var guiasPp = guias.filter(g => g.baixaPag == false && String(g.origem._id) == String(agencia._id) && moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                            var guiasPe = guias.filter(g => g.baixaEntr == false && String(g.destino._id) == String(agencia._id))
                            graficos.pendenteEntrega = guiasPe.length
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

                            var guiasCancel = guias.filter(g => g.condPag == "CANCELADO" && String(g.origem._id) == String(agencia._id))
                            graficos.qtdCancel = guiasCancel.length
                            for (let i = 0; i < guiasCancel.length; i++) {
                                graficos.valorCancel += guiasCancel[i].valor
                            }

                            var guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO" && String(g.origem._id) == String(agencia._id))
                            graficos.qtdPago = guiasPagas.length
                            for (let i = 0; i < guiasPagas.length; i++) {
                                graficos.valorPago += guiasPagas[i].valor
                            }

                            var guiasVencidas = guias.filter(g => moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY') && g.baixaPag == false && String(g.origem._id) == String(agencia._id))
                            graficos.qtdVenciados = guiasVencidas.length
                            for (let i = 0; i < guiasVencidas.length; i++) {
                                graficos.valorVencido += guiasVencidas[i].valor
                            }
                            var total = guias.filter(g => String(g.origem._id) == String(agencia._id))
                            graficos.qtdTotal = total.length
                            for (let i = 0; i < total.length; i++) {
                                graficos.valorTotal += total[i].valor
                            }
                            res.render('painelPrincipal/painelAgente', { guiasPp, guiasPe, periodo, graficos, empresas, agencia })
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
            Empresa.find().then(empresas => {
                Periodo.findOne({ dateInit: { $lte: dataAtual }, dateFin: { $gte: dataAtual }, empresa: empresa }).populate('empresa').then(periodo => {
                    if (!periodo) {
                        req.flash('error_msg', "Não existe dados referentes a data atual para a empresa selecionalda!")
                        res.redirect('/agencias')

                    } else {
                        GuiaCarga.find({ periodo: periodo._id, $or: [{ origem: agencia._id }, { destino: agencia._id }] }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('cliente').then((guias) => {
                            var graficos = {
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
                            const guiasPp = guias.filter(g => g.baixaPag == false && String(g.origem._id) == String(agencia._id) && moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                            const guiasPe = guias.filter(g => g.baixaEntr == false && String(g.destino._id) == String(agencia._id))

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

                            const guiasCancel = guias.filter(g => g.condPag == "CANCELADO" && String(g.origem._id) == String(agencia._id))
                            graficos.qtdCancel = guiasCancel.length
                            for (let i = 0; i < guiasCancel.length; i++) {
                                graficos.valorCancel += guiasCancel[i].valor
                            }

                            const guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO" && String(g.origem._id) == String(agencia._id))
                            graficos.qtdPago = guiasPagas.length
                            for (let i = 0; i < guiasPagas.length; i++) {
                                graficos.valorPago += guiasPagas[i].valor
                            }

                            const guiasVencidas = guias.filter(g => moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY') && String(g.origem._id) == String(agencia._id))
                            graficos.qtdVenciados = guiasVencidas.length
                            for (let i = 0; i < guiasVencidas.length; i++) {
                                graficos.valorVencido += guiasVencidas[i].valor
                            }

                            var total = guias.filter(g => String(g.origem._id) == String(agencia._id))
                            graficos.qtdTotal = total.length
                            for (let i = 0; i < total.length; i++) {
                                graficos.valorTotal += total[i].valor
                            }

                            res.render('painelPrincipal/painelAgente', { guiasPp, guiasPe, periodo, graficos, empresas, agencia })
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

    })
})

router.get('/minhas_comissoes', lOgado, (req, res) => {
    const { ano } = req.query
    const usuario = req.user
    if (usuario.perfil != "AGENTE") {
        req.flash('error_msg', "Acesso Liberado somente para agentes")
        res.redirect('/agencias')
    } else {
        if (!ano) {
            Agencia.findById(usuario.agencia).then((agencia) => {
                res.render('agencia/minha_comissao_cargas', { agencia })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar agencia", err)
                res.redirect('/error')
            })
        } else {
            Agencia.findById(usuario.agencia).then((agencia) => {
                Comissao.find({ agencia: agencia._id, ano: ano }).sort({ mes: 1 }).populate('empresa').then((dados) => {
                    if (dados.length < 1) {
                        var error = [{ text: "Não existem comissões claculadas para o ano selecionado" }]
                        res.render('agencia/minha_comissao_cargas', { agencia, error })

                    } else {
                        var resumo = {
                            ano: ano,
                            qtdVendasAno: 0,
                            valorVendasAno: 0,
                            comssAno: 0,
                            valorVendasAnoExib: "",
                            comissAnoExib: ""
                        }
                        dados.forEach(dado => {
                            dado["totalVendasExib"] = dado.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            dado["totalValidasExib"] = dado.totalValidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            dado["totalCanceladoExib"] = dado.totalCancelado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            dado["valorExib"] = dado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            resumo.valorVendasAno += dado.totalValidas
                            resumo.qtdVendasAno += dado.qtdValidos
                            resumo.comssAno += dado.valor
                        });

                        resumo.valorVendasAnoExib = resumo.valorVendasAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        resumo.comissAnoExib = resumo.comssAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        res.render('agencia/minha_comissao_cargas', { agencia, dados, resumo })


                    }

                }).catch((err) => {
                    req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                    res.redirect('/error')
                })

            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar agencia", err)
                res.redirect('/error')
            })
        }



    }
})

module.exports = router