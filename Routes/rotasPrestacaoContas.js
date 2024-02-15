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
require('../models/PContas')
const PContas = mongoose.model('pContas')
require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/Talao')
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
                        PContas.findOne({ $or: [{ numero: numero }, { dateOperacao: moment(dateOperacao).format('YYYY-MM-DDT00:00:00.000+00:00') }], agencia: agencia, empresa: empresa }).then((sumario) => {
                            if (sumario) {
                                req.flash('error_msg', "Já existe uma digitação para esse numero de sumario, ou data de operação para a empresa ou agencia selecionado")
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
                                    req.flash('success_msg', "Prestação de contas Numero: " + numero + ", Cadastrada com sucesso ")
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

router.get('/buscar_guias', lOgado, (req, res) => {
    Empresa.find().sort({ empresa: 1 }).then((empresas) => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {
            res.render('prestacaoContas/buscar_p_contas', ({ empresas, agencias }))
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar agencias na busca de guias" + err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar empresas na busca de guias" + err)
        res.redirect('/painel')
    })
})

router.get('/buscar_guias/buscar', lOgado, (req, res) => {
    const { dateOperacao, empresa } = req.query
    Empresa.find().sort({ empresa: 1 }).then((empresas) => {

        let data = moment(dateOperacao).format('YYYY-MM-DDT00:00:00.000+00:00')
        PContas.find({ dateOperacao: data, empresa: empresa }).populate('agencia').populate('empresa').then((sumarios) => {
            if (sumarios.length == 0) {
                req.flash('error_msg', "Não foi encontrada prestação de contas para esses parametros")
                res.redirect('/arrecadacao/buscar_guias')
            } else {
                sumarios.forEach(sumarios => {
                    sumarios['dateExib'] = moment(dateOperacao).format('DD/MM/YYYY')
                    sumarios['liqExib'] = sumarios.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                });
                res.render('prestacaoContas/buscar_p_contas', ({ empresas, sumarios }))

            }
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar agencias na busca de guias" + err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar empresas na busca de guias" + err)
        res.redirect('/painel')
    })
})

router.get('/selectEdit/:id', lOgado, (req, res) => {
    const id = req.params.id
    Empresa.find().sort({ empresa: 1 }).then((empresas) => {
        Agencia.find().sort({ cidade: 1 }).then((agencias) => {
            PContas.findOne({ _id: id }).populate('agencia').populate('empresa').then((sumario) => {
                sumario["date_exib"] = moment(sumario.dateOperacao).format('YYYY-MM-DD')
                console.log(moment(sumario.dateOperacao).format('YYYY-MM-DD'))
                res.render('prestacaoContas/ver_p_contas', ({ sumario, empresas, agencias }))
            }).catch((err) => {
                req.flash('error_msg', "Erro ao buscar prestação de contas na edicao" + err)
                res.redirect('/painel')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar agencias na edicao de guias" + err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar empresas na edicao de guias" + err)
        res.redirect('/painel')
    })


})


module.exports = router