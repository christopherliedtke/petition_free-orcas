// SET UP express
const express = require('express');
const app = express();
const PORT = 8080;
const secrets = require('./utils/secrets');

const errorMsg = 'OOOOps there has been an error. Please try again!';

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
        secret: secrets.cookieSession.secret,
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

// Check if user is logged in
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.loggedIn = true;
        next();
    } else {
        next();
    }
});

// Redirect user in case they are logged in/out
app.use((req, res, next) => {
    if (req.session.user && (req.url === '/register' || req.url == '/login')) {
        console.log('-----> redirect to /petition');
        res.redirect('/petition');
    } else if (!req.session.user && req.url != '/register' && req.url != '/login') {
        console.log('-----> redirect to /register');
        res.redirect('/register');
    } else {
        next();
    }
});

// Check if user has signed already
app.use((req, res, next) => {
    if (req.session.user && req.session.user.signatureId && req.url === '/petition') {
        console.log('-----> redirect to /petition/signed');
        res.redirect('/petition/signed');
    } else {
        next();
    }
});

// #GET to /
app.get('/', (req, res) => {
    console.log('-----> made it to GET /');
    console.log('-----> redirect to /register');
    res.redirect('/register');
});

// #GET to /register
app.get('/register', (req, res) => {
    console.log('-----> made it to GET /register');
    res.render('register', {
        layout: 'main',
        title: 'My Petition'
    });
});

// #POST to /register
app.post('/register', (req, res) => {
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
                    layout: 'main',
                    error: errorMsg,
                    title: 'My Petition'
                });
            });
    });
});

// #GET to /login
app.get('/login', (req, res) => {
    console.log('-----> made it to GET /login');
    res.render('login', {
        layout: 'main',
        title: 'My Petition'
    });
});

// #POST to /login
app.post('/login', (req, res) => {
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
                        layout: 'main',
                        error: 'Ooops! Email and password do not match. Try again, please.',
                        title: 'My Petition'
                    });
                });
        })
        .catch(err => {
            console.log('Error on POST /login: ', err);
            res.render('login', {
                layout: 'main',
                error: 'User does not exist!',
                title: 'My Petition'
            });
        });
});

// #GET to /userprofile
app.get('/userprofile', (req, res) => {
    console.log('-----> made it to GET /userprofile');
    res.render('userprofile', {
        layout: 'main',
        title: 'My Petition'
    });
});

// #POST to /userprofile
app.post('/userprofile', (req, res) => {
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
app.get('/userprofile/edit', (req, res) => {
    console.log('-----> made it to GET /userprofile/edit');

    db.getUser(req.session.user.email)
        .then(result => {
            res.render('userprofileEdit', {
                layout: 'main',
                title: 'My Petition',
                user: result.rows[0]
            });
        })
        .catch(err => {
            console.log('Error on getUser() on /userprofile/edit: ', err);
        });
});

// #POST to /userprofile/edit
app.post('/userprofile/edit', (req, res) => {
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
                            layout: 'main',
                            error: errorMsg,
                            title: 'My Petition',
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
                                    layout: 'main',
                                    error: errorMsg,
                                    title: 'My Petition',
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
                            layout: 'main',
                            error: errorMsg,
                            title: 'My Petition',
                            user: result.rows[0]
                        });
                    })
                    .catch(err => {
                        console.log('Error on getUser() on /userprofile/edit: ', err);
                    });
            });
    }
});

// #GET to /petition
app.get('/petition', (req, res) => {
    console.log('-----> made it to GET /petition');
    res.render('home', {
        layout: 'main',
        title: 'My Petition'
    });
});

// #POST to /petition
app.post('/petition', (req, res) => {
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
            res.render('home', {
                layout: 'main',
                error: errorMsg,
                title: 'My Petition'
            });
        });
});

// #GET to /petition/signed
app.get('/petition/signed', (req, res) => {
    console.log('-----> made it to the GET /petition/signed');

    db.getSignaturesCount()
        .then(count => {
            db.getSignature(req.session.user.signatureId)
                .then(result => {
                    res.render('thank', {
                        layout: 'main',
                        signData: result.rows[0].signature,
                        count: count.rows[0].count,
                        title: 'My Petition'
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
app.post('/petition/signed', (req, res) => {
    console.log('-----> made it to the POST /petition/signed');
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
app.get('/petition/signers', (req, res) => {
    console.log('-----> made it to GET /petition/signers');

    db.getSigners()
        .then(result => {
            const signers = result.rows;

            res.render('signatureOverview', {
                layout: 'main',
                title: 'My Petition',
                signers
            });
        })
        .catch(err => {
            console.log('err on getSigners() on /petition/signers: ', err);
        });
});

// #GET to /petition/signers/:city
app.get('/petition/signers/:city', (req, res) => {
    console.log('-----> made it to GET /petition/signers:city');

    const city = req.params.city;

    db.getSigners()
        .then(result => {
            const signers = result.rows;

            res.render('signatureOverviewCity', {
                layout: 'main',
                title: 'My Petition',
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

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
