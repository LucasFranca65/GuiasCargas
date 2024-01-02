module.exports = {
    eAdmin: function (req, res, next) {
        if (req.isAuthenticated() && req.user.eAdmin == true) {
            return next();
        }
        req.flash('error_msg', "Somente administradores podem executar esta ação")
        res.redirect('/painel')
    },
    lOgado: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', "Faça Login")
        res.redirect('/validation/login')
    }
}

