const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/gamedata"
);

module.exports.addHighScore = (first, score, socket_id) => {
    const q = `
    INSERT INTO highscores (first, score, socket_id)
    VALUES ($1, $2, $3)
    RETURNING id
    `;
    const params = [first, score, socket_id];
    return db.query(q, params);
};

module.exports.getHighScores = () => {
    const q = `
    SELECT first, score, socket_id FROM highscores
    ORDER BY score DESC
    LIMIT 10
    `;
    return db.query(q);
};
