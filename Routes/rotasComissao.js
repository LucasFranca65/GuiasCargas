const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { eAdmin, lOgado, eDigitador, eControle } = require('../helpers/eAdmin')
const moment = require('moment')

//Models

require('../models/Agencia')
const Agencia = mongoose.model('agencias')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')
require('../models/BalancoEnc')
const BalancoEnc = mongoose.model('balancoEnc')
require('../models/Comissao')
const Comissao = mongoose.model('comissoes')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')



/*router.get('/bilhetes', lOgado, (req, res) => {
    Agencia.find().then((agencias) => {
        Periodo.find({ comissao: "true" }).then((periodos) => {
            if (periodos.length > 0) {
                for (let j = 0; j < periodos.length; j++) {
                    periodos[j]["dInitExib"] = moment(periodos[j].dateInit).format('DD/MM/YYYY')
                    periodos[j]["dtFimExib"] = moment(periodos[j].dateFin).format('DD/MM/YYYY')
                    periodos[j]["totalExib"] = periodos[j].totalComiss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
            res.render('comissao/comissao_bilhetes', { periodos, agencias })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao tentar buscar agencias", err)
        res.redirect('/painel')
    })
})

router.get('/bilhetes/calcular', eAdmin, (req, res) => {
    const { empresa, mes, ano } = req.query
    var uDia = 31
    let error = []
    if (!mes || mes == undefined) {
        error.push({ text: "Mes informado invalido" })
    }
    if (!ano || ano == undefined) {
        error.push({ text: "Ano informado invalido" })
    }
    if (error.length > 0) {
        Agencia.find().then((agencias) => {
            Comissao.find().limit(agencias.length).then((comissoes) => {
                res.render('comissao/index', { comissoes, agencias, error })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                res.redirect('/painel')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao tentar buscar agencias", err)
            res.redirect('/painel')
        })
    } else {
        if (mes == 2) {
            if ((ano % 4) > 0) {
                uDia = 28
            } else {
                uDia = 29
            }
        }
        if (mes == 4 || mes == 6 || mes == 9 || mes == 11) {
            uDia = 30
        }
        const dateInit = moment(ano + '-' + mes + '-01').format("YYYY-MM-DDT00:00:00.SSSZ")
        const dateFin = moment(ano + '-' + mes + '-' + uDia).format("YYYY-MM-DDT23:59:59.SSSZ")
        const reference = (empresa + "-" + mes + "-" + ano)
        let toralPeriodo = 0
        Periodo.findOne({ nome: reference }).then(async (periodo) => {
            if (periodo) {
                await Comissao.find({ periodo: reference }).then(async (comissoes) => {
                    if (comissoes.length > 0) {
                        req.flash('error_msg', "Já foram feitos calculos de comissao das agencias para esse periodo")
                        res.redirect('/comissao')
                    } else {
                        var newComissao = {}
                        await Agencia.find({ empresa: empresa }).then(async (agenc) => {
                            for (let j = 0; j < agenc.length; j++) {
                                await BalancoEnc.findOne({ periodo: reference, agencia: agenc[j].cidade }).then((controle) => {
                                    newComissao = {
                                        periodo: reference,
                                        agencia: agenc[j].cidade,
                                        empresa: empresa,
                                        dateInit: dateInit,
                                        dateFin: dateFin,
                                        indiceComissao: agenc[j].indiceComissao,
                                        totalVendas: controle.total,
                                        valor: ((controle.total * agenc[j].indiceComissao) / 100)
                                    }
                                    toralPeriodo = toralPeriodo + newComissao.valor
                                    console.log(toralPeriodo)
                                    new Comissao(newComissao).save().then(() => {
                                        console.log("Comissão da agencia " + agenc[j].cidade + " calculada com sucesso")
                                        if (j + 1 == agenc.length) {
                                            console.log(toralPeriodo)
                                            let editPeriodo = {
                                                comissao: true,
                                                totalComiss: toralPeriodo
                                            }
                                            Periodo.updateOne({ nome: reference }, editPeriodo, (error, result) => {
                                                if (error) {
                                                    console.log(error)
                                                    req.flash('error_msg', "Erro ao realizado calculo de comissão")
                                                    res.redirect('/comissao')
                                                } else {
                                                    console.log("periodos atualizados")
                                                    req.flash('sucess_msg', "Realizado calculo de comissão com sucesso")
                                                    res.redirect('/comissao')
                                                }
                                            })
                                        }
                                    }).catch((err) => {
                                        console.log("Erro ao calcular comissao da agencia " + agenc[j].cidade + " ERRO: " + err)
                                    })
                                }).catch((err) => {
                                    console.log("Erro ao buscar controles da agencia " + agenc[j].cidade + " Erro: " + err)
                                })
                            }

                        }).catch((err) => {
                            req.flash('error_msg', "Erro ao buscar agencias", err)
                            res.redirect('/comissao')
                        })
                    }
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao verificar existencia de comissoes, ERRO: " + err)
                    res.redirect('/comissoes')
                })
            } else {
                req.flash('error_msg', "O periodo informado não teve a digitação encerrada, necessario encerrar a digitação para calcular comissão")
                res.redirect('/comissao')
            }
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar o periodo informado " + err)
            res.redirect('/comissao')
        })
    }
})

router.get('/bilhetes/detalhado/:periodo', lOgado, (req, res) => {
    Periodo.findOne({ nome: req.params.periodo }).then((periodo) => {
        Comissao.find({ periodo: req.params.periodo }).sort({ agencia: 1 }).then((comissoes) => {
            for (let j = 0; j < comissoes.length; j++) {
                comissoes[j]["dInitExib"] = moment(comissoes[j].dateInit).format('DD/MM/YYYY')
                comissoes[j]["dtFimExib"] = moment(comissoes[j].dateFin).format('DD/MM/YYYY')
                comissoes[j]["totalExib"] = comissoes[j].totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                comissoes[j]["valorExib"] = comissoes[j].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
            const user = req.user
            periodo["inicio"] = moment(periodo.dateInit).format('DD/MM/YYYY')
            periodo["final"] = moment(periodo.dateFin).format('DD/MM/YYYY')
            res.render('comissao/detalhado', { comissoes, periodo, user })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar Comissões do periodo, Err" + err)
            res.redirect('/comissao')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar Periodo, Erro: " + err)
        res.redirect('/comissao')
    })
})

router.post('/bilhetes/excluir', eAdmin, (req, res) => {
    const periodos = req.body.periodo

    if (periodos.length == 0 || periodos == undefined) {
        req.flash('error_msg', "Selecione um periodo para exclusão dos calculos de Comissão")
        res.redirect('/comissao')
    }
    if (periodos.length == 1) {
        Comissao.deleteMany({ periodo: periodos }).then(() => {
            Periodo.findOne({ nome: periodos }).then((periodo) => {
                periodo.comissao = false
                periodo.totalComiss = 0
                periodo.save().then(() => {
                    req.flash('success_msg', "Periodo " + periodos + " editado com sucesso, Calculo das comissões excluidos")
                    res.redirect('/comissao')
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao salvar edição periodo de calculo " + err)
                    res.redirect('/comissao')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao disponibilizar periodo para calculo " + err)
                res.redirect('/comissao')
            })
        }).catch((err) => {
            req.flash('error_msg', "Não foi possivel excluir Calculos para o periodo Informado ERR: " + err)
            res.redirect('/comissao')
        })
    } else {
        for (let j = 0; j < periodos.length; j++) {
            Comissao.deleteMany({ periodo: periodos[j] }).then(() => {
                Periodo.findOne({ nome: periodos[j] }).then((periodo) => {
                    periodo.comissao = false,
                        periodo.totalComiss = 0
                    periodo.save().then(() => {
                        req.flash('success_msg', "Periodo " + periodos[j] + " editado com sucesso")
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao salvar edição periodo de calculo " + err)
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao disponibilizar periodo para calculo " + err)
                })
            }).catch((err) => {
                req.flash('error_msg', "Não foi possivel excluir Calculos para o periodo Informado ERR: " + err)
            })
        }
        rq
        res.redirect('/comissao')
    }
})*/

//Guias de Encomendas e Cargas periodosCalculados
router.get('/cargas', eControle, (req, res) => {

    Agencia.find().then((agencias) => {
        Periodo.find({ comissao: false, status: "FECHADO" }).then((periodos) => {
            Periodo.find({ comissao: true }).populate('empresa').then((periodosCalculados) => {
                for (let i = 0; i < periodosCalculados.length; i++) {
                    periodosCalculados[i]['dateMin'] = moment(periodosCalculados[i].dateInit).format('DD/MM/YYYY')
                    periodosCalculados[i]['dateMax'] = moment(periodosCalculados[i].dateFin).format('DD/MM/YYYY')
                }
                res.render('comissao/comissao_cargas', { periodos, agencias, periodosCalculados })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                res.redirect('/error')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
            res.redirect('/error')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao tentar buscar agencias", err)
        res.redirect('/error')
    })

})

router.get('/cargas/calcular', eControle, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE" || usuario.perfil == "DIGITADOR" || usuario.perfil == "ARRECADACAO") {
        req.flash('error_msg', "Usuario não autorizado para realizar essa ação")
        res.redirect('/comissao/cargas')
    } else {
        const { periodoBusca, agenciaBusca } = req.query

        var erros = []
        var success = []
        if (agenciaBusca == '1' || agenciaBusca == 1) {
            Periodo.findById(periodoBusca).then((periodo) => {
                if (periodo.status == "ABERTO") {
                    req.flash('error_msg', "O perido de digitação deve ser encerrado para que os calculos possão ser realizados")
                    res.redirect('/comissao/cargas')
                } else {
                    Agencia.find().then((agencias) => {
                        agencias.forEach((agencia) => {
                            Comissao.findOne({ agencia: agencia._id, periodo: periodo._id }).then((comiss) => {
                                if (!comiss) {
                                    GuiaCarga.find({ origem: agencia._id, periodo: periodo._id }).then((guias) => {
                                        const guiasValidas = guias.filter(g => g.condPag != "CANCELADO")
                                        var guiasCancel = guias.filter(g => g.condPag == "CANCELADO")
                                        var total = 0
                                        var totalValidas = 0
                                        var totalCancel = 0
                                        for (let i = 0; i < guias.length; i++) {
                                            total += parseFloat(guias[i].valor)
                                        }
                                        for (let j = 0; j < guiasValidas.length; j++) {
                                            totalValidas += parseFloat(guiasValidas[j].valor)
                                        }
                                        for (let k = 0; k < guiasCancel.length; k++) {
                                            totalCancel += parseFloat(guiasCancel[k].valor)
                                        }
                                        var comissao = parseFloat((totalValidas * parseFloat(agencia.indiceComissao)) / 100)
                                        const newComissao = {
                                            periodo: periodo._id,
                                            agencia: agencia._id,
                                            empresa: periodo.empresa,
                                            valor: comissao,
                                            totalVendas: total,
                                            qtdVendas: guias.length,
                                            totalValidas: totalValidas,
                                            totalCancelado: totalCancel,
                                            qtdValidos: guiasValidas.length,
                                            qtdCancelado: guiasCancel.length,
                                            mes: moment(periodo.dateInit).format('MM'),
                                            ano: moment(periodo.dateInit).format('YYYY')
                                        }
                                        new Comissao(newComissao).save()
                                    })
                                    success.push({ text: `Comissão da Agencia ${agencia.cidade}, calculada com sucesso ${periodo.nome} ` })
                                } else {
                                    erros.push({ text: `Comissão da Agencia ${agencia.cidade}, já calculada para o periodo ${periodo.nome} ` })
                                }
                            })
                        })
                        periodo.comissao = true
                        periodo.save().then(() => {
                            Periodo.find({ comissao: false }).then((periodos) => {
                                Periodo.find({ comissao: true }).populate('empresa').then((periodosCalculados) => {
                                    for (let i = 0; i < periodosCalculados.length; i++) {
                                        periodosCalculados[i]['dateMin'] = moment(periodosCalculados[i].dateInit).format('DD/MM/YYYY')
                                        periodosCalculados[i]['dateMax'] = moment(periodosCalculados[i].dateFin).format('DD/MM/YYYY')
                                    }
                                    res.render('comissao/comissao_cargas', { periodos, agencias, periodosCalculados, success, erros })
                                }).catch((err) => {
                                    req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                                    res.redirect('/error')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                                res.redirect('/error')
                            })
                        })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao buscar Agencia, Erro: " + err)
                        res.redirect('/comissao/cargas')
                    })
                }

            }).catch((err) => {
                req.flash('error_msg', "Erro ao buscar Periodo, Erro: " + err)
                res.redirect('/comissao/cargas')
            })
        } else {
            Periodo.findById(periodoBusca).populate('empresa').then((periodo) => {
                Agencia.findById(agenciaBusca).then((agencia) => {
                    GuiaCarga.find({ origem: agenciaBusca, periodo: periodoBusca }).then((guias) => {
                        const guiasValidas = guias.filter(g => g.condPag != "CANCELADO")
                        var guiasCancel = guias.filter(g => g.condPag == "CANCELADO")
                        var total = 0
                        var totalValidas = 0
                        var totalCancel = 0
                        for (let i = 0; i < guias.length; i++) {
                            total += parseFloat(guias[i].valor)
                        }
                        for (let j = 0; j < guiasValidas.length; j++) {
                            totalValidas += parseFloat(guiasValidas[j].valor)
                        }
                        for (let k = 0; k < guiasCancel.length; k++) {
                            totalCancel += parseFloat(guiasCancel[k].valor)
                        }
                        var comissao = (totalValidas * agencia.indiceComissao) / 100
                        //console.log(comissao)
                        const newComissao = {
                            periodo: periodo.nome,
                            agencia: agencia.cidade,
                            empresa: periodo.empresa.empresa,
                            valor: comissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            totalVendas: total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            qtdVendas: guias.length,
                            totalValidas: totalValidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            totalCancelado: totalCancel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                            qtdValidos: guiasValidas.length,
                            qtdCancelado: guiasCancel.length,
                            total: total,
                            cancel: totalCancel,
                            valid: totalValidas,
                            comiss: comissao
                        }
                        res.render('comissao/cargas_comissao_agencia', { newComissao, agencia, periodo })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao buscar Guias do periodo, Err" + err)
                        res.redirect('/comissao/cargas')
                    })
                })
            })

        }
    }

})

router.get('/cargas/detalhado/:id', eControle, (req, res) => {

    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        const id = req.params.id
        Periodo.findById(id).then((periodo) => {
            if (periodo.totalComiss == 0) {
                Comissao.find({ periodo: id }).sort({ totalVendas: -1 }).populate('empresa').populate('agencia').populate('periodo').then((comissoes) => {
                    var total = 0
                    var totalVendas = 0
                    for (let i = 0; i < comissoes.length; i++) {
                        total += comissoes[i].valor
                        totalVendas += comissoes[i].totalVendas
                        comissoes[i]['valorExib'] = comissoes[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        comissoes[i]['totalExib'] = comissoes[i].totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        comissoes[i]['totalValidExib'] = comissoes[i].totalValidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        comissoes[i]['totalCancelExib'] = comissoes[i].totalCancelado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                    }

                    periodo.totalVendas = totalVendas
                    periodo.totalComiss = total
                    periodo.save().then(() => {
                        periodo['totalComissExib'] = periodo.totalComiss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        periodo['totalVendasExib'] = periodo.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        res.render('comissao/cargas_comisao_periodo', { comissoes, periodo })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao salvar Comissões do periodo, Err" + err)
                        res.redirect('/comissao/cargas')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao buscar Comissões do periodo, Err" + err)
                    res.redirect('/comissao/cargas')
                })
            } else {
                periodo['totalComissExib'] = periodo.totalComiss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                periodo['totalVendasExib'] = periodo.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                Comissao.find({ periodo: id }).sort({ totalVendas: -1 }).populate('empresa').populate('agencia').populate('periodo').then((comissoes) => {
                    for (let i = 0; i < comissoes.length; i++) {
                        comissoes[i]['valorExib'] = comissoes[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        comissoes[i]['totalExib'] = comissoes[i].totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        comissoes[i]['totalValidExib'] = comissoes[i].totalValidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        comissoes[i]['totalCancelExib'] = comissoes[i].totalCancelado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                    }

                    res.render('comissao/cargas_comisao_periodo', { comissoes, periodo })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao salvar Comissões do periodo, Err" + err)
                    res.redirect('/comissao/cargas')
                })

            }
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar  periodo, Err" + err)
            res.redirect('/comissao/cargas')
        })
    }


})

router.get('/cargas/detalhadoAgencia/:id', eControle, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        const idComissao = req.params.id
        Comissao.findById(idComissao).populate('periodo').populate('empresa').populate('agencia').then((comissao) => {
            const newComissao = {
                periodo: comissao.periodo.nome,
                agencia: comissao.agencia.cidade,
                empresa: comissao.empresa.empresa,
                valor: comissao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                totalVendas: comissao.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                qtdVendas: comissao.qtdVendas,
                totalValidas: comissao.totalValidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                totalCancelado: comissao.totalCancelado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                qtdValidos: comissao.qtdValidos,
                qtdCancelado: comissao.qtdCancelado,
                total: comissao.totalVendas,
                cancel: comissao.totalCancelado,
                valid: comissao.totalValidas,
                comiss: comissao.valor
            }
            res.render('comissao/cargas_comissao_agencia', { newComissao: newComissao })

        }).catch((err) => {
            req.flash('error_msg', 'Erro ao Buscar comissao')
            res.redirect('/comissao/cargas')
        })
    }


})

router.get('/cargas/excluir_calculos', eControle, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        const { periodo } = req.query
        console.log()
        Periodo.findById(periodo).then((per) => {
            Comissao.deleteMany({ periodo: periodo }).then(() => {
                per.comissao = false
                per.totalComiss = 0
                per.totalVendas = 0
                per.save().then(() => {
                    req.flash('success_msg', "Exclusão realizada com sucesso")
                    res.redirect('/comissao/cargas')
                }).catch((err) => {
                    req.flash('error_msg', "Erro Ao tentar liberar perido para calculos de comissao " + err)
                    res.redirect('/comissao/cargas')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro Ao tentar Excuir calculos de comissao " + err)
                res.redirect('/comissao/cargas')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro Ao Buscar Periodo " + err)
            res.redirect('/comissao/cargas')
        })
    }

})

/*router.get('/cargas/detalhado/:periodo', lOgado, (req, res) => {
    Periodo.findOne({ nome: req.params.periodo }).then((periodo) => {
        Comissao.find({ periodo: req.params.periodo }).sort({ agencia: 1 }).then((comissoes) => {
            for (let j = 0; j < comissoes.length; j++) {
                comissoes[j]["dInitExib"] = moment(comissoes[j].dateInit).format('DD/MM/YYYY')
                comissoes[j]["dtFimExib"] = moment(comissoes[j].dateFin).format('DD/MM/YYYY')
                comissoes[j]["totalExib"] = comissoes[j].totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                comissoes[j]["valorExib"] = comissoes[j].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
            const user = req.user
            periodo["inicio"] = moment(periodo.dateInit).format('DD/MM/YYYY')
            periodo["final"] = moment(periodo.dateFin).format('DD/MM/YYYY')
            res.render('comissao/detalhado', { comissoes, periodo, user })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar Comissões do periodo, Err" + err)
            res.redirect('/comissao')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar Periodo, Erro: " + err)
        res.redirect('/comissao')
    })
})*/

router.post('/cargas/excluir', eControle, (req, res) => {
    const usuario = req.user
    if (usuario.perfil == "AGENTE") {
        req.flash('error_msg', "Rota não auorizada para o usuario")
        res.redirect('/agencias')
    } else {
        const periodos = req.body.periodo

        if (!periodos) {
            req.flash('error_msg', "Selecione um periodo para exclusão dos calculos de Comissão")
            res.redirect('/comissao/cargas')
        } else if (Array.isArray(periodos)) {
            var success = []
            var error = []

            periodos.forEach(period => {
                Periodo.findById(period).then((p) => {
                    p.comissao = false
                    p.totalComiss = 0
                    p.save().then(() => {
                        Comissao.deleteMany({ periodo: period }).then(() => {
                            success.push({ texto: "Comissoes do periodo " + p.nome + " excluidos com sucesso" })
                        })
                    }).catch((err) => {
                        error.push({ texto: "Erro ao reabrir periodo " + p.nome + " " + err })
                    })
                }).catch((err) => {
                    error.push({ texto: "Erro ao buscar periodo " + p.nome + " " + err })
                })
            });
            Agencia.find().then((agencias) => {
                Periodo.find({ comissao: false }).then((periodos) => {
                    Periodo.find({ comissao: true }).populate('empresa').then((periodosCalculados) => {
                        for (let i = 0; i < periodosCalculados.length; i++) {
                            periodosCalculados[i]['dateMin'] = moment(periodosCalculados[i].dateInit).format('DD/MM/YYYY')
                            periodosCalculados[i]['dateMax'] = moment(periodosCalculados[i].dateFin).format('DD/MM/YYYY')
                        }
                        res.render('comissao/comissao_cargas', { periodos, agencias, periodosCalculados, error, success })
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                        res.redirect('/error')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
                    res.redirect('/error')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao tentar buscar agencias", err)
                res.redirect('/error')
            })
        } else {
            Periodo.findById(periodos).then((periodo) => {
                Comissao.deleteMany({ periodo: periodos }).then(() => {
                    periodo.comissao = false
                    periodo.totalComiss = 0
                    periodo.save().then(() => {
                        req.flash('success_msg', "Periodo " + periodos + " editado com sucesso, Calculo das comissões excluidos")
                        res.redirect('/comissao/cargas')
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao salvar edição periodo de calculo " + err)
                        res.redirect('/comissao/cargas')
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao disponibilizar periodo para calculo " + err)
                    res.redirect('/comissao/cargas')
                })
            }).catch((err) => {
                req.flash('error_msg', "Não foi possivel excluir Calculos para o periodo Informado ERR: " + err)
                res.redirect('/comissao/cargas')
            })

            /*Comissao.deleteMany({ periodo: periodos[j] }).then(() => {
                Periodo.findOne({ nome: periodos[j] }).then((periodo) => {
                    periodo.comissao = false,
                    periodo.totalComiss = 0
                    periodo.save().then(() => {
                        req.flash('success_msg', "Periodo " + periodos[j] + " editado com sucesso")
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao salvar edição periodo de calculo " + err)
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao disponibilizar periodo para calculo " + err)
                })
            }).catch((err) => {
                req.flash('error_msg', "Não foi possivel excluir Calculos para o periodo Informado ERR: " + err)
            })*/
        }

    }


})

//Seguro
/*router.get('/seguro', (req, res) => {
    Agencia.find().then((agencias) => {
        Periodo.find({ comissao: "true" }).then((periodos) => {
            if (periodos.length > 0) {
                for (let j = 0; j < periodos.length; j++) {
                    periodos[j]["dInitExib"] = moment(periodos[j].dateInit).format('DD/MM/YYYY')
                    periodos[j]["dtFimExib"] = moment(periodos[j].dateFin).format('DD/MM/YYYY')
                    periodos[j]["totalExib"] = periodos[j].totalComiss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                }
            }
            res.render('comissao/index', { periodos, agencias })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao tentar buscar comissoes", err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao tentar buscar agencias", err)
        res.redirect('/painel')
    })
})

router.get('/seguro/calcular', (req, res) => {
    const { periodo, agencia } = req.query
    if (agencia == '1' || agencia == 1) {
        G
    }
})

router.get('/seguro/detalhado/:periodo', (req, res) => {
    Periodo.findOne({ nome: req.params.periodo }).then((periodo) => {
        Comissao.find({ periodo: req.params.periodo }).sort({ agencia: 1 }).then((comissoes) => {
            for (let j = 0; j < comissoes.length; j++) {
                comissoes[j]["dInitExib"] = moment(comissoes[j].dateInit).format('DD/MM/YYYY')
                comissoes[j]["dtFimExib"] = moment(comissoes[j].dateFin).format('DD/MM/YYYY')
                comissoes[j]["totalExib"] = comissoes[j].totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                comissoes[j]["valorExib"] = comissoes[j].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
            const user = req.user
            periodo["inicio"] = moment(periodo.dateInit).format('DD/MM/YYYY')
            periodo["final"] = moment(periodo.dateFin).format('DD/MM/YYYY')
            res.render('comissao/detalhado', { comissoes, periodo, user })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao buscar Comissões do periodo, Err" + err)
            res.redirect('/comissao')
        })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao buscar Periodo, Erro: " + err)
        res.redirect('/comissao')
    })
})

router.post('/seguro/excluir', (req, res) => {
    const periodos = req.body.periodo

    if (periodos.length == 0 || periodos == undefined) {
        req.flash('error_msg', "Selecione um periodo para exclusão dos calculos de Comissão")
        res.redirect('/comissao')
    }
    if (periodos.length == 1) {
        Comissao.deleteMany({ periodo: periodos }).then(() => {
            Periodo.findOne({ nome: periodos }).then((periodo) => {
                periodo.comissao = false
                periodo.totalComiss = 0
                periodo.save().then(() => {
                    req.flash('success_msg', "Periodo " + periodos + " editado com sucesso, Calculo das comissões excluidos")
                    res.redirect('/comissao')
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao salvar edição periodo de calculo " + err)
                    res.redirect('/comissao')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao disponibilizar periodo para calculo " + err)
                res.redirect('/comissao')
            })
        }).catch((err) => {
            req.flash('error_msg', "Não foi possivel excluir Calculos para o periodo Informado ERR: " + err)
            res.redirect('/comissao')
        })
    } else {
        for (let j = 0; j < periodos.length; j++) {
            Comissao.deleteMany({ periodo: periodos[j] }).then(() => {
                Periodo.findOne({ nome: periodos[j] }).then((periodo) => {
                    periodo.comissao = false,
                        periodo.totalComiss = 0
                    periodo.save().then(() => {
                        req.flash('success_msg', "Periodo " + periodos[j] + " editado com sucesso")
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao salvar edição periodo de calculo " + err)
                    })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao disponibilizar periodo para calculo " + err)
                })
            }).catch((err) => {
                req.flash('error_msg', "Não foi possivel excluir Calculos para o periodo Informado ERR: " + err)
            })
        }

        res.redirect('/comissao')
    }
})*/

module.exports = router