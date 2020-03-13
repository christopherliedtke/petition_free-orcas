-- if we update this file we need to RUN IT AGAIN to have any effect

DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL CHECK(first_name != ''),
    last_name VARCHAR(255) NOT NULL CHECK(first_name != ''),
    signature TEXT NOT NULL CHECK(signature != '')

);