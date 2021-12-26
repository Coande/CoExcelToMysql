const mysql = require("mysql2/promise");

const getDbConnection = async (dbInfo) => {
    // 默认参数
    const targetDbInfo = {
      host: "localhost",
      port: "3306",
      user: "root",
      password: "123456",
      database: "test",
      table: "t_excel",
    };
    // 传入参数覆盖默认参数
    Object.assign(targetDbInfo, dbInfo);
    // 获取数据库连接
    const connection = await mysql.createConnection({
      host: targetDbInfo.host,
      port: targetDbInfo.port,
      user: targetDbInfo.user,
      password: targetDbInfo.password,
      database: targetDbInfo.database,
    });

    await connection.beginTransaction();
    return connection;
  };

module.exports = {
  getColInfo: async (dbInfo) => {
    // 获取数据库连接
    const connection = await getDbConnection(dbInfo);

    // 查询表结构
    const sql =
      "select COLUMN_NAME,COLUMN_TYPE,COLUMN_COMMENT from information_schema.`COLUMNS` where TABLE_SCHEMA = ? and TABLE_NAME = ?";
    const queryRes = await connection.execute(sql, [
      dbInfo.database,
      dbInfo.table,
    ]);

    if (queryRes[0].length == 0) {
      throw "数据库或表不存在";
    }
    return queryRes[0];
  },
  /**
   * 获取数据库连接
   * @param {*} dbInfo
   * @returns
   */
  getDbConnection
};
