module.exports.requireLoggedInUser = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/register');
    } else {
        next();
    }
};

module.exports.requireLoggedOutUser = (req, res, next) => {
    if (req.session.user && req.session.user.id) {
        res.redirect('/petition');
    } else {
        next();
    }
};

module.exports.requireSignature = (req, res, next) => {
    if (!req.session.user.signatureId) {
        res.redirect('/petition');
    } else {
        next();
    }
};

module.exports.requireNoSignature = (req, res, next) => {
    if (req.session.user.signatureId) {
        res.redirect('/petition/signed');
    } else {
        next();
    }
};
