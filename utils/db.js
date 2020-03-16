const spicedPg = require('spiced-pg');
const secrets = require('./secrets');
const db = spicedPg(`postgres:${secrets.database.user}:${secrets.database.pw}@localhost:5432/${secrets.database.name}`);

// #SIGNATURES
module.exports.addSignature = (signature, userId) => {
    const q = `
        INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING *
    `;
    const params = [signature, userId];

    return db.query(q, params);
};

module.exports.getSigners = () => {
    const q = `
        SELECT users.first_name AS first_name, users.last_name AS last_name
        FROM users
        JOIN signatures
        ON users.id = signatures.user_id;


        `;
    // SELECT id
    // FROM signatures

    return db.query(q);
};

module.exports.getSignatureId = userId => {
    const q = `
        SELECT id
        FROM signatures
        WHERE user_id=${userId}
    `;

    return db.query(q);
};

module.exports.getSignature = signatureId => {
    const q = `
        SELECT signature
        FROM signatures
        WHERE id=${signatureId}
    `;

    return db.query(q);
};

module.exports.getSignaturesCount = () => {
    const q = `
        SELECT COUNT(*)
        FROM signatures
    `;

    return db.query(q);
};

// #USERS
module.exports.addUser = (firstName, lastName, email, password) => {
    const q = `
        INSERT INTO users (first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const params = [firstName, lastName, email, password];

    return db.query(q, params);
};

module.exports.getUser = email => {
    const q = `
        SELECT *
        FROM users
        WHERE email = '${email}'
    `;

    return db.query(q);
};
