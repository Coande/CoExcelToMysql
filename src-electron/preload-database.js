const { dateFormat, getCellShowValue  } = require('./preload-util');
const Excel = require('exceljs');
const mysql = require('mysql2/promise');

module.exports = {
  getColInfo: async (dbInfo) => {
    // 默认参数
    const targetDbInfo = {
      host: 'localhost',
      port: '3306',
      user: 'root',
      password: '123456',
      database: 'test',
      table: 't_excel'
    };
    // 传入参数覆盖默认参数
    Object.assign(targetDbInfo, dbInfo);

    // 获取数据库连接
    const connection = await mysql.createConnection({
        host: targetDbInfo.host,
        port: targetDbInfo.port,
        user: targetDbInfo.user,
        password: targetDbInfo.password,
        database: targetDbInfo.database
    });

    // 查询表结构
    const sql = 'select COLUMN_NAME,COLUMN_TYPE,COLUMN_COMMENT from information_schema.`COLUMNS` where TABLE_SCHEMA = ? and TABLE_NAME = ?';
    const queryRes = await connection.execute(sql, [targetDbInfo.database, targetDbInfo.table]);

    if (queryRes[0].length == 0) {
      throw '数据库或表不存在';
    }
    return queryRes[0];
  },
  appendImportExcel: async (filePaths, dbInfo, relation, cb) => {
    if (Object.keys(relation).length == 0) {
      return;
    }

    // 默认参数
    const targetDbInfo = {
      host: 'localhost',
      port: '3306',
      user: 'root',
      password: '123456',
      database: 'test',
      table: 't_excel'
    };
    // 传入参数覆盖默认参数
    Object.assign(targetDbInfo, dbInfo);
    // 获取数据库连接
    const connection = await mysql.createConnection({
      host: targetDbInfo.host,
      port: targetDbInfo.port,
      user: targetDbInfo.user,
      password: targetDbInfo.password,
      database: targetDbInfo.database
    });

    await connection.beginTransaction();

    try {
      for (let index = 0; index < filePaths.length; index++) {
        const filePath = filePaths[index];

        // 第二个参数主要是用来处理读取日期为数字的 BUG
        // https://github.com/exceljs/exceljs/issues/1430
        const workbookReader = new Excel.stream.xlsx.WorkbookReader(filePath, {
          entries: 'emit',
          sharedStrings: 'cache',
          hyperlinks: 'cache',
          styles: 'cache',
          worksheets: 'emit',
        });

        let fileRowCount = 0;

        for await (const worksheetReader of workbookReader) {
          const BATCH_COUNT = 500;
          let currentCount = 0;

          const excelColNames = Object.keys(relation);
          const dbCols = Object.values(relation);
          const dbColNames = dbCols.map(item => item.name);
          const dbColNamesTmp = dbCols.map(item => `\`${item.name}\``);
          const sqlTpl = `insert into ${dbInfo.table} (${dbColNamesTmp.join(',')}) values `;
          let sql = sqlTpl;
          let params = [];
          let isFirst = true;
          console.info('导入开始时间： ', dateFormat("YYYY-mm-dd HH:MM:SS", new Date()));
          for await (const row of worksheetReader) {
            fileRowCount ++;
            cb(filePath, fileRowCount);
            // 跳过第一行
            if(isFirst) {
              isFirst = false;
              continue;
            }
            // 获取行的所有值
            let rowCellVals = [];
            dbColNames.forEach(dbColName => {
              const relValue = relation[dbColName];
              const cell = row.getCell(relValue.colIndex + 1);
              const cellValue = getCellShowValue(cell);
              rowCellVals.push(cellValue);
            });


            if (currentCount < BATCH_COUNT) {
              // 拼接 sql
              sql += '('
              const cellsTmp = rowCellVals.map(item => `?`);
              sql += cellsTmp.join(',');
              params = params.concat(rowCellVals);
              sql += '),'

              currentCount ++;
            } else {
              sql = sql.substr(0, sql.length - 1);
              // 达到批量最大值，执行 sql 并重置
              await connection.execute(sql, params);
              // 重置
              sql = sqlTpl;
              params = [];
              currentCount = 0;

              // 拼接 sql
              sql += '('
              const cellsTmp = rowCellVals.map(item => `?`);
              sql += cellsTmp.join(',');
              params = params.concat(rowCellVals);
              sql += '),'

              currentCount ++;

            }
          }
          // 最后一页入库
          if (currentCount > 0) {
            sql = sql.substr(0, sql.length - 1);
            await connection.execute(sql, params);
          }
          break;
        }
        // 提交事务
        console.info('提交事务时间： ', dateFormat("YYYY-mm-dd HH:MM:SS", new Date()));
        await connection.commit();
        console.info('导入结束时间： ', dateFormat("YYYY-mm-dd HH:MM:SS", new Date()));
      }
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    }
  }
}