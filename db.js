const spicedPg = require('spiced-pg');
const secrets = require('./secrets');
const db = spicedPg(`postgres:${secrets.database.user}:${secrets.database.pw}@localhost:5432/${secrets.database.name}`);

module.exports.addSignature = (firstName, lastName, signature) => {
    const q = `
        INSERT INTO signatures (first_name, last_name, signature)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const params = [firstName, lastName, signature];

    return db.query(q, params);
};

module.exports.getSignatures = () => {
    const q = `
        SELECT first_name, last_name
        FROM signatures
    `;

    return db.query(q);
};

module.exports.getSignature = id => {
    const q = `
        SELECT signature
        FROM signatures
        WHERE id=${id}
    `;

    return db.query(q);
};

module.exports.getSignaturesCount = () => {
    const q = `
        SELECT COUNT *
        FROM signatures
    `;

    return db.query(q);
};
