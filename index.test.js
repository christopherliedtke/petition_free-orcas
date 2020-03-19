const supertest = require('supertest');
const app = require('./index');
const cookieSession = require('cookie-session');
const db = require('./utils/db');

jest.mock('./utils/db.js');

// TEST1
test('Users who are logged out are redirected to /register page when they attempt to go to /petition', () => {
    return supertest(app)
        .get('/petition')
        .then(res => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('/register');
        });
});

// TEST2
test('Users who are logged in are redirected to /petition page when they attempt to go to /register', () => {
    cookieSession.mockSessionOnce({
        user: {
            id: 1
        }
    });
    return supertest(app)
        .get('/register')
        .then(res => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('/petition');
        });
});

// TEST3
test('Users who are logged in and have signed the petition are redirected to /petition/signed page when they attempt to go to /petition or submit a signature', () => {
    cookieSession.mockSession({
        user: {
            id: 1,
            signatureId: 1
        }
    });
    return Promise.all([
        supertest(app)
            .get('/petition')
            .then(res => {
                expect(res.statusCode).toBe(302);
                expect(res.headers.location).toBe('/petition/signed');
            }),
        supertest(app)
            .post('/petition')
            .then(res => {
                expect(res.statusCode).toBe(302);
                expect(res.headers.location).toBe('/petition/signed');
            })
    ]);
});

// TEST4
test('Users who are logged in and have NOT signed the petition are redirected to /petition when they attempt to go to /petition/signed or /petition/signers', () => {
    cookieSession.mockSession({
        user: {
            id: 1
        }
    });
    return Promise.all([
        supertest(app)
            .get('/petition/signed')
            .then(res => {
                expect(res.statusCode).toBe(302);
                expect(res.headers.location).toBe('/petition');
            }),
        supertest(app)
            .get('/petition/signers')
            .then(res => {
                expect(res.statusCode).toBe(302);
                expect(res.headers.location).toBe('/petition');
            })
    ]);
});

// BONUS1
test('Users who sign successfully on /petition are redirected to /petition/signed', () => {
    cookieSession.mockSessionOnce({
        user: {
            id: 1
        }
    });
    db.addSignature.mockResolvedValue({
        rows: [
            {
                id: 1
            }
        ]
    });
    return supertest(app)
        .post('/petition')
        .send('signature-data=qwertz1234')
        .then(res => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe('/petition/signed');
        });
});

// BONUS2
test.only('Users who do not sign successfully on /petition are shown an error message', () => {
    cookieSession.mockSessionOnce({
        user: {
            id: 1
        }
    });
    db.addSignature.mockResolvedValue({});
    return supertest(app)
        .post('/petition')
        .send('signature-data=qwertz1234')
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('OOOOps there has been an error. Please try again!');
        });
});
