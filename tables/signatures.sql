DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature TEXT NOT NULL CHECK(signature != ''),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id)
);
