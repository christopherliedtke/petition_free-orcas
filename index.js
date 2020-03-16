// SET UP express
const express = require('express');
const app = express();
const PORT = 8080;
const secrets = require('./utils/secrets');

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
    if (req.session.user && (req.url === '/register' || req.url == '/login')) {
        console.log('-----> redirect to /register');
        res.redirect('/petition');
    } else if (!req.session.user && req.url != '/register' && req.url != '/login') {
        res.redirect('/register');
    } else {
        next();
    }
});

// Check if user has signed already
app.use((req, res, next) => {
    if (req.session.user && req.url === '/petition') {
        if (req.session.user.signatureId) {
            res.redirect('/petition/signed');
        } else {
            next();
        }
    } else {
        next();
    }
});

// #GET to /
// redirect to register
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
                req.session.user = {};
                req.session.user.id = result.rows[0].id;
                req.session.user.firstName = result.rows[0]['first_name'];
                req.session.user.lastName = result.rows[0]['last_name'];
                res.redirect('/petition');
            })
            .catch(err => {
                console.log('Error on POST /register: ', err);
                res.render('register', {
                    layout: 'main',
                    error: true,
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

            compare(passwordInput, hashedDbPw).then(boolean => {
                if (boolean) {
                    req.session.user = {};
                    req.session.user.id = result.rows[0].id;
                    req.session.user.firstName = result.rows[0]['first_name'];
                    req.session.user.lastName = result.rows[0]['last_name'];

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
            });
        })
        .catch(err => {
            console.log('Error on POST /login: ', err);
            res.render('login', {
                layout: 'main',
                error: true,
                title: 'My Petition'
            });
        });
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
            console.log('error in addSignature(): ', err);
            res.render('home', {
                layout: 'main',
                error: true,
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

// #GET to /petition/signers
app.get('/petition/signers', (req, res) => {
    console.log('-----> made it to GET /petition/signers');

    db.getSigners()
        .then(result => {
            const signers = result.rows;
            console.log('signers: ', signers);

            res.render('signatureOverview', {
                layout: 'main',
                title: 'My Petition',
                signers
            });
        })
        .catch(err => {
            console.log('err in getSignatures: ', err);
        });
});

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
