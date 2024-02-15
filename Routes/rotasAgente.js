const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado } = require('../helpers/eAdmin')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')


router.get('/', lOgado, (req, res) => {
    const usuario = req.user
    Agencia.findById(usuario.agencia).then((agencia) => {
        GuiaCarga.find({ baixaEntr: false, origem: usuario.agencia }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasRem) => {
            for (let i = 0; i < guiasRem.length; i++) {
                guiasRem[i]["date_entrada"] = moment(guiasRem[i].dateEntrada).format('DD/MM/YYYY')
                guiasRem[i]["date_vencimento"] = moment(guiasRem[i].vencimento).format('DD/MM/YYYY')
                guiasRem[i]["valorExib"] = guiasRem[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                if (guiasRem[i].baixa == true || guiasRem[i].baixa == "true") {
                    guiasRem[i]["statusBaixa"] = "PAGO"
                } else {
                    if (moment(guiasRem[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                        guiasRem[i]["statusBaixa"] = "VENCIDO"
                    } else {
                        guiasRem[i]["statusBaixa"] = "PENDENTE"
                    }
                }
            }

            GuiaCarga.find({ baixaEntr: false, destino: usuario.agencia }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasDest) => {
                for (let i = 0; i < guiasDest.length; i++) {
                    guiasDest[i]["date_entrada"] = moment(guiasDest[i].dateEntrada).format('DD/MM/YYYY')
                    guiasDest[i]["date_vencimento"] = moment(guiasDest[i].vencimento).format('DD/MM/YYYY')
                    guiasDest[i]["valorExib"] = guiasDest[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (guiasDest[i].baixa == true || guiasDest[i].baixa == "true") {
                        guiasDest[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(guiasDest[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            guiasDest[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            guiasDest[i]["statusBaixa"] = "PENDENTE"
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
                    res.render('painelPrincipal/painelAgente', { guiasRem, guiasAc, guiasDest, agencia })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar guias pendentes " + err)
                    res.redirect('/error')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar guias " + err)
                res.redirect('/error')
            })

        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar guias " + err)
            res.redirect('/error')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar agencias " + err)
        res.redirect('/error')
    })
})

module.exports = router