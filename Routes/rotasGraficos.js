const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const moment = require('moment')
const flash = require('connect-flash')
const { lOgado, eAdmin } = require('../helpers/eAdmin')

//Mongoose Models
require('../Models/System')
const System = mongoose.model('systens')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')
require('../Models/Talao')
const Talao = mongoose.model('taloes')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../Models/Periodo')
const Periodo = mongoose.model('periodos')

//Painel principal das guias
router.get('/grafico_vendas', lOgado, (req, res) => {
    const dataAtual = moment(moment('01/15/2024', 'MM/DD/YYYY', true).format()).format()
    Periodo.findOne({ dateInit: { $lte: dataAtual }, dateFin: { $gte: dataAtual } }).then(periodo => {
        if (periodo.length < 1) {
            const grafico = {
                vendidos: 0,
                cancelados: 0,
                pagos: 0,
                vencidos: 0,
                pendentes: 0,
                periodo: 'Não Encontrado'
            }
            res.end(JSON.stringify(grafico))
        } else {
            const dateMin = moment(periodo.dateInit).format()
            const dateMax = moment(periodo.dateFin).format()

            GuiaCarga.find({ dateEntrada: { $lte: dateMax }, dateEntrada: { $gte: dateMin } }).then((guias) => {
                var pagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                var cancelados = guias.filter(g => g.condPag == "CANCELADO")
                var pendentes = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format('MM-DD-YYYY') >= moment(new Date()).format('MM-DD-YYYY'))
                var vencidos = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                //console.log(guias.length)
                const grafico = {
                    vendidos: guias.length,
                    cancelados: cancelados.length,
                    pagos: pagas.length,
                    vencidos: vencidos.length,
                    pendentes: pendentes.length,
                    periodo: periodo.nome

                }
                res.end(JSON.stringify(grafico))

            }).catch((err) => {
                const grafico = {
                    vendidos: 404,
                    cancelados: 404,
                    pagos: 404,
                    vencidos: 404,
                    pendentes: 404,
                    periodo: 'Não Encontrado'
                }
                res.end(JSON.stringify(grafico))

            })
        }
    })

})

router.get('/grafico_valores', lOgado, (req, res) => {
    const dataAtual = moment(moment('01/15/2024', 'MM/DD/YYYY', true).format()).format()
    Periodo.findOne({ dateInit: { $lte: dataAtual }, dateFin: { $gte: dataAtual } }).then(periodo => {
        if (!periodo) {
            const grafico = {
                vendidos: 0,
                cancelados: 0,
                pagos: 0,
                vencidos: 0,
                pendentes: 0,
                periodo: 'Não Encontrado'
            }
            res.end(JSON.stringify(grafico))
        } else {
            const dateMin = moment(periodo.dateInit).format()
            const dateMax = moment(periodo.dateFin).format()
            GuiaCarga.find({ dateEntrada: { $lte: dateMax }, dateEntrada: { $gte: dateMin } }).then((guias) => {
                var grafico = {
                    vendidos: 0,
                    cancelados: 0,
                    pagos: 0,
                    vencidos: 0,
                    pendentes: 0,
                    periodo: periodo.nome
                }
                var pagas = guias.filter(g => g.baixaPag == true && g.condPag != "CANCELADO")
                var canceladas = guias.filter(g => g.condPag == "CANCELADO")
                var gPendentes = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format('MM-DD-YYYY') >= moment(new Date()).format('MM-DD-YYYY'))
                var vencidas = guias.filter(g => g.baixaPag == false && moment(g.vencimento).format('MM-DD-YYYY') <= moment(new Date()).format('MM-DD-YYYY'))
                //console.log(canceladas)

                for (let i = 0; i < guias.length; i++) {
                    grafico.vendidos += guias[i].valor
                }
                for (let i = 0; i < pagas.length; i++) {
                    grafico.pagos += pagas[i].valor
                }
                for (let i = 0; i < canceladas.length; i++) {
                    grafico.cancelados += canceladas[i].valor
                }
                for (let i = 0; i < gPendentes.length; i++) {
                    grafico.pendentes += gPendentes[i].valor
                }
                for (let i = 0; i < vencidas.length; i++) {
                    grafico.vencidos += vencidas[i].valor
                }

                res.end(JSON.stringify(grafico))

            }).catch((err) => {
                const grafico = {
                    vendidos: 404,
                    cancelados: 404,
                    pagos: 404,
                    vencidos: 404,
                    pendentes: 404,
                    periodo: 'Não Encontrado'
                }
                res.end(JSON.stringify(grafico))

            })
        }
    }).catch((err) => {
        const grafico = {
            vendidos: 404,
            cancelados: 404,
            pagos: 404,
            vencidos: 404,
            pendentes: 404,
            periodo: 'Não Encontrado'
        }
        res.end(JSON.stringify(grafico))

    })

})

module.exports = router