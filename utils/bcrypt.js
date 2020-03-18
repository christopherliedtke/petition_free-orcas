const bcrypt = require('bcryptjs');
let { genSalt, hash, compare } = bcrypt;

const { promisify } = require('util');

// PROMISIFY methods
genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;
module.exports.hash = plainTextPw => genSalt().then(salt => hash(plainTextPw, salt));

// // hash(null) test
// hash(null)
//     .then(result => {
//         console.log('result: ', result);
//     })
//     .catch(err => console.log('error: ', err));

// DEMO FOR CLASS
// genSalt()
//     .then(salt => {
//         console.log('salt: ', salt);
//         return hash('password', salt);
//     })
//     .then(hashedPasswordWithSalt => {
//         console.log('hashedPasswordWithSalt: ', hashedPasswordWithSalt);
//         return compare('password', hashedPasswordWithSalt);
//     })
//     .then(matchedValueOfCompare => {
//         console.log('matchedValueOfCompare: ', matchedValueOfCompare);
//     });
