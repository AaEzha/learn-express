const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const user = sequelize.define("user", {
  id: {
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  content: {
    type: DataTypes.STRING(255),
  },
}, {
  tableName: 'user',
  createdAt: 'created_at'
}
);



module.exports = user;
