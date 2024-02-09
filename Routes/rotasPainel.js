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
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')

//Painel principal das guias

router.get('/', lOgado, (req, res) => {
    const usuario = req.user
    if (usuario.eAdmin == true) {
        res.redirect('/painel/administrador')
    } else {
        switch (usuario.perfil) {
            case "FINANCEIRO":
                res.redirect('/painel/financeiro')
                break;

            case "AGENTE":
                res.redirect('/painel/agencias')
                break;

            case "ARRECADACAO":
                res.redirect('/painel/arrecadacao')
                break;
            case "GARAGEM":
                res.redirect('/painel/garagem')
                break;
        }
    }
})

router.get('/financeiro', lOgado, (req, res) => {
    const usuario = req.user
    Agencia.findById(usuario.agencia).then((agencia) => {
        GuiaCarga.find({ baixaPag: false, condPag: "FATURADO" }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasFin) => {
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
            const qtd_guias = guiasFin.length
            res.render('painelPrincipal/painelFinanc', { guiasFin, agencia, qtd_guias })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar guias pendentes")
            res.render('painelPrincipal/index')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Agencia")
        res.render('painelPrincipal/index')
    })
})

router.get('/administrador', lOgado, (req, res) => {
    const usuario = req.user
    const dataAtual = moment(moment('01/15/2024', 'MM/DD/YYYY', true).format()).format()
    Periodo.find({ dateInit: { $lte: dataAtual }, dateFin: { $gte: dataAtual } }).populate('empresa').then(periodo => {
        GuiaCarga.find({ $nor: [{ entrega: "ENTREGUE AO DESTINATARIO" }, { entrega: "DEVOLVIDO AO REMETENTE" }, { condPag: "CANCELADO" }] }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasPe) => {
            for (let i = 0; i < guiasPe.length; i++) {
                guiasPe[i]["date_entrada"] = moment(guiasPe[i].dateEntrada).format('DD/MM/YYYY')
                guiasPe[i]["date_vencimento"] = moment(guiasPe[i].vencimento).format('DD/MM/YYYY')
                guiasPe[i]["valorExib"] = guiasPe[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                if (guiasPe[i].baixa == true || guiasPe[i].baixa == "true") {
                    guiasPe[i]["statusBaixa"] = "PAGO"
                } else {
                    if (moment(guiasPe[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                        guiasPe[i]["statusBaixa"] = "VENCIDO"
                    } else {
                        guiasPe[i]["statusBaixa"] = "PENDENTE"
                    }
                }
            }
            const qtd_guiasPe = guiasPe.length

            GuiaCarga.find({ baixaPag: false, condPag: "A COBRAR" }).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ numero: 1 }).then((guiasAc) => {
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
                const qtd_guiasAc = guiasAc.length

                GuiaCarga.find({ baixaPag: false, $nor: [{ condPag: "A COBRAR" }] }).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ numero: 1 }).then((guiasPp) => {
                    for (let i = 0; i < guiasPp.length; i++) {
                        guiasPp[i]["date_entrada"] = moment(guiasPp[i].dateEntrada).format('DD/MM/YYYY')
                        guiasPp[i]["date_vencimento"] = moment(guiasPp[i].vencimento).format('DD/MM/YYYY')
                        guiasPp[i]["valorExib"] = guiasPp[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        if (guiasPp[i].baixa == true || guiasPp[i].baixa == "true") {
                            guiasPp[i]["statusBaixa"] = "PAGO"
                        } else {
                            if (moment(guiasPp[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                guiasPp[i]["statusBaixa"] = "VENCIDO"
                            } else {
                                guiasPp[i]["statusBaixa"] = "PENDENTE"
                            }
                        }
                    }
                    const qtd_guiasPp = guiasPp.length

                    res.render('painelPrincipal/painelAdmin', { guiasAc, guiasPe, guiasPp, qtd_guiasPe, qtd_guiasAc, qtd_guiasPp, periodo })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar guias pendentes")
                    res.render('painelPrincipal/index')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar guias pendentes")
                res.render('painelPrincipal/index')
            })
        })
    })

})

router.get('/agencias', lOgado, (req, res) => {
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

router.get('/arrecadacao', lOgado, (req, res) => {
    const usuario = req.user
    Agencia.findById(usuario.agencia).then((agencia) => {
        GuiaCarga.find({ baixa: false, condPag: "A VISTA" }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasFin) => {
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
})

router.get('/garagem', lOgado, (req, res) => {
    const usuario = req.user
    GuiaCarga.find({ $nor: [{ entrega: "ENTREGUE AO DESTINATARIO" }, { entrega: "DEVOLVIDO AO REMETENTE" }, { condPag: "CANCELADO" }] }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasPe) => {
        for (let i = 0; i < guiasPe.length; i++) {
            guiasPe[i]["date_entrada"] = moment(guiasPe[i].dateEntrada).format('DD/MM/YYYY')
            guiasPe[i]["date_vencimento"] = moment(guiasPe[i].vencimento).format('DD/MM/YYYY')
            guiasPe[i]["valorExib"] = guiasPe[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            if (guiasPe[i].baixaPag == true || guiasPe[i].baixaPag == "true") {
                guiasPe[i]["statusBaixa"] = "PAGO"
            } else {
                if (moment(guiasPe[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                    guiasPe[i]["statusBaixa"] = "VENCIDO"
                } else {
                    guiasPe[i]["statusBaixa"] = "PENDENTE"
                }
            }
        }
        const qtd_guiasPe = guiasPe.length

        GuiaCarga.find({ baixaPag: false, condPag: "A COBRAR" }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasAc) => {
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
            const qtd_guiasAc = guiasAc.length

            GuiaCarga.find({ baixaPag: false, $nor: [{ condPag: "A COBRAR" }] }).sort({ numero: 1 }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((guiasPp) => {
                for (let i = 0; i < guiasPp.length; i++) {
                    guiasPp[i]["date_entrada"] = moment(guiasPp[i].dateEntrada).format('DD/MM/YYYY')
                    guiasPp[i]["date_vencimento"] = moment(guiasPp[i].vencimento).format('DD/MM/YYYY')
                    guiasPp[i]["valorExib"] = guiasPp[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (guiasPp[i].baixa == true || guiasPp[i].baixa == "true") {
                        guiasPp[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(guiasPp[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            guiasPp[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            guiasPp[i]["statusBaixa"] = "PENDENTE"
                        }
                    }
                }
                const qtd_guiasPp = guiasPp.length

                res.render('painelPrincipal/painelGaragem', { guiasAc, guiasPe, guiasPp, qtd_guiasPe, qtd_guiasAc, qtd_guiasPp })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar guias pendentes")
                res.render('painelPrincipal/index')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar guias pendentes")
            res.render('painelPrincipal/index')
        })
    })
})

module.exports = router