const { Sequelize } = require("sequelize");
const db = new Sequelize("expresstest", "root", "", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = db;
