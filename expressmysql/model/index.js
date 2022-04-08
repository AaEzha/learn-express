const mysql = require("mysql");
require("dotenv/config");
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  err
    ? console.log(err.message)
    : console.log("DB status: " + connection.state);
});

const instance = null;

class DBService {
  static getDBServiceInstance() {
    return instance ? instance : new DBService();
  }

  // async getAllData() {
  //   try {
  //     const res = await new Promise((resolve, reject) => {
  //       const query = "SELECT * FROM user";

  //       connection.query(query, (err, res) => {
  //         //  If err, reject promise
  //         if (err) reject(new Error(err.message));

  //         //  If success
  //         resolve(res);
  //       });
  //     });

  //     console.log(res);
  //     return res;
      
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  async getAllData() {
    try {
      const query = "SELECT * FROM user";

      const data = await connection.query(query, (err, res) => {
        if(err) throw err;
        console.log(res);
        return res;
      })

      return data

    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = DBService;
