const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado } = require('../helpers/eAdmin')

function checkValueInt(valor) {
    if (!valor || typeof valor == undefined || valor == null) {
        valor = 0
    } else {
        valor = parseInt(valor)
    }
    return valor
}

function checkValueFloat(valor) {
    if (!valor || typeof valor == undefined || valor == null) {
        valor = 0
    } else {
        valor = parseFloat(valor).toFixed(2)
    }
    return valor
}

//Models
require('../Models/PContas')
const PContas = mongoose.model('pContas')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')
require('../Models/Empresa')
const Empresa = mongoose.model('empresas')
require('../Models/Talao')
const Talao = mongoose.model('taloes')

router.get('/', lOgado, (req, res) => {
    Empresa.find().then((empresas) => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {

            res.render('prestacaoContas/index_p_contas', ({ empresas, agencias }))

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
    let erro = []
    const {
        numero, empresa, agencia, dateOperacao, qtdBilhetes,
        totalBilhetes, qtdSeguro, totalSeguro, qtdPedagio,
        totalPedagio, qtdCargas, totalCargas, qtdBagagem,
        totalBagagem, totalOutrosEntradas, obsOutrosEntradas,
        qtdRequisicao, totalRequisicao, qtdCortesia, totalCortesia,
        qtdDevolucao, totalDevolucao, qtdDesconto, totalDesconto,
        qtdVale, totalVale, totalOutrosSaidas, obsOutrosSaidas,
        totalEntradas, totalSaidas, liquido, deposito, cheque,
        rvr, pendencia, valorPendente
    } = req.body


    if (empresa == "selecione") {
        erro.push({ text: "Selecione uma empresa" })
    }
    if (agencia == "selecione") {
        erro.push({ text: "Selecione uma agencia" })
    }
    if (erro.length > 0) {
        Empresa.find().then((empresas) => {
            Agencia.find().sort({ cidade: 1 }).then((agencias) => {
                PContas.find().populate('empresa').populate('origem').populate('destino').limit(5).sort({ date: 1 }).then((sumarios) => {

                    res.render('prestacaoContas/index_p_contas', ({ empresas, agencias, sumarios, erro }))
                }).catch((err) => {
                    req.flash('error_msg', "erros ao caregar prestação de contas, ERRO: ", err)
                    res.redirect('prestacaoContas/index_p_contas')
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
    else {
        Periodo.findOne({ dateInit: { $lte: dateOperacao }, dateFin: { $gte: dateOperacao }, empresa: empresa }).then((periodo) => {
            if (!periodo) {
                req.flash('error_msg', "Não existe periodo de digitação aberto para essa data de operação")
                res.redirect('/arrecadacao')
            } else {
                Talao.findOne({ numeroInicial: { $lte: numero }, numeroFinal: { $gte: numero }, tipo: "PRESTACAO CONTAS", agencia: agencia }).then((talao) => {
                    if (!talao) {
                        req.flash('error_msg', "Não existe talão cadastrado para esse numero de sumario")
                        res.redirect('/arrecadacao')
                    } else {
                        PContas.findOne({ numero: numero }).then((sumario) => {
                            if (sumario) {
                                req.flash('error_msg', "Já existe uma digitação para esse numero de sumario")
                                res.redirect('/arrecadacao')
                            } else {

                                const newPcontas = {
                                    numero, empresa, agencia, dateOperacao,
                                    qtdBilhetes: checkValueInt(qtdBilhetes), totalBilhetes: checkValueFloat(totalBilhetes),
                                    qtdSeguro: checkValueInt(qtdSeguro), totalSeguro: checkValueFloat(totalSeguro),
                                    qtdPedagio: checkValueInt(qtdPedagio), totalPedagio: checkValueFloat(totalPedagio),
                                    qtdCargas: checkValueInt(qtdCargas), totalCargas: checkValueFloat(totalCargas),
                                    qtdBagagem: checkValueInt(qtdBagagem), totalBagagem: checkValueFloat(totalBagagem),
                                    totalOutrosEntradas: checkValueFloat(totalOutrosEntradas),
                                    obsOutrosEntradas,
                                    qtdRequisicao: checkValueInt(qtdRequisicao), totalRequisicao: checkValueFloat(totalRequisicao),
                                    qtdCortesia: checkValueInt(qtdCortesia), totalCortesia: checkValueFloat(totalCortesia),
                                    qtdDevolucao: checkValueInt(qtdDevolucao), totalDevolucao: checkValueFloat(totalDevolucao),
                                    qtdDesconto: checkValueInt(qtdDesconto), totalDesconto: checkValueFloat(totalDesconto),
                                    qtdVale: checkValueInt(qtdVale), totalVale: checkValueFloat(totalVale),
                                    totalOutrosSaidas: checkValueFloat(totalOutrosSaidas),
                                    obsOutrosSaidas,
                                    totalEntradas: checkValueFloat(totalEntradas),
                                    totalSaidas: checkValueFloat(totalSaidas),
                                    liquido: checkValueFloat(liquido), deposito: checkValueFloat(deposito),
                                    cheque: checkValueFloat(cheque), rvr: checkValueFloat(rvr),
                                    pendencia: false, valorPendente: checkValueFloat(valorPendente),
                                    talao: talao._id,
                                    user: req.user._id,
                                    periodo: periodo._id
                                }
                                if (valorPendente > 0) {
                                    newPcontas.pendencia = true
                                }
                                console.log(newPcontas)
                                new PContas(newPcontas).save().then(() => {
                                    req.flash('succes_msg', "Prestação de contas Numero: " + numero + ", Cadastrada com sucesso ")
                                    res.redirect('/arrecadacao')
                                }).catch((err) => {
                                    req.flash('error_msg', "Erro ao Tentar Cadastrar a Prestação de contas Numero: " + numero + "Erro: " + err)
                                    res.redirect('/arrecadacao')
                                })
                            }
                        }).catch((err) => {
                            req.flash('error_msg', "erros ao caregar prestação de contas, ERRO: ", err)
                            res.redirect('/arrecadacao')
                        })
                    }
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao buscar talão")
                    res.redirect('/arrecadacao')
                })
            }
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar Periodo para digitação, Erro: " + err)
            res.redirect('/arrecadacao')
        })
    }


})

module.exports = router