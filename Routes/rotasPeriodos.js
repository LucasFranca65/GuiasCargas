const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado, eAdmin, eDigitador, eControle } = require('../helpers/eAdmin')

//Mongoose Models
require('../models/Empresa')
const Empresa = mongoose.model('empresas')
require('../models/Periodo')
const Periodo = mongoose.model('periodos')
require('../models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')


//Painel principal das guias
//Falta fazer Paginação 
router.get('/', eDigitador, (req, res) => {
    Empresa.find().then((empresas) => {
        Periodo.find({ status: "FECHADO" }).populate('empresa').limit(5).sort({ _id: -1 }).then((periodosFechados) => {
            Periodo.find({ status: "ABERTO" }).populate('empresa').limit(5).sort({ _id: -1 }).then((periodosAbertos) => {
                if (periodosFechados.length > 0) {
                    for (let i = 0; i < periodosFechados.length; i++) {
                        periodosFechados[i]["dateExibInit"] = moment(periodosFechados[i].dateInit).format('DD/MM/YYYY')
                        periodosFechados[i]["dateExibFin"] = moment(periodosFechados[i].dateFin).format('DD/MM/YYYY')
                    }
                }
                if (periodosAbertos.length > 0) {
                    for (let i = 0; i < periodosAbertos.length; i++) {
                        periodosAbertos[i]["dateExibInit"] = moment(periodosAbertos[i].dateInit).format('DD/MM/YYYY')
                        periodosAbertos[i]["dateExibFin"] = moment(periodosAbertos[i].dateFin).format('DD/MM/YYYY')

                    }
                }
                res.render('administracao/periodos/index_periodos', { empresas, periodosAbertos, periodosFechados })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar  periodos Abertos para digitação, ERRO: " + err)
                res.redirect('/painel')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar  periodos encerrados para digitação, ERRO: " + err)
            res.redirect('/painel')
        })
    }).catch((err) => {
        req.flash('error_msg', "erro ao buscar empresas, ERRO: " + err)
        res.redirect('/painel')
    })
})

router.post('/adicionar', eControle, (req, res) => {
    const { empresa, mes, ano } = req.body
    var erros = []
    if (empresa == "selecione") {
        erros.push({ texto: "Selecione uma empresa mês e ano para gerar um periodo de controle" })
    }
    if (mes.length != 2) {
        erros.push({ texto: "o campo mes deve conter 2 digitos" })
    }
    if (ano.length != 4) {
        erros.push({ texto: "o campo ano deve conter 4 digitos" })
    }
    if (erros.length > 0) {
        Empresa.find().then((empresas) => {
            Periodo.find({ status: "FECHADO" }).populate('empresa').limit(5).sort({ _id: -1 }).then((periodosFechados) => {
                Periodo.find({ status: "ABERTO" }).populate('empresa').limit(5).sort({ _id: -1 }).then((periodosAbertos) => {
                    if (periodosFechados.length > 0) {
                        for (let i = 0; i < periodosFechados.length; i++) {
                            periodosFechados[i]["dateExibInit"] = moment(periodosFechados[i].dateInit).format('DD/MM/YYYY')
                            periodosFechados[i]["dateExibFin"] = moment(periodosFechados[i].dateFin).format('DD/MM/YYYY')
                        }
                    }
                    if (periodosAbertos.length > 0) {
                        for (let i = 0; i < periodosAbertos.length; i++) {
                            periodosAbertos[i]["dateExibInit"] = moment(periodosAbertos[i].dateInit).format('DD/MM/YYYY')
                            periodosAbertos[i]["dateExibFin"] = moment(periodosAbertos[i].dateFin).format('DD/MM/YYYY')

                        }
                    }
                    res.render('administracao/periodos/index_periodos', { empresas, periodosAbertos, periodosFechados, erros })
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar  periodos Abertos para digitação, ERRO: " + err)
                    res.redirect('/painel')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar  periodos encerrados para digitação, ERRO: " + err)
                res.redirect('/painel')
            })
        }).catch((err) => {
            req.flash('error_msg', "erro ao buscar empresas, ERRO: " + err)
            res.redirect('/painel')
        })
    } else {
        Empresa.findOne({ _id: empresa }).then((empresa) => {
            var strEmp = empresa.empresa.replace(/\s/g, '')
            const reference = (strEmp + "-" + mes + "-" + ano)
            Periodo.findOne({ nome: reference }).then((periodo) => {
                if (periodo) {
                    req.flash('error_msg', "Já existe um periodo criado para esses dados")
                    res.redirect('/administracao/controle')
                } else {
                    var uDia = 31
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

                }

                const newPeriodo = {
                    nome: reference,
                    empresa: empresa,
                    dateInit: moment(mes + '-01' + ano + " 00:00:00", 'MM-DD-YYYY HH:mm:ss', true).format(),
                    dateFin: moment(mes + '-' + uDia + '-' + ano + " 23:59:59", 'MM-DD-YYYY HH:mm:ss', true).format(),
                    mes,
                    ano
                }

                new Periodo(newPeriodo).save().then(() => {
                    console.log("Periodo " + reference + " Criado com sucesso")
                    req.flash('success_msg', "Periodo " + reference + " Criado com sucesso")
                    res.redirect('/periodos')
                }).catch((err) => {
                    req.flash('error_msg', "Erro ao criar periodo " + err)
                    res.redirect('/periodos')
                })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar periodo " + err)
                res.redirect('/periodos')
            })
        }).catch((err) => {
            req.flash('error_msg', "Erro ao Buscar empresa " + err)
            res.redirect('/periodos')
        })
    }

})

router.get('/dadosPeriododeControle/:id', eDigitador, (req, res) => {
    const id = req.params.id
    Periodo.findById(id).populate('empresa').then((periodo) => {
        if (periodo) {
            periodo['inicial'] = moment(periodo.dateInit).format('DD/MM/YYYY')
            periodo['final'] = moment(periodo.dateFin).format('DD/MM/YYYY')
            periodo['vendasT'] = periodo.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            periodo['comissaoT'] = periodo.totalComiss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            GuiaCarga.find({ periodo: id }).then((guias) => {
                //console.log(guias)
                var guiasPagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                //console.log(guiasPagas)
                var guiasPendentes = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format('YYYY-MM-DD') > moment(new Date()).format('YYYY-MM-DD'))
                var guiasVencidas = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format('YYYY-MM-DD') < moment(new Date()).format('YYYY-MM-DD'))
                var guiasCanceladas = guias.filter(g => g.baixaPag == true && g.condPag == "CANCELADO")

                var resumo = {
                    pagasValor: 0,
                    pagasQtd: 0,
                    pendentesValor: 0,
                    pendentesQtd: 0,
                    vencidasValor: 0,
                    vencidasQtd: 0,
                    canceladasValor: 0,
                    canceladasQtd: 0,
                    total: 0,
                    qtdTotal: 0
                }

                for (let i = 0; i < guiasPagas.length; i++) {
                    resumo.pagasValor += guiasPagas[i].valor
                    resumo.pagasQtd++
                }
                for (let i = 0; i < guiasPendentes.length; i++) {
                    resumo.pendentesValor += guiasPendentes[i].valor
                    resumo.pendentesQtd++
                }
                for (let i = 0; i < guiasVencidas.length; i++) {
                    resumo.vencidasValor += guiasVencidas[i].valor
                    resumo.vencidasQtd++
                }
                for (let i = 0; i < guiasCanceladas.length; i++) {
                    resumo.canceladasValor += guiasCanceladas[i].valor
                    resumo.canceladasQtd++
                }
                resumo.total = (resumo.pagasValor + resumo.pendentesValor + resumo.vencidasValor + resumo.canceladasValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                resumo.qtdTotal = resumo.pagasQtd + resumo.pendentesQtd + resumo.vencidasQtd + resumo.canceladasQtd
                resumo.pagasValor = resumo.pagasValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                resumo.pendentesValor = resumo.pendentesValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                resumo.vencidasValor = resumo.vencidasValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                resumo.canceladasValor = resumo.canceladasValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                res.render('administracao/periodos/dados_periodo', { periodo, resumo })
            }).catch((err) => {
                req.flash('error_msg', "Erro ao Buscar Guias, ERRO: " + err)
                res.redirect('/periodos')
            })

        } else {
            req.flash('error_msg', 'N?ão foi encontrado dados para os parametros informados')
            res.redirect('/periodos')
        }
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Periodos, ERRO: " + err)
        res.redirect('/periodos')
    })
})

router.get('/dadosPeriododeControle/listar/:n/:id', eDigitador, (req, res) => {
    const n = req.params.n
    const id = req.params.id
    console.log(n, id)
    switch (n) {
        case "1":
            res.redirect(`/periodos/listarGuiasPagas/${id}`)
            break;

        case "2":
            res.redirect('/periodos/listarGuiasPendentes/' + id)
            break;

        case "3":
            res.redirect('/periodos/listarGuiasVencidas/' + id)
            break;

        case "4":
            res.redirect('/periodos/listarGuiasCanceladas/' + id)
            break;
        default:
            req.flash('error_msg', "Falha ao tentar listar guia de controle")
            res.redirect('/periodos/dadosPeriododeControle/' + id)
            break;
    }
})

router.get('/listarGuiasPagas/:id', eDigitador, (req, res) => {
    const id = req.params.id
    GuiaCarga.find({ periodo: id, baixaPag: true, $nor: [{ condPag: "CANCELADO" }] }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((dados) => {
        var title = {
            tipoDeGuia: "Pagas",
            qtd: 0,
            total: 0,
            baixar: 'disabled',
            periodo: dados[0].periodo
        }
        title.qtd = dados.length

        for (let i = 0; i < dados.length; i++) {
            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
            dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            dados[i]["statusBaixa"] = "PAGO"
            title.total += dados[i].valor
        }
        title.total = title.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        res.render('guiasDeCargas/listar_guias', { dados, title })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Guias, ERRO: " + err)
        res.redirect('/periodos')
    })
})

router.get('/listarGuiasPendentes/:id', eDigitador, (req, res) => {
    const id = req.params.id
    GuiaCarga.find({ periodo: id, baixaPag: false, vencimento: { $gt: moment(new Date().format) } }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((dados, tipo) => {
        var title = {
            tipoDeGuia: "Pendentes",
            qtd: 0,
            total: 0,
            periodo: dados[0].periodo
        }
        title.qtd = dados.length

        for (let i = 0; i < dados.length; i++) {
            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
            dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            dados[i]["statusBaixa"] = "Pendente"
            title.total += dados[i].valor
        }
        title.total = title.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        res.render('guiasDeCargas/listar_guias', { dados, title })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Guias, ERRO: " + err)
        res.redirect('/periodos')
    })
})

router.get('/listarGuiasVencidas/:id', eDigitador, (req, res) => {
    const id = req.params.id
    GuiaCarga.find({ periodo: id, baixaPag: false, vencimento: { $lt: moment(new Date().format) } }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((dados, tipo) => {
        var title = {
            tipoDeGuia: "Vencidas",
            qtd: 0,
            total: 0,
            periodo: dados[0].periodo

        }
        title.qtd = dados.length

        for (let i = 0; i < dados.length; i++) {
            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
            dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            dados[i]["statusBaixa"] = "Vencida"
            title.total += dados[i].valor
        }
        title.total = title.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        res.render('guiasDeCargas/listar_guias', { dados, title })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Guias, ERRO: " + err)
        res.redirect('/periodos')
    })
})

router.get('/listarGuiasCanceladas/:id', eDigitador, (req, res) => {
    const id = req.params.id
    GuiaCarga.find({ periodo: id, baixaPag: true, condPag: "CANCELADO" }).populate('origem').populate('destino').populate('empresa').populate('cliente').then((dados, tipo) => {
        var title = {
            tipoDeGuia: "Cancleadas",
            qtd: 0,
            total: 0,
            baixar: 'disabled',
            periodo: dados[0].periodo
        }
        title.qtd = dados.length

        for (let i = 0; i < dados.length; i++) {
            dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
            dados[i]["venc_exib"] = moment(dados[i].vencimento).format('DD/MM/YYYY')
            dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            dados[i]["statusBaixa"] = "Canceladas"
            title.total += dados[i].valor
        }
        title.total = title.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        res.render('guiasDeCargas/listar_guias', { dados, title })
    }).catch((err) => {
        req.flash('error_msg', "Erro ao Buscar Guias, ERRO: " + err)
        res.redirect('/periodos')
    })
})

router.post('/encerrar', eControle, (req, res) => {
    const ident = req.body.ident
    if (!ident) {
        req.flash('error_msg', "Selecione um periodo para encerramento")
        res.redirect('/periodos')
    } else {

        if (Array.isArray(ident)) {
            var erros = []
            var sucessos = []
            ident.forEach(id => {
                Periodo.findById(id).then((periodo) => {
                    periodo.status = 'FECHADO'
                    periodo.save().then(() => {
                        sucessos.push({ texto: "Periodo " + periodo.nome + " Fechado com sucesso" })
                    }).catch((err) => {
                        erros.push(erros.push({ texto: "Erro ao Salvar Encerramento do periodo " + periodo.nome + ", ERRO: " + err }))
                    })
                }).catch((err) => {
                    erros.push(erros.push({ texto: "Erro ao buscar periodo para encerramento, ERRO: " + err }))
                })
            });

            Empresa.find().then((empresas) => {
                Periodo.find().populate('empresa').sort({ _id: -1 }).then((periodos) => {
                    const periodosAbertos = periodos.filter(p => p.status == "ABERTO")
                    const periodosFechados = periodos.filter(p => p.status == "FECHADO")
                    if (periodosFechados.length > 0) {
                        for (let i = 0; i < periodosFechados.length; i++) {
                            periodosFechados[i]["dateExibInit"] = moment(periodosFechados[i].dateInit).format('DD/MM/YYYY')
                            periodosFechados[i]["dateExibFin"] = moment(periodosFechados[i].dateFin).format('DD/MM/YYYY')
                        }
                    }
                    if (periodosAbertos.length > 0) {
                        for (let i = 0; i < periodosAbertos.length; i++) {
                            periodosAbertos[i]["dateExibInit"] = moment(periodosAbertos[i].dateInit).format('DD/MM/YYYY')
                            periodosAbertos[i]["dateExibFin"] = moment(periodosAbertos[i].dateFin).format('DD/MM/YYYY')
                        }
                    }
                    res.render('administracao/periodos/index_periodos', { empresas, periodosAbertos, periodosFechados, erros, sucessos })

                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar  periodos encerrados para digitação, ERRO: " + err)
                    res.redirect('/periodos')
                })
            }).catch((err) => {
                req.flash('error_msg', "erro ao buscar empresas, ERRO: " + err)
                res.redirect('/periodos')
            })

        } else {
            Periodo.findById(ident).then((periodo) => {
                if (!periodo) {
                    req.flash('error_msg', "Periodo não encontrado ")
                    res.redirect('/periodos')
                } else {
                    periodo.status = "FECHADO"
                    periodo.save().then(() => {
                        req.flash('success_msg', 'Periodo Selecionado Fechado com sucesso')
                        res.redirect('/periodos')
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao Salvar Encerramento do periodo, ERRO: " + err)
                        res.redirect('/periodos')
                    })
                }

            }).catch((err) => {
                req.flash('error_msg', "Erro ao Salvar Encerramento do periodo, ERRO: " + err)
                res.redirect('/periodos')
            })
        }
    }
})

router.post('/reabrir', eControle, (req, res) => {
    const ident = req.body.ident
    if (!ident) {
        req.flash('error_msg', "Selecione um periodo para reabertura")
        res.redirect('/periodos')
    } else {

        if (Array.isArray(ident)) {
            var erros = []
            var sucessos = []
            ident.forEach(id => {
                Periodo.findById(id).then((periodo) => {
                    periodo.status = 'ABERTO'
                    periodo.save().then(() => {
                        sucessos.push({ texto: "Periodo " + periodo.nome + " Reaberto com sucesso" })
                    }).catch((err) => {
                        erros.push(erros.push({ texto: "Erro ao Salvar reabertura do periodo " + periodo.nome + ", ERRO: " + err }))
                    })
                }).catch((err) => {
                    erros.push({ texto: "Erro ao buscar periodo para reabertura, ERRO: " + err })
                })
            });
            Empresa.find().then((empresas) => {
                Periodo.find().populate('empresa').sort({ _id: -1 }).then((periodos) => {
                    const periodosAbertos = periodos.filter(p => p.status == "ABERTO")
                    const periodosFechados = periodos.filter(p => p.status == "FECHADO")
                    if (periodosFechados.length > 0) {
                        for (let i = 0; i < periodosFechados.length; i++) {
                            periodosFechados[i]["dateExibInit"] = moment(periodosFechados[i].dateInit).format('DD/MM/YYYY')
                            periodosFechados[i]["dateExibFin"] = moment(periodosFechados[i].dateFin).format('DD/MM/YYYY')
                        }
                    }
                    if (periodosAbertos.length > 0) {
                        for (let i = 0; i < periodosAbertos.length; i++) {
                            periodosAbertos[i]["dateExibInit"] = moment(periodosAbertos[i].dateInit).format('DD/MM/YYYY')
                            periodosAbertos[i]["dateExibFin"] = moment(periodosAbertos[i].dateFin).format('DD/MM/YYYY')
                        }
                    }
                    res.render('administracao/periodos/index_periodos', { empresas, periodosAbertos, periodosFechados, erros, sucessos })


                }).catch((err) => {
                    req.flash('error_msg', "Erro ao Buscar  periodos para digitação, ERRO: " + err)
                    res.redirect('/painel')
                })
            }).catch((err) => {
                req.flash('error_msg', "erro ao buscar empresas, ERRO: " + err)
                res.redirect('/painel')
            })
        } else {
            Periodo.findById(ident).then((periodo) => {
                if (!periodo) {
                    req.flash('error_msg', "Periodo não encontrado ")
                    res.redirect('/periodos')
                } else {
                    periodo.status = "ABERTO"
                    periodo.save().then(() => {
                        req.flash('success_msg', 'Periodo Selecionado reaberto com sucesso')
                        res.redirect('/periodos')
                    }).catch((err) => {
                        req.flash('error_msg', "Erro ao Salvar reabertura do periodo, ERRO: " + err)
                        res.redirect('/periodos')
                    })
                }

            }).catch((err) => {
                req.flash('error_msg', "Erro ao Salvar reabertura do periodo, ERRO: " + err)
                res.redirect('/periodos')
            })
        }

    }
})

module.exports = router