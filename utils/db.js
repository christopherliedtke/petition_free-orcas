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
        SELECT users.first_name, users.last_name, profiles.age, profiles.city, profiles.homepage
        FROM users
        LEFT JOIN profiles
        ON users.id = profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        `;

    return db.query(q);
};

module.exports.getSignatureId = userId => {
    const q = `
        SELECT id
        FROM signatures
        WHERE user_id=$1
    `;
    const params = [userId];

    return db.query(q, params);
};

module.exports.getSignature = signatureId => {
    const q = `
        SELECT signature
        FROM signatures
        WHERE id=$1
    `;
    const params = [signatureId];

    return db.query(q, params);
};

module.exports.getSignaturesCount = () => {
    const q = `
        SELECT COUNT(*)
        FROM signatures
    `;

    return db.query(q);
};

module.exports.deleteSignature = userId => {
    const q = `
        DELETE
        FROM signatures
        WHERE user_id=$1
    `;
    const params = [userId];

    return db.query(q, params);
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
        SELECT users.id, users.first_name, users.last_name, users.email, users.password, profiles.age, profiles.city, profiles.homepage
        FROM users
        LEFT JOIN profiles
        ON users.id=profiles.user_id
        WHERE email = $1
    `;
    const params = [email];

    return db.query(q, params);
};

module.exports.updateUserInclPassword = (firstName, lastName, email, password, userId) => {
    const q = `
        UPDATE users
        SET first_name=$1, last_name=$2, email=$3, password=$4
        WHERE id=$5
    `;
    const params = [firstName, lastName, email, password, userId];

    return db.query(q, params);
};

module.exports.updateUserExclPassword = (firstName, lastName, email, userId) => {
    const q = `
        UPDATE users
        SET first_name=$1, last_name=$2, email=$3
        WHERE id=$4
    `;
    const params = [firstName, lastName, email, userId];

    return db.query(q, params);
};

// #PROFILES
module.exports.addProfile = (age, city, homepage, userId) => {
    const q = `
        INSERT INTO profiles (age, city, homepage, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const params = [age, city, homepage, userId];

    return db.query(q, params);
};

module.exports.updateProfile = (age, city, homepage, userId) => {
    const q = `
        INSERT INTO profiles (age, city, homepage, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age=$1, city=$2, homepage=$3
        RETURNING *
    `;
    const params = [age, city, homepage, userId];

    return db.query(q, params);
};
