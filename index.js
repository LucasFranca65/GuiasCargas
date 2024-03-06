//Carregando modulos utilizados
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const app = express()
const session = require('express-session')
const flash = require('connect-flash')
const passport = require('passport')
const moment = require('moment')
//Constantes Globais
const PORT = 1056
//Configuração de autenticação
require('./config/alth')(passport)
//Grupos de Rotas
const admin = require('./routes/rotasAdministrador')
const guias = require('./routes/rotasGruias')
const arrecadacao = require('./routes/rotasPrestacaoContas')
const validation = require('./routes/validation')
const painel = require('./routes/rotasPainel')
const consultas = require('./routes/rotasConsultas')
const users = require('./routes/rotasUsuarios')
const talao = require('./routes/rotasTaloes')
const comissao = require('./routes/rotasComissao')
const periodo = require('./routes/rotasPeriodos')
const ctes = require('./routes/rotasCtes')
const graficos = require('./routes/rotasGraficos')
const agencias = require('./routes/rotasAgente')

//Configurações

//Sessão
app.use(session({
    secret: "klfhjdsfhdsgfijhlikutrnignkf~lbmnkb5489456.1+d*g-*7dfg1*7sd",
    resave: true,
    saveUninitialized: true,
    cookie: {
        // Session expires after 2 horas of inactivity.
        expires: 7200000
    }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
//Midleware das sessões
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
})
//Mongoose
mongoose.set("strictQuery", true)
mongoose.Promise = global.Promise
mongoose.connect('mongodb://127.0.0.1:27017/ContreleAgencias').then(() => {
    //mongoose.connect('mongodb://127.0.0.1:27017/ContreleAgenciasProducao').then(() => {
    console.log("Conectado ao banco de dados com sucesso")
}).catch((err) => {
    console.log("Erro ao se conectar com o bonco" + err)
})
//BodyParser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
/*const log = fs.createWriteStream(
    path.join(__dirname,'./config/logs',"dgcargas${moment().format('DD-MM-YYY')}.log"), {flags: "a"}
)
morganBody(app,{
    noColors: true,
    stream: log
})*/

//Handlebars      
app.engine('handlebars', handlebars.engine({
    defaultLayout: 'main', runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}))
app.set('view engine', 'handlebars')

//Public Arquivos estaticos
app.use(express.static(path.join(__dirname, 'public')))

//Rotas
app.use('/administracao', admin)
app.use('/guias', guias)
app.use('/validation', validation)
app.use('/painel', painel)
app.use('/consultas', consultas)
app.use('/user', users)
app.use('/talao', talao)
app.use('/comissao', comissao)
app.use('/periodos', periodo)
app.use('/arrecadacao', arrecadacao)
app.use('/ctes', ctes)
app.use('/graficos', graficos)
app.use('/agencias', agencias)

app.get('/error', (req, res) => {
    res.render('404')
})
app.get('/', (req, res) => {
    res.redirect('/validation')
})
app.use((req, res, next) => {
    req.flash('error_msg', "Algo deu errado, Pagina não encontrada")
    res.redirect('/error')
})

//Outros
app.listen(PORT, (error) => {
    if (error) {
        console.log("Erro ao iniciar Servidor")
    } else {
        console.log("serviço Rodando na porta " + PORT)
    }
})