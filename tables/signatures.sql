-- if we update this file we need to RUN IT AGAIN to have any effect
-- psql -d petition -f tables/signatures.sql

DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- first_name VARCHAR(255) NOT NULL CHECK(first_name != ''),
    -- last_name VARCHAR(255) NOT NULL CHECK(last_name != ''),
    signature TEXT NOT NULL CHECK(signature != ''),
    user_id INTEGER NOT NULL REFERENCES users(id)
);
