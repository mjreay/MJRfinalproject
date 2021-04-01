DROP TABLE IF EXISTS highscores;


CREATE TABLE highscores (
    id            SERIAL PRIMARY KEY,
    first    VARCHAR(255) NOT NULL CHECK (first <> ''),
    score INTEGER,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);