const express = require('express')
const { default: mongoose, model } = require('mongoose')
const router = express.Router()
const moment = require('moment')
const {lOgado} = require('../helpers/eAdmin')
const { route } = require('./rotasAdministrador')
const pdf = require('html-pdf')
//Mongoose Models
require('../Models/User')
const User = mongoose.model('users')
require('../Models/GuiaCarga')
const GuiaCarga = mongoose.model('guiascargas')
require('../Models/Agencia')
const Agencia = mongoose.model('agencias')

router.get('/por_empresa',lOgado,(req,res)=>{
    let next="disabled", prev="disabled"
    res.render('consultasRelatorios/porEmpresa',{next,prev})
})
router.get('/por_empresa/pesquisar',lOgado,(req,res)=>{
    var {empresa ,dateMin,dateMax,offset,page} = req.query
    console.log(empresa, dateMin,dateMax, offset, page)
    dateMax = moment(dateMax).format("YYYY-MM-DDT23:59:59.SSSZ")
    dateMin = moment(dateMin).format("YYYY-MM-DDT00:00:00.SSSZ")
    const limit = 20
        if(!offset){
            offset=0
        }
        if(offset<0){
            offset=0
        }
        else{
            offset = parseInt(offset)
        }
        if(!page){
            page = 1
        }
        if(page<1){
            page = 1
        }else{
            page = parseInt(page)
        }
    if(dateMax < dateMin){
        req.flash('error_msg',"A data inicial não pode ser menor que a final")
        res.redirect('/consulta/por_empresa')
    }else{
        let query = {dateEntrada: {$gte: dateMin, $lt: dateMax}, empresa: empresa}
        GuiaCarga.find(query).limit(limit).skip(offset).sort({dateEntrada: 1}).then((dados)=>{
            if(dados.length == 0){
                req.flash('error_msg',"Não foi encontrado guias para o periodo Informado")
                res.redirect('/consultas/por_empresa')
            }else{
                var next, prev
                if(page == 1){
                    prev = "disabled"
                }
                if(dados.length<limit){
                    next = "disabled"
                }
                var nextUrl = {
                    emp: empresa,
                    dmin: moment(dateMin).format('YYYY-MM-DD'),
                    dmax: moment(dateMax).format('YYYY-MM-DD'),
                    ofst: offset+limit,
                    pag: page+1, 
                }
                var prevUrl = {
                    emp: empresa,
                    dmin: moment(dateMin).format('YYYY-MM-DD'),
                    dmax: moment(dateMax).format('YYYY-MM-DD'),
                    ofst: offset-limit,
                    pag: page-1                    
                }

                var i=0
                while(i < dados.length){                   
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    dados[i]["n"] = (i+1)+offset
                    if(dados[i].baixa==true){
                        dados[i]["statusBaixa"] = "BAIXADO"
                    }else{
                        dados[i]["statusBaixa"] = "PENDENTE"
                    }
                    i++                      
                }
                 res.render('consultasRelatorios/porEmpresa',{dados,nextUrl,prevUrl,page,prev,next})
            }        
                   
        }).catch((err)=>{
            req.flash('error_msg',"Não foi encontrado guias para os parametros no periodo informado")
            res.redirect('/consultas/por_empresa')
        })
    }
})

router.get('/por_usuario',lOgado,(req,res)=>{
    let next="disabled", prev="disabled"
    User.find().then((users)=>{
        res.render('consultasRelatorios/porUsuario',{users, next, prev})
    }).catch((err)=>{
        req.flash('error_msg',"Erro interno ao carregar usuarios")
        res.redirect('/painel')
    })
    
})

router.get('/por_usuario/pesquisar',lOgado,(req,res)=>{
    var {usuario ,dateMin , dateMax, offset, page} = req.query
    console.log(usuario ,dateMin , dateMax, offset, page)
    //res.redirect('/consultas/por_usuario')
        const limit = 20
        if(!offset){
            offset=0
        }
        if(offset<0){
            offset=0
        }
        else{
            offset = parseInt(offset)
        }
        if(!page){
            page = 1
        }
        if(page<1){
            page = 1
        }else{
            page = parseInt(page)
        } 
       
    dateMax = moment(dateMax).format("YYYY-MM-DDT23:59:59.SSSZ")
    dateMin = moment(dateMin).format("YYYY-MM-DDT00:00:00.SSSZ")
    
    if(dateMax < dateMin){
        req.flash('error_msg',"A data inicial não pode ser menor que a final")
        res.redirect('/consulta/por_usuario')
    }else{
        let query = {dateEntrada: {$gte: dateMin, $lt: dateMax}, user: usuario}
        
        GuiaCarga.find(query).limit(limit).skip(offset).sort({dateEntrada: 1}).then((dados)=>{            
                var next, prev
                if(page == 1){
                    prev = "disabled"
                }
                if(dados.length<limit){
                    next = "disabled"
                }                
                if(dados.length == 0){
                    req.flash('error_msg',"Não foi encontrado guias para o periodo Informado")
                    res.redirect('/consultas/por_usuario')
                }
                else{
                    var nextUrl = {
                        user: usuario,
                        dmin: dateMin,
                        dmax: dateMax,
                        ofst: offset+limit,
                        pag: page+1, 
                    }
                    var prevUrl = {
                        user: usuario,
                        dmin: dateMin,
                        dmax: dateMax,
                        ofst: offset-limit,
                        pag: page-1                    
                    }
                var i=0
                while(i < dados.length){                   
                    dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                    dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                    dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    dados[i]["n"] = (i+1)+offset
                    if(dados[i].baixa==true){
                        dados[i]["statusBaixa"] = "BAIXADO"
                    }else{
                        dados[i]["statusBaixa"] = "PENDENTE"
                    }
                    i++                      
                }
                 res.render('consultasRelatorios/porUsuario',{dados, nextUrl, prevUrl, page,next, prev})
            }        
                   
        }).catch((err)=>{
            req.flash('error_msg',"Não foi encontrado guias para os parametros no periodo informado")
            console.log(err)
            res.redirect('/consultas/por_usuario')
        })
    }
})

router.get('/comissao',lOgado,(req,res)=>{
    Agencia.find().then((agencias)=>{
        let i = 0
        while(agencias.length){
            GuiaCarga.find({origem: agencias[i].nome}).then((guias)=>{
                console.log(guias)
            })
        }
    }).catch((err)=>{
        req.flash('error_msg',"Erro ao carregar agencias"+err)
        res.redirect('/painel')
    })
        
    

    res.render('consultasRelatorios/comissao')   
    
})

router.get('/por_agencia',lOgado,(req,res)=>{
    let next="disabled", prev="disabled"
    Agencia.find().sort({cidade: 1}).then((agencias)=>{
        res.render('consultasRelatorios/porAgencia',{agencias, next, prev})
    }).catch((err)=>{
        req.flash('error_msg',"Erro interno ao carregar agencias")
        res.redirect('/painel')
    })
    
})

router.get('/por_agencia/pesquisar',lOgado,(req,res)=>{    
    let error =[]   
    var {agencia ,dateMin , dateMax, offset, page} = req.query
        const limit = 20
        if(!offset){
            offset=0
        }
        if(offset<0){
            offset=0
        }
        else{
            offset = parseInt(offset)
        }
        if(!page){
            page = 1
        }
        if(page<1){
            page = 1
        }else{
            page = parseInt(page)
        }      

    dateMax = moment(dateMax).format("YYYY-MM-DDT23:59:59.SSSZ")
    dateMin = moment(dateMin).format("YYYY-MM-DDT00:00:00.SSSZ")
    //console.log('agencia= '+agencia +', dateMin= '+ dateMin+', dateMax= '+dateMax+'limit ='+limit+'Offset='+offset)
     
    if(dateMax < dateMin){
        error.push({texto:"A data inicial não pode ser menor que a final"})
    }
    if(agencia == "selecione"){
        error.push({texto:"Selecione uma agencia"})    
    }
    if(error.length > 0){
        Agencia.find().sort({cidade: 1}).then((agencias)=>{
            res.render('consultasRelatorios/porAgencia',{agencias, error})
        }).catch((err)=>{
            req.flash('error_msg',"Erro interno ao carregar agencias",err)
            res.redirect('/consultas/por_agencia')
        })        
    }else{
        let query = {dateEntrada: {$gte: dateMin, $lt: dateMax}, origem: agencia}    
        Agencia.find().sort({cidade: 1}).then((agencias)=>{            
            GuiaCarga.find(query).limit(limit).skip(offset).sort({dateEntrada: 1}).then((dados)=>{
                var next, prev
                if(page == 1){
                    prev = "disabled"
                }
                if(dados.length<limit){
                    next = "disabled"
                }
                var nextUrl = {
                    agen: agencia,
                    dmin: moment(dateMin).format('YYYY-MM-DD'),
                    dmax: moment(dateMax).format('YYYY-MM-DD'),
                    ofst: offset+limit,
                    pag: page+1, 
                }
                var prevUrl = {
                    agen: agencia,
                    dmin: moment(dateMin).format('YYYY-MM-DD'),
                    dmax: moment(dateMax).format('YYYY-MM-DD'),
                    ofst: offset-limit,
                    pag: page-1                    
                }
                
                if(dados.length < 1){
                    req.flash('error_msg',"Não foi encontrado guias para o periodo Informado")
                    res.redirect('/consultas/por_agencia')
                }else{                                        
                    var i=0
                    while(i < dados.length){                   
                        dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                        dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                        dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        dados[i]["n"] = (i+1)+offset
                        if(dados[i].baixa==true){
                            dados[i]["statusBaixa"] = "BAIXADO"
                        }else{
                            dados[i]["statusBaixa"] = "PENDENTE"
                        }
                        i++                      
                    }
                    res.render('consultasRelatorios/porAgencia',{dados, agencias, nextUrl,prevUrl,page,prev,next})
                }        
                    
            }).catch((err)=>{
                req.flash('error_msg',"Não foi encontrado guias para os parametros no periodo informado", err)
                res.redirect('/consultas/por_agencia')
            })
        }).catch((err)=>{
            req.flash('error_msg',"Erro interno ao carregar agencias"+err)
            res.redirect('/painel')
        })
    }
})

router.get('/por_cliente',lOgado,(req,res)=>{
    let next="disabled", prev="disabled"    
    res.render('consultasRelatorios/porCliente',{next, prev}) 
})

router.get('/por_cliente/pesquisar',lOgado,(req,res)=>{    
    var {cliente, offset, page} = req.query
    const limit = 20
    if(!offset){
        offset=0
    }
    if(offset<0){
        offset=0
    }
    else{
        offset = parseInt(offset)
    }
    if(!page){
        page = 1
    }
    if(page<1){
        page = 1
    }else{
        page = parseInt(page)
    }
    if(!cliente){
        req.flash('error_msg',"O campo de pesquisa não pode ser em branco")
        res.redirect("/consultas/por_cliente")
    }
    let query = {cliente: {$all: cliente}}
    GuiaCarga.find(query).limit(limit).skip(offset).sort({dateEntrada: 1}).then((dados)=>{
        var next, prev
        if(page == 1){
            prev = "disabled"
        }
        if(dados.length<limit){
            next = "disabled"
        }
        var nextUrl = {
            client: cliente,            
            ofst: offset+limit,
            pag: page+1, 
        }
        var prevUrl = {
            client: cliente,            
            ofst: offset+limit,
            pag: page+1,                    
        }
        
        if(dados.length < 1){
            req.flash('error_msg',"Não foi encontrado resultados")
            res.redirect('/consultas/por_cliente')
        }else{                                        
            var i=0
            while(i < dados.length){                   
                dados[i]["date_entrada"] = moment(dados[i].dateEntrada).format('DD/MM/YYYY')
                dados[i]["date_pagamento"] = moment(dados[i].datePagamento).format('DD/MM/YYYY')
                dados[i]["valor_exib"] = dados[i].valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                dados[i]["n"] = (i+1)+offset
                if(dados[i].baixa==true){
                    dados[i]["statusBaixa"] = "BAIXADO"
                }else{
                    dados[i]["statusBaixa"] = "PENDENTE"
                }
                i++                      
            }
            res.render('consultasRelatorios/porCliente',{dados, nextUrl,prevUrl,page,prev,next})
        }        
            
    }).catch((err)=>{
        req.flash('error_msg',"Erro interno na consulta: ", err)
        res.redirect('/consultas/por_agencia')
    })


})


module.exports = router