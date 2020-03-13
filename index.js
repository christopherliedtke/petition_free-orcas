// SET UP express
const express = require('express');
const app = express();
const PORT = 8080;

// SET UP express handlebars
const hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

const db = require('./db');

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
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

// Check for cookie and redirect
app.use((req, res, next) => {
    if (req.session.signatureId && req.url === '/petition') {
        console.log('redirect to /petition/signed');
        res.redirect('/petition/signed');
    } else if (!req.session.signatureId && req.url === '/petition/signed') {
        console.log('redirect to /petition');
        res.redirect('/petition');
    } else {
        next();
    }
});

// #GET to /petition
app.get('/petition', (req, res) => {
    console.log('made it to GET /petition route');
    res.render('home', {
        layout: 'main',
        title: 'My Petition'
    });
});

// #POST to /petition
app.post('/petition', (req, res) => {
    console.log('made it to the POST /petition route');

    const firstName = req.body['first-name'];
    const lastName = req.body['last-name'];
    const signature = req.body['signature-data'];

    db.addSignature(firstName, lastName, signature)
        .then(result => {
            console.log('result.rows from addSignatures: ', result.rows);
            // SET cookie with row id of database entry
            req.session.signatureId = result.rows[0].id;
            // res.cookie('signed', true);
            res.redirect('/petition/signed');
        })
        .catch(err => {
            console.log('error in addSignatures(): ', err);
            res.render('home', {
                layout: 'main',
                error: true,
                title: 'My Petition'
            });
        });
});

// #GET to /petition/signed
app.get('/petition/signed', (req, res) => {
    console.log('made it to the GET /petition/signed route');

    db.getSignature(req.session.signatureId)
        .then(result => {
            // console.log('result.rows[0].signature: ', result.rows[0].signature);
            res.render('thank', {
                layout: 'main',
                signData: result.rows[0].signature,
                title: 'My Petition'
            });
        })
        .catch(err => {
            console.log('err: ', err);
        });
});

// #GET to /petition/signers
app.get('/petition/signers', (req, res) => {
    console.log('made it to GET /petition/signers route');

    db.getSignatures()
        .then(result => {
            // console.log('result.rows from getSignatures: ', result.rows);
            const signatures = result.rows;
            res.render('signatureOverview', {
                layout: 'main',
                title: 'My Petition',
                signatures
            });
        })
        .catch(err => {
            console.log('err in getSignatures: ', err);
        });
});

app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
