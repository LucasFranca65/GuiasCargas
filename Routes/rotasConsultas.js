const express = require('express')
const { default: mongoose, model, mongo } = require('mongoose')
const router = express.Router()
const moment = require('moment')
const { eAdmin, lOgado, eDigitador, eControle } = require('../helpers/eAdmin')
const { route } = require('./rotasAdministrador')
const pdf = require('html-pdf')
//Mongoose Models
require('../models/User')
const User = mongoose.model('users')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/Cliente')
const Cliente = mongoose.model('clientes')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')
require('../models/Comissao')
const Comissao = mongoose.model('comissoes')
//BUSCA POR EMPRESA 



router.get('/detalhado_do_periodo', eDigitador, (req, res) => {

    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        Periodo.find().then((periodos) => {
            for (let i = 0; i < periodos.length; i++) {
                periodos[i]['inicial'] = moment(periodos[i].dateInit).format('DD/MM/YYYY')
                periodos[i]['final'] = moment(periodos[i].dateFin).format('DD/MM/YYYY')
            }
            const abertos = periodos.filter(p => p.status == "Aberto")
            const fechados = periodos.filter(p => p.status == "Fechado")
            var title = {
                qtd: periodos.length,
                qtdAbertos: abertos.length,
                qtdFechados: fechados.length,
            }
            res.render('consultasRelatorios/guias_cargas/detalhadoPeriodo', { periodos, title })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar periodos agencias ERRO:", err)
            res.redirect('/error')
        })
    }


})

router.get('/guias_cadastradas', eDigitador, (req, res) => {
    const usuario = req.user
    GuiaCarga.count().then((qtd) => {

        if (qtd < 1) {
            req.flash('error_msg', "Não existem guias cadastradas no sistema")
            res.redirect('/error')
        } else {
            var { offset, page } = req.query
            const limit = 20
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

            GuiaCarga.find().limit(limit).skip(offset).populate('cliente').populate('destino').populate('origem').populate('empresa').sort({ numero: 1 }).then((dados) => {
                var next = ""
                var prev = ""

                if (page == 1) {
                    prev = "disabled"
                }
                if (limit > dados.length || offset + limit >= qtd) {
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
                        dados[i]["date_vencimento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                        dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        dados[i]["n"] = (i + 1) + offset
                        if (dados[i].baixaPag == true && dados[i].statusPag == "CANCELADO") {
                            dados[i]["statusBaixa"] = "CANCELADO"
                        }
                        else if (dados[i].baixaPag == true && dados[i].statusPag != "CANCELADO") {
                            dados[i]["statusBaixa"] = "PAGO"
                        }
                        else if (dados[i].baixaPag == false && moment(dados[i].vencimento).format("MM-DD-YYYY") >= moment(new Date()).format("MM-DD-YYYY")) {
                            dados[i]["statusBaixa"] = "PENDENTE"
                        }
                        else if (dados[i].baixaPag == false && moment(dados[i].vencimento).format("MM-DD-YYYY") < moment(new Date()).format("MM-DD-YYYY")) {
                            dados[i]["statusBaixa"] = "VENCIDO"
                        }
                        i++
                    }
                    res.render('consultasRelatorios/guias_cargas/todas_guias', { dados, nextUrl, prevUrl, page, prev, next })
                }

            }).catch((err) => {
                req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                res.redirect('/painel')
            })
        }

    }).catch((err) => {
        req.flash('error_msg', "Impossivel contar guias", err)
        res.redirect('/painel')
    })

})


router.get('/guias_cadastradas/por_empresa', eDigitador, (req, res) => {
    const { empresa } = req.query
    if (!empresa) {
        Empresa.find().then(empresas => {
            res.render('consultasRelatorios/guias_cargas/guias_por_empresa', { empresas })
        }).catch(err => {
            req.flash('error_msg', "Erro interno ", err)
            res.redirect('/erro')
        })
    } else {
        const empresaSelec = empresa
        Empresa.find().then(empresas => {
            GuiaCarga.count({ empresa: empresa }).then((qtd) => {

                if (qtd < 1) {
                    req.flash('error_msg', "Não existem guias cadastradas no sistema, para a empresa selecionada")
                    res.redirect('/consultas/guias_cadastradas/por_empresa')
                } else {
                    var { offset, page } = req.query
                    const limit = 20
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

                    GuiaCarga.find({ empresa: empresa }).limit(limit).skip(offset).populate('cliente').populate('destino').populate('origem').populate('empresa').sort({ numero: 1 }).then((dados) => {
                        var next = ""
                        var prev = ""

                        if (page == 1) {
                            prev = "disabled"
                        }
                        if (limit > dados.length || offset + limit >= qtd) {
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
                                dados[i]["date_vencimento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                                dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                dados[i]["n"] = (i + 1) + offset
                                if (dados[i].baixaPag == true && dados[i].statusPag == "CANCELADO") {
                                    dados[i]["statusBaixa"] = "CANCELADO"
                                }
                                else if (dados[i].baixaPag == true && dados[i].statusPag != "CANCELADO") {
                                    dados[i]["statusBaixa"] = "PAGO"
                                }
                                else if (dados[i].baixaPag == false && moment(dados[i].vencimento).format("MM-DD-YYYY") >= moment(new Date()).format("MM-DD-YYYY")) {
                                    dados[i]["statusBaixa"] = "PENDENTE"
                                }
                                else if (dados[i].baixaPag == false && moment(dados[i].vencimento).format("MM-DD-YYYY") < moment(new Date()).format("MM-DD-YYYY")) {
                                    dados[i]["statusBaixa"] = "VENCIDO"
                                }
                                i++
                            }
                            res.render('consultasRelatorios/guias_cargas/guias_por_empresa', { dados, nextUrl, prevUrl, page, prev, next, empresaSelec, empresas })
                        }

                    }).catch((err) => {
                        req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                        res.redirect('/painel')
                    })
                }

            }).catch((err) => {
                req.flash('error_msg', "Impossivel contar guias", err)
                res.redirect('/painel')
            })
        }).catch(err => {
            req.flash('error_msg', "Erro interno ", err)
            res.redirect('/erro')
        })

    }


})



router.get('/hitorico_de_comissao', eDigitador, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        Agencia.find().sort({ cidade: 1 }).then(agencias => {
            const { ano, agencia } = req.query

            if (!ano || !agencia) {
                res.render('consultasRelatorios/guias_cargas/historico_comissao', { agencias })
            } else {
                Agencia.findById(agencia).then((agc) => {
                    Comissao.find({ ano: ano, agencia: agencia }).populate('empresa').sort({ mes: 1 }).then((historico) => {
                        for (let i = 0; i < historico.length; i++) {

                            historico[i]["valor_exib"] = historico[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            historico[i]["validos_exib"] = historico[i].totalValidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            historico[i]["cancelados_exib"] = historico[i].totalCancelado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                        }
                        res.render('consultasRelatorios/guias_cargas/historico_comissao', { historico, agc })

                    })
                })
            }
        })

    }
})

router.get('/por_empresa/pesquisar', eDigitador, (req, res) => {

    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {

        var { empresa, dateMin, dateMax, offset, page } = req.query
        //console.log(empresa, dateMin,dateMax, offset, page)
        dateMax = moment(dateMax).format()
        dateMin = moment(dateMin).format()
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
        if (dateMax < dateMin) {
            req.flash('error_msg', "A data inicial não pode ser menor que a final")
            res.redirect('/consulta/por_empresa')
        } else {
            Empresa.find().then((empresas) => {
                let query = { dateEntrada: { $gte: dateMin, $lt: dateMax }, empresa: empresa }
                GuiaCarga.find(query).populate('origem').populate('destino').populate('empresa').populate('cliente').limit(limit).skip(offset).sort({ dateEntrada: 1 }).then((dados) => {
                    if (dados.length == 0) {
                        req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                        res.redirect('/consultas/por_empresa')
                    } else {
                        var next, prev
                        if (page == 1) {
                            prev = "disabled"
                        }
                        if (dados.length <= limit) {
                            next = "disabled"
                        }
                        var nextUrl = {
                            emp: empresa,
                            dmin: moment(dateMin).format('YYYY-MM-DD'),
                            dmax: moment(dateMax).format('YYYY-MM-DD'),
                            ofst: offset + limit,
                            pag: page + 1,
                        }
                        var prevUrl = {
                            emp: empresa,
                            dmin: moment(dateMin).format('YYYY-MM-DD'),
                            dmax: moment(dateMax).format('YYYY-MM-DD'),
                            ofst: offset - limit,
                            pag: page - 1
                        }

                        var i = 0
                        while (i < dados.length) {
                            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                            dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                            dados[i]["date_vencimento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')

                            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                            if (dados[i].baixa == true) {
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
                        res.render('consultasRelatorios/guias_cargas/porEmpresa', { dados, nextUrl, prevUrl, page, prev, next, empresas })
                    }

                }).catch((err) => {
                    req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado")
                    res.redirect('/consultas/por_empresa')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar empresas")
                res.redirect('/consultas/por_empresa')
            })


        }
    }
})

//BUSCA POR USUARIO
/*router.get('/por_usuario', lOgado, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        let next = "disabled", prev = "disabled"
        User.find().then((users) => {
            res.render('consultasRelatorios/porUsuario', { users, next, prev })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar usuarios")
            res.redirect('/painel')
        })
    }

})

router.get('/por_usuario/pesquisar', lOgado, (req, res) => {
    var { usuario, dateMin, dateMax, offset, page } = req.query
    //console.log(usuario ,dateMin , dateMax, offset, page)
    //res.redirect('/consultas/por_usuario')
    const limit = 20
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

    dateMax = moment(dateMax).format("YYYY-MM-DDT23:59:59.SSSZ")
    dateMin = moment(dateMin).format("YYYY-MM-DDT00:00:00.SSSZ")

    if (dateMax < dateMin) {
        req.flash('error_msg', "A data inicial não pode ser menor que a final")
        res.redirect('/consulta/por_usuario')
    } else {
        let query = { dateEntrada: { $gte: dateMin, $lt: dateMax }, user: usuario }

        GuiaCarga.find(query).limit(limit).skip(offset).sort({ dateEntrada: 1 }).then((dados) => {
            var next, prev
            if (page == 1) {
                prev = "disabled"
            }
            if (dados.length <= limit) {
                next = "disabled"
            }
            if (dados.length == 0) {
                req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                res.redirect('/consultas/por_usuario')
            }
            else {
                var nextUrl = {
                    user: usuario,
                    dmin: dateMin,
                    dmax: dateMax,
                    ofst: offset + limit,
                    pag: page + 1,
                }
                var prevUrl = {
                    user: usuario,
                    dmin: dateMin,
                    dmax: dateMax,
                    ofst: offset - limit,
                    pag: page - 1
                }
                var i = 0
                while (i < dados.length) {
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    dados[i]["n"] = (i + 1) + offset
                    if (dados[i].baixa == true) {
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
                res.render('consultasRelatorios/porUsuario', { dados, nextUrl, prevUrl, page, next, prev })
            }

        }).catch((err) => {
            req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado")
            console.log(err)
            res.redirect('/consultas/por_usuario')
        })
    }
})*/

//BUSCA POR AGENCIA  /por_entrega
router.get('/por_agencia_por_pagamento', eDigitador, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == 'AGENTE') {
        Agencia.findById(usuario.agencia).then((origem) => {
            res.render('consultasRelatorios/guias_cargas/porAgencia', { origem })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar agencias ERRO:", err)
            res.redirect('/error')
        })
    } else {
        Agencia.find({ $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
            res.render('consultasRelatorios/guias_cargas/porAgencia', { agencias })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar agencias ERRO:", err)
            res.redirect('/error')
        })
    }

})

router.get('/por_agencia_por_pagamento/pesquisar', eDigitador, (req, res) => {
    let error = []
    var { agencia, dateMin, dateMax, status } = req.query

    dateMax = moment(dateMax).format()
    dateMin = moment(dateMin).format()
    //console.log('agencia= '+agencia +', dateMin= '+ dateMin+', dateMax= '+dateMax+'limit ='+limit+'Offset='+offset)

    if (dateMax < dateMin) {
        error.push({ texto: "A data inicial não pode ser menor que a final" })
    }
    if (agencia == "selecione") {
        error.push({ texto: "Selecione uma agencia" })
    }
    if (error.length > 0) {
        Agencia.find( { $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
            res.render('consultasRelatorios/guias_cargas/porAgencia', { agencias, error })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar agencias", err)
            res.redirect('/consultas/por_agencia')
        })
    } else {
        if (agencia == "1") {
            Agencia.find({ $nor: [{ cidade: "Geral" }, { numero: '9999' }] } ).sort({ cidade: 1 }).then((agencias) => {
                //console.log(status)
                var query
                if (status == 1 || status == "1") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax } }
                } else if (status == 2 || status == "2") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, baixaPag: true }
                } else if (status == 3 || status == "3") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, baixaPag: false, vencimento: { $gt: moment(new Date()).format() } }
                } else if (status == 4 || status == "4") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, baixaPag: false, vencimento: { $lte: moment(new Date()).format() } }
                } else {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, condPag: "CANCELADO" }
                }
                //console.log(query)
                GuiaCarga.find(query).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ numero: 1 }).then((dados) => {
                    if (dados.length < 1) {
                        req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                        res.redirect('/consultas/por_agencia')
                    } else {
                        var i = 0
                        var total_vendas = 0
                        while (i < dados.length) {
                            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                            dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            //dados[i]["n"] = (i + 1) + offset
                            if (dados[i].baixaPag == true || dados[i].baixaPag == "true" && !dados[i].condPag == "CANCELADO") {
                                dados[i]["statusBaixa"] = "PAGO"
                            } else if (dados[i].condPag == "CANCELADO") {
                                dados[i]["statusBaixa"] = "CANCELADO"
                            } else {
                                if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                    dados[i]["statusBaixa"] = "VENCIDO"
                                } else {
                                    dados[i]["statusBaixa"] = "PENDENTE"
                                }
                            }
                            total_vendas += dados[i].valor
                            i++
                        }
                        title = {
                            totalVendasExib: total_vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            qtd_vendas: dados.length,
                            agencia: "TODAS",
                            dateMin, dateMax, status
                        }

                        res.render('consultasRelatorios/guias_cargas/porAgencia', { dados, agencias, title })
                    }
                }).catch((err) => {
                    req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                    res.redirect('/consultas/por_agencia')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro interno ao carregar agencias" + err)
                res.redirect('/painel')
            })
        } else {
            Agencia.find( { $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
                //console.log(status)
                var query
                if (status == 1 || status == "1") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia }
                } else if (status == 2 || status == "2") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, baixaPag: true }
                } else if (status == 3 || status == "3") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, baixaPag: false, vencimento: { $gt: moment(new Date()).format() } }
                } else if (status == 4 || status == "4") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, baixaPag: false, vencimento: { $lte: moment(new Date()).format() } }
                } else {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, condPag: "CANCELADO" }
                }
                //console.log(query)
                GuiaCarga.find(query).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ numero: 1 }).then((dados) => {
                    Agencia.findById(agencia).then((agencia) => {
                        if (dados.length < 1) {
                            req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                            res.redirect('/consultas/por_agencia')
                        } else {
                            var i = 0
                            var total_vendas = 0
                            while (i < dados.length) {
                                dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                                dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                                dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                //dados[i]["n"] = (i + 1) + offset
                                if (dados[i].baixaPag == true || dados[i].baixaPag == "true") {
                                    dados[i]["statusBaixa"] = "PAGO"
                                } else {
                                    if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                        dados[i]["statusBaixa"] = "VENCIDO"
                                    } else {
                                        dados[i]["statusBaixa"] = "PENDENTE"
                                    }
                                }
                                total_vendas += dados[i].valor
                                i++
                            }
                            title = {
                                totalVendasExib: total_vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                qtd_vendas: dados.length,
                                agencia: agencia.cidade,
                                dateMin, dateMax, status
                            }

                            res.render('consultasRelatorios/guias_cargas/porAgencia', { dados, agencias, title, agencia })
                        }
                    }).catch((err) => {
                        req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                        res.redirect('/consultas/por_agencia')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                    res.redirect('/consultas/por_agencia')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro interno ao carregar agencias" + err)
                res.redirect('/painel')
            })
        }

    }
})

router.get('/vendas_por_agencia', eDigitador, (req, res) => {

    const { empresa, dateMin, dateMax } = req.query
    if (!empresa) {
        Empresa.find().sort({ cidade: 1 }).then(empresas => {
            res.render('consultasRelatorios/guias_cargas/vendasPorAgencia', { empresas })

        }).catch(err => {
            req.flash('error_msg', "Erro interno ", err)
            res.redirect('/error')
        })
    } else {
        
            Empresa.find().sort({ cidade: 1 }).then((empresas) => {
                Empresa.findById(empresa).then((aEmpresa) => {
                    const dateInit = moment(dateMin).format()
                    const dateFin = moment(dateMax).format()
                    let query = { dateEntrada: { $gte: dateInit, $lt: dateFin }, empresa: empresa}
                    var dados = []
                    const title = {
                        empresa: aEmpresa.empresa,
                        dateInit: moment(dateInit).format('DD/MM/YYYY'),
                        dateFin: moment(dateFin).format('DD/MM/YYYY')
                    }
                    //console.log(title)
                    Agencia.find({$nor:[{cidade: "Geral"},{numero:"9999"}]}).then((agencias) => {
                        GuiaCarga.find(query).then((guias) => {
                            agencias.forEach(agencia => {
                                var resumo = {
                                    idAgencia: agencia._id,
                                    agencia: agencia.cidade,
                                    vendidos: 0,
                                    qtdVendidos: 0,
                                    vendidosExib: "",
                                    cancelados: 0,
                                    cancelExib: "",
                                    qtdCancelados: 0,
                                    pagos: 0,
                                    qtdPagos: 0,
                                    pagosExib: "",
                                    pendentes: 0,
                                    qtdPendentes: 0,
                                    pendentesExib: "",
                                    vencidos: 0,
                                    qtdVencidos: 0,
                                    vencidosExib: "",
                                    empresa: aEmpresa._id,
                                    dateMin,
                                    dateMax
                                }
                                for (let i = 0; i < guias.length; i++) {
                                    if (String(guias[i].origem) == String(resumo.idAgencia)) {
                                        resumo.vendidos += guias[i].valor
                                        resumo.qtdVendidos++
                                        if (guias[i].baixaPag == true && guias[i].condPag == "CANCELADO") {
                                            resumo.cancelados += guias[i].valor
                                            resumo.qtdCancelados++
                                        }
                                        else if (guias[i].baixaPag == true && guias[i].condPag != "CANCELADO") {
                                            resumo.pagos += guias[i].valor
                                            resumo.qtdPagos++
                                        }
                                        else if (guias[i].baixaPag == false && moment(guias[i].vencimento).format('MM-DD-YYYY') < moment(new Date()).format('MM-DD-YYYY')) {
                                            resumo.vencidos += guias[i].valor
                                            resumo.qtdVencidos++
                                        } else {
                                            resumo.pendentes += guias[i].valor
                                            resumo.qtdPendentes++
                                        }
                                    }
                                }
                                resumo.vendidosExib = resumo.vendidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                resumo.pagosExib = resumo.pagos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                resumo.cancelExib = resumo.cancelados.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                resumo.vencidosExib = resumo.vencidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                resumo.pendentesExib = resumo.pendentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                if (resumo.qtdVendidos > 0) {
                                    dados.push(resumo)
                            	}
                            });
                            //console.log(dados)
                            res.render('consultasRelatorios/guias_cargas/vendasPorAgencia', { dados, empresas, title })

                        })
                    })
                })

            }).catch(err => {
                req.flash('error_msg', "Erro interno ", err)
                res.redirect('/error')
            })
    }
})

router.get('/vendas_por_agencia/detalhado', eDigitador, (req, res) => {

    const { agencia, empresa, dateMin, dateMax } = req.query
    //console.log(agencia, empresa, dateMin, dateMax)
    var dataInit = moment(dateMin).format()
    var dataFin = moment(dateMax).format()
    Agencia.findById(agencia).then(agc => {
        Empresa.findById(empresa).then(emp => {
            GuiaCarga.find({ dateEntrada: { $gte: dataInit, $lte: dataFin }, empresa: empresa, origem: agencia }).populate('destino').then((guias) => {
                //console.log(guias.length)
                var title = {
                    totalPg: 0,
                    totalPgEx: "",
                    totalPd: 0,
                    totalPdEx: "",
                    totalVc: 0,
                    totalVcEx: "",
                    totalCl: 0,
                    totalClEx: "",
                    empresa: emp.empresa,
                    agencia: agc.cidade
                }

                var guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != 'CANCELADO')
                //console.log(guiasPagas.length)
                for (let i = 0; i < guiasPagas.length; i++) {
                    title.totalPg += guiasPagas[i].valor
                    guiasPagas[i]["date_entrada"] = moment(guiasPagas[i].dateEntrada).format('DD/MM/YYYY')
                    guiasPagas[i]["date_vencimento"] = moment(guiasPagas[i].vencimento).format('DD/MM/YYYY')
                    guiasPagas[i]["valorExib"] = guiasPagas[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }

                var guiasPendentes = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format("MM-DD-YYYY") >= moment(new Date()).format("MM-DD-YYYY"))
                for (let i = 0; i < guiasPendentes.length; i++) {
                    title.totalPd += guiasPendentes[i].valor
                    guiasPendentes[i]["date_entrada"] = moment(guiasPendentes[i].dateEntrada).format('DD/MM/YYYY')
                    guiasPendentes[i]["date_vencimento"] = moment(guiasPendentes[i].vencimento).format('DD/MM/YYYY')
                    guiasPendentes[i]["valorExib"] = guiasPendentes[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
                var guiasVencidas = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format("MM-DD-YYYY") > moment(new Date()).format("MM-DD-YYYY"))
                for (let i = 0; i < guiasVencidas.length; i++) {
                    title.totalVc += guiasVencidas[i].valor
                    guiasVencidas[i]["date_entrada"] = moment(guiasVencidas[i].dateEntrada).format('DD/MM/YYYY')
                    guiasVencidas[i]["date_vencimento"] = moment(guiasVencidas[i].vencimento).format('DD/MM/YYYY')
                    guiasVencidas[i]["valorExib"] = guiasVencidas[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
                var guiasCanceladas = guias.filter(g => g.baixaPag == true && g.condPag == "CANCELADO")
                for (let i = 0; i < guiasCanceladas.length; i++) {
                    title.totalCl += guiasCanceladas[i].valor
                    guiasCanceladas[i]["date_entrada"] = moment(guiasCanceladas[i].dateEntrada).format('DD/MM/YYYY')
                    guiasCanceladas[i]["date_vencimento"] = moment(guiasCanceladas[i].vencimento).format('DD/MM/YYYY')
                    guiasCanceladas[i]["valorExib"] = guiasCanceladas[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }

                title.totalPdEx = title.totalPd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                title.totalPgEx = title.totalPg.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                title.totalClEx = title.totalCl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                title.totalVcEx = title.totalVc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                res.render('consultasRelatorios/guias_cargas/vendasPorAgenciaDetalhado', { guiasPagas, guiasCanceladas, guiasPendentes, guiasVencidas, title })

            }).catch(err => {
                req.flash('error_msg', "Erro interno" + err)
                res.redirect('/error')
            })
        }).catch(err => {
            req.flash('error_msg', "Erro interno" + err)
            res.redirect('/error')
        })
    }).catch(err => {
        req.flash('error_msg', "Erro interno" + err)
        res.redirect('/error')
    })


})


//BUSCAR POR STATUS DE ENTREGA
router.get('/por_entrega', eDigitador, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == 'AGENTE') {
        Agencia.findById(usuario.agencia).then((origem) => {
            res.render('consultasRelatorios/guias_cargas/porEntrega', { origem })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar agencias ERRO:", err)
            res.redirect('/error')
        })
    } else {
        Agencia.find( { $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
            res.render('consultasRelatorios/guias_cargas/porEntrega', { agencias })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar agencias ERRO:", err)
            res.redirect('/error')
        })
    }

})

router.get('/por_entrega/pesquisar', eDigitador, (req, res) => {

    let error = []
    var { agencia, dateMin, dateMax, status } = req.query

    dateMax = moment(dateMax).format()
    dateMin = moment(dateMin).format()
    //console.log('agencia= '+agencia +', dateMin= '+ dateMin+', dateMax= '+dateMax+'limit ='+limit+'Offset='+offset)

    if (dateMax < dateMin) {
        error.push({ texto: "A data inicial não pode ser menor que a final" })
    }
    if (agencia == "selecione") {
        error.push({ texto: "Selecione uma agencia" })
    }
    if (error.length > 0) {
        Agencia.find( { $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
            res.render('consultasRelatorios/guias_cargas/porAgencia', { agencias, error })
        }).catch((err) => {
            req.flash('error_msg', "Erro interno ao carregar agencias", err)
            res.redirect('/consultas/por_entrega')
        })
    } else {

        if (agencia == "1") {
            Agencia.find( { $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
                //console.log(status)
                var query
                if (status == 1 || status == "1") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax } }
                } else if (status == 2 || status == "2") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, baixaEntr: true }
                } else if (status == 3 || status == "3") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, baixaEntr: false }
                } else {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, condPag: "CANCELADO" }
                }


                //console.log(query)
                GuiaCarga.find(query).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ numero: 1 }).then((dados) => {
                    if (dados.length < 1) {
                        req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                        res.redirect('/consultas/por_entrega')
                    } else {
                        var i = 0
                        var total_vendas = 0
                        while (i < dados.length) {
                            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                            dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            //dados[i]["n"] = (i + 1) + offset
                            if (dados[i].baixaPag == true || dados[i].baixaPag == "true" && !dados[i].condPag == "CANCELADO") {
                                dados[i]["statusBaixa"] = "PAGO"
                            } else if (dados[i].condPag == "CANCELADO") {
                                dados[i]["statusBaixa"] = "CANCELADO"
                            } else {
                                if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                    dados[i]["statusBaixa"] = "VENCIDO"
                                } else {
                                    dados[i]["statusBaixa"] = "PENDENTE"
                                }
                            }
                            total_vendas += dados[i].valor
                            i++
                        }
                        title = {
                            totalVendasExib: total_vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            qtd_vendas: dados.length,
                            agencia: "TODAS",
                            dateMin, dateMax, status
                        }

                        res.render('consultasRelatorios/guias_cargas/porEntrega', { dados, agencias, title })
                    }
                }).catch((err) => {
                    req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                    res.redirect('/consultas/por_entrega')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro interno ao carregar agencias" + err)
                res.redirect('/painel')
            })
        } else {
            Agencia.find( { $nor: [{ cidade: "Geral" }, { numero: '9999' }] }).sort({ cidade: 1 }).then((agencias) => {
                //console.log(status)
                var query
                if (status == 1 || status == "1") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia }
                } else if (status == 2 || status == "2") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, baixaPag: true }
                } else if (status == 3 || status == "3") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, baixaPag: false, vencimento: { $gt: moment(new Date()).format() } }
                } else if (status == 4 || status == "4") {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, baixaPag: false, vencimento: { $lte: moment(new Date()).format() } }
                } else {
                    query = { dateEntrada: { $gte: dateMin, $lte: dateMax }, origem: agencia, condPag: "CANCELADO" }
                }
                //console.log(query)
                GuiaCarga.find(query).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ numero: 1 }).then((dados) => {
                    Agencia.findById(agencia).then((agencia) => {
                        if (dados.length < 1) {
                            req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                            res.redirect('/consultas/por_entrega')
                        } else {
                            var i = 0
                            var total_vendas = 0
                            while (i < dados.length) {
                                dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                                dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                                dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                //dados[i]["n"] = (i + 1) + offset
                                if (dados[i].baixaPag == true || dados[i].baixaPag == "true") {
                                    dados[i]["statusBaixa"] = "PAGO"
                                } else {
                                    if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                                        dados[i]["statusBaixa"] = "VENCIDO"
                                    } else {
                                        dados[i]["statusBaixa"] = "PENDENTE"
                                    }
                                }
                                total_vendas += dados[i].valor
                                i++
                            }
                            title = {
                                totalVendasExib: total_vendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                qtd_vendas: dados.length,
                                agencia: agencia.cidade,
                                dateMin, dateMax, status
                            }

                            res.render('consultasRelatorios/guias_cargas/porEntrega', { dados, agencias, title, agencia })
                        }
                    }).catch((err) => {
                        req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                        res.redirect('/consultas/por_entrega')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado", err)
                    res.redirect('/consultas/por_entrega')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro interno ao carregar agencias" + err)
                res.redirect('/consultas/por_entrega')
            })
        }

    }
})


//BUSCA POR CLIENTE
router.get('/por_cliente', eDigitador, (req, res) => {
    Cliente.find().then((clientes) => {
        let next = "disabled", prev = "disabled"
        res.render('consultasRelatorios/guias_cargas/porCliente', { next, prev, clientes })
    }).catch((err) => {
        req.flash('error_msg', "Erro interno na consulta: ", err)
        res.redirect('/consultas/por_cliente')
    })

})

router.get('/por_cliente/pesquisar', eDigitador, (req, res) => {

    var { cliente, offset, page } = req.query
    //console.log(cliente)
    const limit = 20
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
    if (!cliente) {
        req.flash('error_msg', "O campo de pesquisa não pode ser em branco")
        res.redirect("/consultas/por_cliente")
    }

    Cliente.findById(cliente).then((clienteExib) => {
        if (clienteExib.perm_fatura) {
            clienteExib['fatura'] = "Sim"
        } else {
            clienteExib['fatura'] = "Não"
        }
        GuiaCarga.find({ cliente: cliente }).populate('origem').populate('destino').populate('empresa').populate('cliente').limit(limit).skip(offset).sort({ dateEntrada: 1 }).then((dados) => {
            var next, prev
            if (page == 1) {
                prev = "disabled"
            }
            if (dados.length <= limit) {
                next = "disabled"
            }
            var nextUrl = {
                client: cliente,
                ofst: offset + limit,
                pag: page + 1,
            }
            var prevUrl = {
                client: cliente,
                ofst: offset - limit,
                pag: page - 1,
            }

            if (dados.length < 1) {
                req.flash('error_msg', "Não foi encontrado resultados")
                res.redirect('/consultas/por_cliente')
            } else {

                for (let i = 0; i < dados.length; i++) {
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_vencimento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                    dados[i]["valorExib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (dados[i].baixaPag == true || dados[i].baixaPag == "true") {
                        dados[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            dados[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            dados[i]["statusBaixa"] = "PENDENTE"
                        }
                    }
                    if (dados[i].baixaEntr == true || dados[i].baixaEntr == "true") {
                        dados[i]["statusEntrega"] = "ENTREGUE"
                    } else {
                        dados[i]["statusEntrega"] = "PENDENTE"
                    }
                }
                const qtd_dados = dados.length

                res.render('consultasRelatorios/guias_cargas/porCliente', { dados, nextUrl, prevUrl, page, prev, next, qtd_dados, clienteExib })
            }

        }).catch((err) => {
            req.flash('error_msg', "Erro interno na consulta: ", err)
            res.redirect('/consultas/por_agencia')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar cliente: ", err)
        res.redirect('/consultas/por_agencia')
    })



})

router.get('/guias_do_cliente', eDigitador, (req, res) => {

    var { cliente, offset, page } = req.query
    //console.log(cliente)
    Cliente.findById(cliente).then((clienteExib) => {
        if (clienteExib.perm_fatura) {
            clienteExib['fatura'] = "Sim"
        } else {
            clienteExib['fatura'] = "Não"
        }
        GuiaCarga.find({ cliente: cliente }).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ dateEntrada: 1 }).then((dados) => {

            if (dados.length < 1) {
                req.flash('error_msg', "Não foi encontrado resultados")
                res.redirect('/consultas/por_cliente')
            } else {

                for (let i = 0; i < dados.length; i++) {
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_vencimento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                    dados[i]["valorExib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (dados[i].baixaPag == true || dados[i].baixaPag == "true") {
                        dados[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            dados[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            dados[i]["statusBaixa"] = "PENDENTE"
                        }
                    }
                    if (dados[i].baixaEntr == true || dados[i].baixaEntr == "true") {
                        dados[i]["statusEntrega"] = "ENTREGUE"
                    } else {
                        dados[i]["statusEntrega"] = "PENDENTE"
                    }
                }
                const qtd_dados = dados.length

                res.render('consultasRelatorios/guias_cargas/guiasDoCliente', { dados, qtd_dados, clienteExib })
            }

        }).catch((err) => {
            req.flash('error_msg', "Erro interno na consulta: ", err)
            res.redirect('/consultas/por_agencia')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar cliente: ", err)
        res.redirect('/consultas/por_agencia')
    })



})

router.get('/guias_do_cliente/filtrar', eDigitador, (req, res) => {

    var { cliente, dateMin, dateMax } = req.query
    if (!dateMin && !dateMax) {
        req.flash('error_msg', "Informe data inicial e final")
        res.redirect('/consultas/guias_do_cliente?cliente=' + cliente)
    } else if (!dateMin && dateMax) {
        req.flash('error_msg', "Informe data inicial e final")
        res.redirect('/consultas/guias_do_cliente?cliente=' + cliente)
    } else if (dateMin && !dateMax) {
        req.flash('error_msg', "Informe data inicial e final")
        res.redirect('/consultas/guias_do_cliente?cliente=' + cliente)
    } else {
        dateMax = moment(dateMax).format()
        dateMin = moment(dateMin).format()

        Cliente.findById(cliente).then((clienteExib) => {
            if (clienteExib.perm_fatura) {
                clienteExib['fatura'] = "Sim"
            } else {
                clienteExib['fatura'] = "Não"
            }
            GuiaCarga.find({ cliente: cliente, dateEntrada: { $gte: dateMin, $lt: dateMax } }).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ dateEntrada: 1 }).then((dados) => {

                for (let i = 0; i < dados.length; i++) {
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_vencimento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                    dados[i]["valorExib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    if (dados[i].baixaPag == true || dados[i].baixaPag == "true") {
                        dados[i]["statusBaixa"] = "PAGO"
                    } else {
                        if (moment(dados[i].vencimento).format("YYYY-MM-DD") < moment(new Date()).format("YYYY-MM-DD")) {
                            dados[i]["statusBaixa"] = "VENCIDO"
                        } else {
                            dados[i]["statusBaixa"] = "PENDENTE"
                        }
                    }
                    if (dados[i].baixaEntr == true || dados[i].baixaEntr == "true") {
                        dados[i]["statusEntrega"] = "ENTREGUE"
                    } else {
                        dados[i]["statusEntrega"] = "PENDENTE"
                    }
                }
                const qtd_dados = dados.length

                res.render('consultasRelatorios/guias_cargas/guiasDoCliente', { dados, qtd_dados, clienteExib })

            }).catch((err) => {
                req.flash('error_msg', "Erro interno na consulta: ", err)
                res.redirect('/consultas/por_agencia')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar cliente: ", err)
            res.redirect('/consultas/por_agencia')
        })
    }

})



module.exports = router
