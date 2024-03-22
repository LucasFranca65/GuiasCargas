const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado, eAdmin } = require('../helpers/eAdmin')

//Mongoose Models
require('../models/System')
const System = mongoose.model('systens')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Talao')
const Talao = mongoose.model('taloes')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')

//Painel principal das guias
router.get('/', lOgado, (req, res) => {
    let numCont = 0
    const usuario = req.user
    Empresa.find().then(empresas => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {
            System.findOne().then((system) => {
                Talao.find({ disponiveis: { $gt: 0 } }).populate("agencia").populate("empresa").sort({ numeroInicial: 1 }).then((taloes) => {
                    if (usuario.perfil == "AGENTE") {
                        const tAgencia = taloes.filter(t => String(t.agencia._id) == String(usuario.agencia))
                        for (let i = 0; i < tAgencia.length; i++) {
                            tAgencia[i]['date_exib'] = moment(tAgencia[i].date).format('DD/MM/YYYY')
                        }
                        numCont = system.nTalao + 1
                        res.render('taloes/index_talao', { numCont, agencias, tAgencia })
                    } else {
                        for (let i = 0; i < taloes.length; i++) {
                            taloes[i]['date_exib'] = moment(taloes[i].date).format('DD/MM/YYYY')
                        }
                        numCont = system.nTalao + 1
                        res.render('taloes/index_talao', { numCont, agencias, taloes, empresas })
                    }

                }).catch((err) => {
                    console.log(err)
                    req.flash('error_msg', "Erro ao carregar talões para exibição")
                    res.redirect('/painel')
                })
            }).catch((err) => {
                console.log(err)
                req.flash('error_msg', "Erro ao conferir proxima numeração de talao")
                res.redirect('/painel')
            })
        }).catch((err) => {
            console.log(err)
            req.flash('error_msg', "Erro ao conferir proxima numeração de talao")
            res.redirect('/painel')
        })

    }).catch((err) => {
        req.flash('error_msg', "Erro interno ", err)
        res.redirect('/error')
    })
})

router.post('/adicionar', lOgado, (req, res) => {
    let erro = []
    const { numCont, numFin, numInit, tipo, agencia, empresa } = req.body
    if (tipo == "selecione") {
        erro.push({ text: "Selecione o tio de Talão" })
    }
    if (agencia == "selecione") {
        erro.push({ text: "Selecione uma Agencia" })
    }
    if (empresa == "selecione") {
        erro.push({ text: "Selecione uma Empresa" })
    }
    if (numInit > numFin) {
        erro.push({ text: "A numeração final não pode ser menor que a inicial" })
    }
    if (erro.length > 0) {
        let numCont = 0
        const usuario = req.user
        Empresa.find().then(empresas => {
            Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                System.findOne().then((system) => {
                    Talao.find({ disponiveis: { $gt: 0 } }).populate("agencia").sort({ numeroInicial: 1 }).then((taloes) => {
                        if (usuario.perfil == "AGENTE") {
                            const tAgencia = taloes.filter(t => String(t.agencia._id) == String(usuario.agencia))
                            for (let i = 0; i < tAgencia.length; i++) {
                                tAgencia[i]['date_exib'] = moment(tAgencia[i].date).format('DD/MM/YYYY')
                            }
                            numCont = system.nTalao + 1
                            res.render('taloes/index_talao', { numCont, agencias, tAgencia })
                        } else {
                            for (let i = 0; i < taloes.length; i++) {
                                taloes[i]['date_exib'] = moment(taloes[i].date).format('DD/MM/YYYY')
                            }
                            numCont = system.nTalao + 1
                            res.render('taloes/index_talao', { numCont, agencias, taloes, empresas, erro })
                        }

                    }).catch((err) => {
                        console.log(err)
                        req.flash('error_msg', "Erro ao carregar talões para exibição")
                        res.redirect('/painel')
                    })
                }).catch((err) => {
                    console.log(err)
                    req.flash('error_msg', "Erro ao conferir proxima numeração de talao")
                    res.redirect('/painel')
                })
            }).catch((err) => {
                console.log(err)
                req.flash('error_msg', "Erro ao conferir proxima numeração de talao")
                res.redirect('/painel')
            })

        }).catch((err) => {
            req.flash('error_msg', "Erro interno ", err)
            res.redirect('/error')
        })

    } else {
        let numI = parseInt(numInit)
        let numF = parseInt(numFin)
        Talao.find({ tipo: tipo, empresa: empresa, $or: [{ numeroInicial: { $gte: numI, $lt: numF } }, { numeroFinal: { $gte: req.body.numInit, $lt: req.body.numFin } }] }).then((taloes) => {
            if (taloes.length > 0) {
                req.flash("error_msg", 'já existe talao cadastrado dentro desse intervalo, para a empresa selecionada')
                res.redirect('/talao')
            } else {
                System.findOne().then((system) => {
                    var disp = (numFin - numInit)+1

                    const newTalao = {
                        numeroControle: numCont,
                        numeroInicial: numInit,
                        numeroFinal: numFin,
                        agencia: agencia,
                        tipo: tipo,
                        disponiveis: disp,
                        qtdGuias: disp,
                        empresa: empresa,
                        date: moment(new Date()).format('MM-DD-YYYY')
                    }

                    new Talao(newTalao).save().then(() => {
                        req.flash('success_msg', "Talão " + newTalao.numeroControle + " cadastrado com sucesso")
                        //console.log("Talão "+newTalao.numCont+" cadastrado com sucesso")
                        system.nTalao = numCont
                        system.save().then(() => {
                            console.log('Número de controle do talao atualizado')
                            res.redirect('/talao')
                        }).catch((err) => {
                            console.log('Erro ao Tentar atualizar numero do talão, ' + err)
                            req.flash('error_msg', "Erro ao Tentar atualizar numero do talão")
                            res.redirect('/talao')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao tentar salvar novo talão" + err)
                        res.redirect('/talao')
                    })
                }).catch((err) => {
                    console.log(err)
                    req.flash('error_msg', "Erro ao conferir proxima numeração de talao")
                    res.redirect('/painel')
                })
            }
        }).catch((err) => {
            req.flash('error_msg', "Erro ao tentar carregar taloes ~> ERRO: " + err)
            res.redirect('/talao')
        })
    }
})
         

router.post('/excluir', eAdmin, (req, res) => {
    ident = req.body.ident
    var query = { "_id": { $in: ident } }
    Talao.deleteMany(query).then(() => {
        req.flash('success_msg', "Talões selecionados excluidos com sucesso")
        res.redirect('/talao')

    }).catch((err) => {
        console.log(err)
        req.flash('error_msg', "Erro ao excluir talões selecionados")
        res.redirect('/talao')
    })

})

router.get('/guias', lOgado, (req, res) => {
    var { ident } = req.query
    Talao.findById(ident).populate('agencia').then((talao) => {
        if (talao) {
	    talao['date_exib'] = moment(talao.date).format('DD/MM/YYYY')
            GuiaCarga.find({ talao: talao._id }).populate('origem').populate('destino').populate('empresa').populate('cliente').sort({ dateEntrada: 1 }).then((dados) => {

                if (dados.length == 0) {
                    req.flash('error_msg', "Não foi encontrado guias para o talão "+ talao.numeroControle)
                    res.redirect('/talao')
                } else {

                    for (let i = 0; i < dados.length; i++) {

                        dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                        dados[i]["date_pagamento"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
                        dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                        if (dados[i].baixaPag == true && dados[i].condPag != "CANCELADO") {
                            dados[i]["statusPagamento"] = "PAGO"
                        }
                        else if (dados[i].baixaPag == true && dados[i].condPag == "CANCELADO") {
                            dados[i]["statusPagamento"] = "CANCELADO"
                        }
                        else if (moment(dados[i].vencimento).format('MM-DD-YYYY') >= moment(new Date()).format('MM-DD-YYYY')) {
                            dados[i]["statusPagamento"] = "PENDENTE"
                        } else {
                            dados[i]["statusPagamento"] = "VENCIDO"
                        }

                    }
                    res.render('taloes/guias', { talao, dados })
                }
            }).catch((err) => {
                req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado" + err)
                res.redirect('/talao')
            })

        } else {
            req.flash('error_msg', "Talão não encontrado")
            res.redirect('/talao')
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao realizar buscar por talao" + err)
        res.redirect('/talao')
    })

})


/*router.get('/guias', lOgado, (req, res) => {
    var { ident, offset, page } = req.query
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
    Talao.findById(ident).then((talao) => {
        if (talao) {
            let numI = talao.numeroInicial
            let numF = talao.numeroFinal
            let empresaT = talao.empresa
            talao["date_exib"] = moment(talao.date).format('DD/MM/YYYY')
            let query = { empresa: empresaT, numero: { $gte: numI, $lt: numF } }
            GuiaCarga.find(query).limit(limit).skip(offset).sort({ dateEntrada: 1 }).then((dados) => {
                console.log(dados)
                if (dados.length == 0) {
                    req.flash('error_msg', "Não foi encontrado guias para o periodo Informado")
                    res.redirect('/talao')
                } else {
                    var next, prev
                    if (page == 1) {
                        prev = "disabled"
                    }
                    if (dados.length <= limit) {
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
                    var i = 0
                    while (i < dados.length) {
                        dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                        dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                        dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        dados[i]["n"] = (i + 1) + offset
                        if (dados[i].baixa == true && dados[i].statusPag != "CANCELADO") {
                            dados[i]["statusBaixa"] = "BAIXADO"
                        }
                        if (dados[i].baixa == true && dados[i].statusPag == "CANCELADO") {
                            dados[i]["statusBaixa"] = "CANCELADO"
                        }
                        else {
                            dados[i]["statusBaixa"] = "PENDENTE"
                        }
                        i++
                    }
                    res.render('taloes/guias', { talao, dados, nextUrl, prevUrl, page, prev, next })
                }

            }).catch((err) => {
                req.flash('error_msg', "Não foi encontrado guias para os parametros no periodo informado" + err)
                res.redirect('/talao')
            })

        } else {
            req.flash('error_msg', "Talão não encontrado")
            res.redirect('/talao')
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao realizar buscar por talao" + err)
        res.redirect('/talao')
    })

})*/

router.get('/calcular_disp', lOgado, (req, res) => {
    Talao.find().then((taloes) => {
        var success = []
        var erros = []
        taloes.forEach(talao => {
            GuiaCarga.find({ talao: talao._id }).then((guias) => {

                var qtdTal = talao.numeroFinal - talao.numeroInicial + 1
                var usados = guias.length
                if (guias) {
		    talao.qtdGuias = qtdTal
                    talao.disponiveis = qtdTal - usados
                    talao.save().then(() => {
                        success.push({ texto: "Talão numero " + talao.numeroControle + " Calculado com sucesso" })
                    }).catch((err) => {
                        erros.push({ texto: "Talão numero " + talao.numeroControle + " Erros nos calculos", err })
                    })
                } else {
		    talao.qtdGuias = qtdTal
                    talao.disponiveis = qtdTal
                    talao.save().then(() => {
                        success.push({ texto: "Talão numero " + talao.numeroControle + " Calculado com sucesso" })
                    }).catch((err) => {
                        erros.push({ texto: "Talão numero " + talao.numeroControle + " Erros nos calculos", err })
                    })
                }
            }).catch((err) => {
                erros.push({ texto: "Erro ao buscar guias ", err })

            })
        });
        res.render('404', { erros, success })
    })
})


module.exports = router
