const spicedPg = require('spiced-pg');
const db = spicedPg('postgres:postgres:postgres@localhost:5432/petition');

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
