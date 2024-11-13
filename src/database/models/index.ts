'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require("../config/config")[env];
const db: { [key: string]: any; } = {};

db.sequelize = new Sequelize(config.database, config.username, config.password, config);

(async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

export default db;
