module.exports = {
    eAdmin: function (req, res, next) {
        if (req.isAuthenticated() && req.user.eAdmin == true) {
            return next();
        }
        req.flash('error_msg', "Somente administradores podem executar esta ação")
        res.redirect('/error')
    },
    lOgado: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', "Faça Login")
        res.redirect('/validation/login')
    },
    eControle: function (req, res, next) {
        if (req.isAuthenticated() && req.user.eControle == true || req.isAuthenticated() && req.user.eAdmin == true) {
            return next();
        }
        req.flash('error_msg', "Perfil não autorizado para executar esta ação")
        res.redirect('/error')
    },
    eDigitador: function (req, res, next) {
        if (req.isAuthenticated() && req.user.eControle == true || req.isAuthenticated() && req.user.eAdmin == true || req.isAuthenticated() && req.user.eDigitador == true) {
            return next();
        }
        req.flash('error_msg', "Perfil não autorizado para executar esta ação")
        res.redirect('/error')
    },
}

