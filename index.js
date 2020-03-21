const express = require('express');
const app = express();
module.exports.app = app;

const PORT = process.env.PORT || 8080;

const { requireLoggedInUser, requireLoggedOutUser, requireSignature, requireNoSignature } = require('./utils/middleware');

const hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

const db = require('./utils/db');

const { hash, compare } = require('./utils/bcrypt');

const errorMsg = 'OOOOps there has been an error. Please try again!';

app.use(express.static('./public'));

app.use(
    express.urlencoded({
        extended: false
    })
);

const cookieSession = require('cookie-session');
app.use(
    cookieSession({
        secret: "I'm always angry.",
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

const csurf = require('csurf');
app.use(csurf());

app.use((req, res, next) => {
    res.set('x-frame-options', 'DENY');
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.loggedIn = true;
        if (req.session.user.signatureId) {
            res.locals.signed = true;
        }
    }
    next();
});

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/register', requireLoggedOutUser, (req, res) => {
    res.render('register');
});

app.post('/register', requireLoggedOutUser, (req, res) => {
    const firstName = req.body['first-name'];
    const lastName = req.body['last-name'];
    const email = req.body['email'];
    const password = req.body['password'];

    hash(password).then(hashedPw => {
        db.addUser(firstName, lastName, email, hashedPw)
            .then(result => {
                req.session.user = {
                    id: result.rows[0].id,
                    firstName: result.rows[0]['first_name'],
                    lastName: result.rows[0]['last_name'],
                    email: email
                };

                res.redirect('/userprofile');
            })
            .catch(err => {
                console.log('Error on POST /register: ', err);
                res.render('register', {
                    error: errorMsg
                });
            });
    });
});

app.get('/login', requireLoggedOutUser, (req, res) => {
    res.render('login');
});

app.post('/login', requireLoggedOutUser, (req, res) => {
    const email = req.body['email'];
    const passwordInput = req.body['password'];

    db.getUser(email)
        .then(result => {
            const hashedDbPw = result.rows[0].password;

            compare(passwordInput, hashedDbPw)
                .then(comparisonResult => {
                    if (comparisonResult) {
                        req.session.user = {
                            id: result.rows[0].id,
                            firstName: result.rows[0]['first_name'],
                            lastName: result.rows[0]['last_name'],
                            email: email
                        };

                        db.getSignatureId(req.session.user.id)
                            .then(result => {
                                req.session.user.signatureId = result.rows[0].id;
                                res.redirect('/petition/signed');
                            })
                            .catch(err => {
                                console.log('Error in getSignatureId() on login: ', err);
                                res.redirect('/petition');
                            });
                    } else {
                        throw new Error('Password does not fit to email.');
                    }
                })
                .catch(err => {
                    console.log('Error on compare() on /login: ', err);
                    res.render('login', {
                        error: 'Ooops! Email and password do not match. Try again, please.'
                    });
                });
        })
        .catch(err => {
            console.log('Error on POST /login: ', err);
            res.render('login', {
                error: 'User does not exist!'
            });
        });
});

app.get('/userprofile', requireLoggedInUser, (req, res) => {
    res.render('userprofile');
});

app.post('/userprofile', requireLoggedInUser, (req, res) => {
    const age = req.body.age || null;
    const city = req.body.city || null;
    let homepage = req.body.homepage;
    const id = req.session.user.id;

    if (!homepage.startsWith('http')) {
        homepage = null;
    }

    db.addProfile(age, city, homepage, id)
        .then(() => {
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('Error on addProfile() on /userprofile: ', err);
            res.render('userprofileEdit', {
                error: errorMsg
            });
        });
});

app.get('/userprofile/edit', requireLoggedInUser, (req, res) => {
    db.getUser(req.session.user.email)
        .then(result => {
            res.render('userprofileEdit', {
                user: result.rows[0]
            });
        })
        .catch(err => {
            console.log('Error on getUser() on /userprofile/edit: ', err);
        });
});

app.post('/userprofile/edit', requireLoggedInUser, (req, res) => {
    const newFirstName = req.body['first-name'];
    const newLastName = req.body['last-name'];
    const newEmail = req.body['email'];
    const newPassword = req.body['password'] || null;
    const newAge = req.body['age'] || null;
    const newCity = req.body['city'] || null;
    let newHomepage = req.body['homepage'];
    const userId = req.session.user.id;

    if (!newHomepage.startsWith('http')) {
        newHomepage = null;
    }

    if (newPassword === null) {
        Promise.all([db.updateUserExclPassword(newFirstName, newLastName, newEmail, userId), db.updateProfile(newAge, newCity, newHomepage, userId)])
            .then(() => {
                res.redirect('/petition');
            })
            .catch(err => {
                console.log('Error on Promise.all() on /userprofile/edit: ', err);

                db.getUser(req.session.user.email)
                    .then(result => {
                        res.render('userprofileEdit', {
                            error: errorMsg,
                            user: result.rows[0]
                        });
                    })
                    .catch(err => {
                        console.log('Error on getUser() on /userprofile/edit: ', err);
                    });
            });
    } else {
        hash(newPassword)
            .then(hashedNewPassword => {
                Promise.all([db.updateUserInclPassword(newFirstName, newLastName, newEmail, hashedNewPassword, userId), db.updateProfile(newAge, newCity, newHomepage, userId)])
                    .then(() => {
                        res.redirect('/petition');
                    })
                    .catch(err => {
                        console.log('Error on Promise.all() on /userprofile/edit: ', err);

                        db.getUser(req.session.user.email)
                            .then(result => {
                                res.render('userprofileEdit', {
                                    error: errorMsg,
                                    user: result.rows[0]
                                });
                            })
                            .catch(err => {
                                console.log('Error on getUser() on /userprofile/edit: ', err);
                            });
                    });
            })
            .catch(err => {
                console.log('Error on hash() on /userprofile/edit: ', err);

                db.getUser(req.session.user.email)
                    .then(result => {
                        res.render('userprofileEdit', {
                            error: errorMsg,
                            user: result.rows[0]
                        });
                    })
                    .catch(err => {
                        console.log('Error on getUser() on /userprofile/edit: ', err);
                    });
            });
    }
});

app.get('/userprofile/delete', requireLoggedInUser, (req, res) => {
    res.render('userprofileDelete');
});

app.post('/userprofile/delete', requireLoggedInUser, (req, res) => {
    const userId = req.session.user.id;

    Promise.all([db.deleteSignature(userId), db.deleteProfile(userId), db.deleteUser(userId)])
        .then(() => {
            delete req.session.user;
            res.redirect('/');
        })
        .catch(err => {
            console.log('Error on Promise.all() on /userprofile/delete: ', err);

            res.render('userprofileDelete', {
                error: errorMsg
            });
        });
});

app.get('/petition', requireLoggedInUser, requireNoSignature, (req, res) => {
    res.render('petition');
});

app.post('/petition', requireLoggedInUser, requireNoSignature, (req, res) => {
    const signature = req.body['signature-data'];
    const userId = req.session.user.id;

    db.addSignature(signature, userId)
        .then(result => {
            req.session.user.signatureId = result.rows[0].id;
            res.redirect('/petition/signed');
        })
        .catch(err => {
            console.log('error on addSignature() on /petition: ', err);
            res.render('petition', {
                error: errorMsg
            });
        });
});

app.get('/petition/signed', requireLoggedInUser, requireSignature, (req, res) => {
    db.getSignaturesCount()
        .then(count => {
            db.getSignature(req.session.user.signatureId)
                .then(result => {
                    res.render('thank', {
                        signData: result.rows[0].signature,
                        count: count.rows[0].count
                    });
                })
                .catch(err => {
                    console.log('Error on getSignature() on /petition/signed: ', err);
                });
        })
        .catch(err => {
            console.log('Error on getSignatureCount() on /petition/signed: ', err);
        });
});

app.post('/petition/signed', requireLoggedInUser, requireSignature, (req, res) => {
    delete req.session.user.signatureId;

    db.deleteSignature(req.session.user.id)
        .then(() => {
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('Error on deleteSignature() on /petition/signed: ', err);
        });
});

app.get('/petition/signers', requireLoggedInUser, requireSignature, (req, res) => {
    db.getSignaturesCount()
        .then(count => {
            db.getSigners()
                .then(result => {
                    res.render('signatureOverview', {
                        signers: result.rows,
                        count: count.rows[0].count
                    });
                })
                .catch(err => {
                    console.log('err on getSigners() on /petition/signers: ', err);
                });
        })
        .catch(err => {
            console.log('Error on getSignatureCount() on /petition/signers: ', err);
        });
});

app.get('/petition/signers/:city', requireLoggedInUser, requireSignature, (req, res) => {
    const city = req.params.city;

    db.getSigners()
        .then(result => {
            res.render('signatureOverviewCity', {
                city,
                signers: result.rows,
                helpers: {
                    checkCity(arg) {
                        if (arg != null) {
                            return city.toLowerCase() == arg.toLowerCase();
                        } else {
                            return false;
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.log('err on getSigners() on /petition/signers/:city: ', err);
        });
});

app.get('/logout', requireLoggedInUser, (req, res) => {
    req.session = null;
    res.redirect('/');
});

if (require.main == module) {
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`);
    });
}
