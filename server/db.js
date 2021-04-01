const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/gamedata"
);

module.exports.addHighScore = (first, score) => {
    const q = `
    INSERT INTO highscores (first, score)
    VALUES ($1, $2)
    RETURNING id
    `;
    const params = [first, score];
    return db.query(q, params);
};

module.exports.getHighScores = () => {
    const q = `
    SELECT first, score FROM highscores
    ORDER BY score DESC
    LIMIT 10`;
    return db.query(q);
};
