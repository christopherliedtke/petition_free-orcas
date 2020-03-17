-- psql -d petition -f tables/profiles.sql

DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    age INTEGER,
    city VARCHAR(50),
    homepage VARCHAR(80),
    user_id INTEGER NOT NULL REFERENCES users(id)
);