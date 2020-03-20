DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;


CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      first_name VARCHAR(255) NOT NULL CHECK(first_name != ''),
      last_name VARCHAR(255) NOT NULL CHECK(last_name != ''),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
 );