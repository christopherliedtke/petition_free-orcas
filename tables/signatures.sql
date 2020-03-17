-- if we update this file we need to RUN IT AGAIN to have any effect
-- psql -d petition -f tables/signatures.sql

DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature TEXT NOT NULL CHECK(signature != ''),
    user_id INTEGER NOT NULL REFERENCES users(id)
);
