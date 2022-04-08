const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const post = sequelize.define("post",
  {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.BIGINT,
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING(150),
    },
    content: {
      type: DataTypes.STRING(255),
    },
  },
  {
    updatedAt: false,
    createdAt: "created_at",
  }
);

module.exports = post;
