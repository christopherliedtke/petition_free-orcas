// SET UP express
const express = require('express');
const app = express();
module.exports = app;
const PORT = process.env.PORT || 8080;
// const secrets = require('./utils/secrets');

const errorMsg = 'OOOOps there has been an error. Please try again!';

// Require route middleware
const { requireLoggedInUser, requireLoggedOutUser, requireSignature, requireNoSignature } = require('./utils/middleware');

// SET UP express handlebars
const hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

// SET UP database
const db = require('./utils/db');

// SET UP bcrypt
const { hash, compare } = require('./utils/bcrypt');

// SET url for static serving of files
app.use(express.static('./public'));

// PARSE request body
app.use(
    express.urlencoded({
        extended: false
    })
);

// REQUIRE & USE cookie session
const cookieSession = require('cookie-session');
app.use(
    cookieSession({
        secret: "I'm always angry.",
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

// SET UP csruf (has to be after cookie session and urlencoded)
const csurf = require('csurf');
app.use(csurf());

app.use((req, res, next) => {
    // DENY frames to prevent clickjacking
    res.set('x-frame-options', 'DENY');
    // res.locals is merged with object from res.render() on every res.render() && req.csrfToken()-method pulls token from req object
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Check if user is logged in && has signed
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.loggedIn = true;
        if (req.session.user.signatureId) {
            res.locals.signed = true;
        }
    }
    next();
});

// Check if user has signed in
// app.use((req, res, next) => {
//     if (req.session.user && req.session.user.signatureId) {
//         res.locals.signed = true;
//         next();
//     } else {
//         next();
//     }
// });

// #GET to /
app.get('/', (req, res) => {
    console.log('-----> made it to GET /');
    res.render('home');
});

// #GET to /register
app.get('/register', requireLoggedOutUser, (req, res) => {
    console.log('-----> made it to GET /register');
    res.render('register');
});

// #POST to /register
app.post('/register', requireLoggedOutUser, (req, res) => {
    console.log('-----> made it to POST /register');

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

                console.log('-----> redirect to /userprofile');
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

// #GET to /login
app.get('/login', requireLoggedOutUser, (req, res) => {
    console.log('-----> made it to GET /login');
    res.render('login');
});

// #POST to /login
app.post('/login', requireLoggedOutUser, (req, res) => {
    console.log('-----> made it to POST /login');

    // compare login data to db entries
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
                                console.log('-----> redirect to /petition/signed');
                                res.redirect('/petition/signed');
                            })
                            .catch(err => {
                                console.log('Error in getSignatureId() on login: ', err);
                                console.log('-----> redirect to /petition');
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

// #GET to /userprofile
app.get('/userprofile', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to GET /userprofile');
    res.render('userprofile');
});

// #POST to /userprofile
app.post('/userprofile', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to POST /userprofile');

    const age = req.body.age || null;
    const city = req.body.city || null;
    const homepage = req.body.homepage || null;
    const id = req.session.user.id;

    db.addProfile(age, city, homepage, id)
        .then(() => {
            console.log('-----> redirect to /petition');
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('Error on addProfile() on /userprofile: ', err);
        });
});

// #GET to /userprofile/edit
app.get('/userprofile/edit', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to GET /userprofile/edit');

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

// #POST to /userprofile/edit
app.post('/userprofile/edit', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to POST /userprofile/edit');

    const newFirstName = req.body['first-name'];
    const newLastName = req.body['last-name'];
    const newEmail = req.body['email'];
    const newPassword = req.body['password'] || null;
    const newAge = req.body['age'] || null;
    const newCity = req.body['city'] || null;
    const newHomepage = req.body['homepage'] || null;
    const userId = req.session.user.id;

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

// #GET to /userprofile/delete
app.get('/userprofile/delete', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to GET /userprofile/delete');
    res.render('userprofileDelete');
});

// #POST to /userprofile/delete
app.post('/userprofile/delete', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to POST /userprofile/delete');

    const userId = req.session.user.id;

    Promise.all([db.deleteSignature(userId), db.deleteProfile(userId), db.deleteUser(userId)])
        .then(() => {
            // delete cookie and redirect
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

// #GET to /petition
app.get('/petition', requireLoggedInUser, requireNoSignature, (req, res) => {
    console.log('-----> made it to GET /petition');
    res.render('petition');
});

// #POST to /petition
app.post('/petition', requireLoggedInUser, requireNoSignature, (req, res) => {
    console.log('-----> made it to the POST /petition');

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

// #GET to /petition/signed
app.get('/petition/signed', requireLoggedInUser, requireSignature, (req, res) => {
    console.log('-----> made it to GET /petition/signed');

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
                    console.log('Error on getSignature on /petition/signed: ', err);
                });
        })
        .catch(err => {
            console.log('err: ', err);
        });
});

// #POST to /petition/signed
app.post('/petition/signed', requireLoggedInUser, requireSignature, (req, res) => {
    console.log('-----> made it to POST /petition/signed');
    delete req.session.user.signatureId;

    db.deleteSignature(req.session.user.id)
        .then(() => {
            console.log('Signature deleted');
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('Error on deleteSignature() on /petition/signed: ', err);
        });
});

// #GET to /petition/signers
app.get('/petition/signers', requireLoggedInUser, requireSignature, (req, res) => {
    console.log('-----> made it to GET /petition/signers');

    db.getSigners()
        .then(result => {
            const signers = result.rows;

            res.render('signatureOverview', {
                signers
            });
        })
        .catch(err => {
            console.log('err on getSigners() on /petition/signers: ', err);
        });
});

// #GET to /petition/signers/:city
app.get('/petition/signers/:city', requireLoggedInUser, requireSignature, (req, res) => {
    console.log('-----> made it to GET /petition/signers:city');

    const city = req.params.city;

    db.getSigners()
        .then(result => {
            const signers = result.rows;

            res.render('signatureOverviewCity', {
                city,
                signers,
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

// #GET to /logout
app.get('/logout', requireLoggedInUser, (req, res) => {
    console.log('-----> made it to GET /logout');

    delete req.session.user;
    res.redirect('/');
});

// Only listen if app is started by the main module (index.js) -> NOT FOR SUPERTEST
if (require.main == module) {
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`);
    });
}
