const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado } = require('../helpers/eAdmin')
require('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')

//Painel principal das guias

router.get('/', lOgado, (req, res) => {
    const usuario = req.user
    if (usuario.eAdmin == true) {

        GuiaCarga.find({ $nor: [{ entrega: "ENTREGUE AO DESTINATARIO" }, { entrega: "DEVOLVIDO AO REMETENTE" }] }).sort({ dateEntrada: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasGe) => {
            for (let i = 0; i < guiasGe.length; i++) {
                guiasGe[i]["date_entrada"] = moment(guiasGe[i].dateEntrada).format('DD/MM/YYYY')
                guiasGe[i]["date_vencimento"] = moment(guiasGe[i].vencimento).format('DD/MM/YYYY')
                guiasGe[i]["valorExib"] = guiasGe[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                if (guiasGe[i].baixa == true || guiasGe[i].baixa == "true") {
                    guiasGe[i]["statusBaixa"] = "PAGO"
                } else {
                    if (moment(guiasGe[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                        guiasGe[i]["statusBaixa"] = "VENCIDO"
                    } else {
                        guiasGe[i]["statusBaixa"] = "PENDENTE"
                    }
                }
            }

            GuiaCarga.find({ baixa: false, condPag: "A COBRAR", destino: usuario.agencia }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasAc) => {
                for (let i = 0; i < guiasAc.length; i++) {
                    guiasAc[i]["date_entrada"] = moment(guiasAc[i].dateEntrada).format('DD/MM/YYYY')
                    guiasAc[i]["date_vencimento"] = moment(guiasAc[i].vencimento).format('DD/MM/YYYY')
                    guiasAc[i]["valorExib"] = guiasAc[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (guiasAc[i].baixa == true || guiasAc[i].baixa == "true") {
                        guiasAc[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(guiasAc[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            guiasAc[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            guiasAc[i]["statusBaixa"] = "PENDENTE"
                        }
                    }
                }
                res.render('painelPrincipal/painelAdmin', { guiasAc, guiasGe })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar guias pendentes")
                res.render('painelPrincipal/index')
            })
        })

    } else {
        switch (usuario.perfil) {

            case "FINANCEIRO":
                Agencia.findById(usuario.agencia).then((agencia) => {
                    GuiaCarga.find({ baixa: false, condPag: "FATURADO" }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasFin) => {
                        for (let i = 0; i < guiasFin.length; i++) {
                            guiasFin[i]["date_entrada"] = moment(guiasFin[i].dateEntrada).format('DD/MM/YYYY')
                            guiasFin[i]["date_vencimento"] = moment(guiasFin[i].vencimento).format('DD/MM/YYYY')
                            guiasFin[i]["valorExib"] = guiasFin[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            if (guiasFin[i].baixa == true || guiasFin[i].baixa == "true") {
                                guiasFin[i]["statusBaixa"] = "PAGO"
                            } else {
                                if (moment(guiasFin[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                    guiasFin[i]["statusBaixa"] = "VENCIDO"
                                } else {
                                    guiasFin[i]["statusBaixa"] = "PENDENTE"
                                }
                            }
                        }
                        res.render('painelPrincipal/index', { guiasFin, agencia })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao Buscar guias pendentes")
                        res.render('painelPrincipal/index')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar Agencia")
                    res.render('painelPrincipal/index')
                })

                break;

            case "AGENTE":
                Agencia.findById(usuario.agencia).then((agencia) => {
                    GuiaCarga.find({ $nor: [{ entrega: "ENTREGUE AO DESTINATARIO" }, { entrega: "DEVOLVIDO AO REMETENTE" }], destino: usuario.agencia }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasGe) => {
                        for (let i = 0; i < guiasGe.length; i++) {
                            guiasGe[i]["date_entrada"] = moment(guiasGe[i].dateEntrada).format('DD/MM/YYYY')
                            guiasGe[i]["date_vencimento"] = moment(guiasGe[i].vencimento).format('DD/MM/YYYY')
                            guiasGe[i]["valorExib"] = guiasGe[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            if (guiasGe[i].baixa == true || guiasGe[i].baixa == "true") {
                                guiasGe[i]["statusBaixa"] = "PAGO"
                            } else {
                                if (moment(guiasGe[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                    guiasGe[i]["statusBaixa"] = "VENCIDO"
                                } else {
                                    guiasGe[i]["statusBaixa"] = "PENDENTE"
                                }
                            }
                        }

                        GuiaCarga.find({ baixa: false, condPag: "A COBRAR", destino: usuario.agencia }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasAc) => {
                            for (let i = 0; i < guiasAc.length; i++) {
                                guiasAc[i]["date_entrada"] = moment(guiasAc[i].dateEntrada).format('DD/MM/YYYY')
                                guiasAc[i]["date_vencimento"] = moment(guiasAc[i].vencimento).format('DD/MM/YYYY')
                                guiasAc[i]["valorExib"] = guiasAc[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                if (guiasAc[i].baixa == true || guiasAc[i].baixa == "true") {
                                    guiasAc[i]["statusBaixa"] = "PAGO"
                                } else {
                                    if (moment(guiasAc[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                        guiasAc[i]["statusBaixa"] = "VENCIDO"
                                    } else {
                                        guiasAc[i]["statusBaixa"] = "PENDENTE"
                                    }
                                }
                            }
                            res.render('painelPrincipal/index', { guiasAc, guiasGe, agencia })
                        }).catch((err) => {
                            req.flash('error_msg', "Erro ao Buscar guias pendentes")
                            res.render('painelPrincipal/index')
                        })
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar agencias")
                    res.render('painelPrincipal/index')
                })
                break;

            case "ARRECADACAO":

                Agencia.findById(usuario.agencia).then((agencia) => {
                    GuiaCarga.find({ baixa: false, condPag: "A VISTA" }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasFin) => {
                        for (let i = 0; i < guiasFin.length; i++) {
                            guiasFin[i]["date_entrada"] = moment(guiasFin[i].dateEntrada).format('DD/MM/YYYY')
                            guiasFin[i]["date_vencimento"] = moment(guiasFin[i].vencimento).format('DD/MM/YYYY')
                            guiasFin[i]["valorExib"] = guiasFin[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            if (guiasFin[i].baixa == true || guiasFin[i].baixa == "true") {
                                guiasFin[i]["statusBaixa"] = "PAGO"
                            } else {
                                if (moment(guiasFin[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                    guiasFin[i]["statusBaixa"] = "VENCIDO"
                                } else {
                                    guiasFin[i]["statusBaixa"] = "PENDENTE"
                                }
                            }
                        }
                        res.render('painelPrincipal/index', { guiasFin, agencia })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao Buscar guias pendentes")
                        res.render('painelPrincipal/index')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar Agencia")
                    res.render('painelPrincipal/index')
                })

                break;
        }
    }


})

module.exports = router