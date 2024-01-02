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
    Agencia.findById(usuario.agencia).then((agencia) => {
        if (agencia.cidade == "Geral") {
            GuiaCarga.find({ baixa: false, $nor: [{ condPag: "A COBRAR" }] }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasGe) => {
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
                GuiaCarga.find({ baixa: false, condPag: "A COBRAR" }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasAc) => {
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
        } else {
            GuiaCarga.find({ baixa: false, $nor: [{ condPag: "A COBRAR" }], destino: usuario.agencia }).sort({ vencimento: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasGe) => {
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
        }


    })



})

module.exports = router