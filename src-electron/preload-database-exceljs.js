const { dateFormat, getCellShowValueExceljs  } = require('./preload-util');
const Excel = require('exceljs');
const {getColInfo, getDbConnection, createTable} = require('./preload-database-comm');


const getRowCellValues = (row, dbColNames, relation, file) => {
  let rowCellVals = [];
  dbColNames.forEach(dbColName => {
    const relValue = relation[dbColName];
    if (relValue.id.startsWith('varAndConst_')) {
      let colValue = '';
      if (relValue.name == '文件名') {
        colValue = file.name;
      } else if (relValue.name == '常量值'){
        colValue = relValue.varValue;
      }
      rowCellVals.push(colValue);
    } else {
      const cell = row.getCell(relValue.colIndex + 1);
      const cellValue = getCellShowValueExceljs(cell);
      rowCellVals.push(cellValue);
    }
  });
  return rowCellVals;
}

module.exports = {
  getColInfo,
  appendImportExcel: async (files, dbInfo, relation, cb) => {
    if (Object.keys(relation).length == 0) {
      return;
    }

    // 获取数据库连接
    const connection = await getDbConnection(dbInfo);

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const filePath = file.path;

        // 第二个参数主要是用来处理读取日期为数字的 BUG
        // https://github.com/exceljs/exceljs/issues/1430
        const workbookReader = new Excel.stream.xlsx.WorkbookReader(filePath, {
          entries: "emit",
          sharedStrings: "cache",
          hyperlinks: "cache",
          styles: "cache",
          worksheets: "emit",
        });

        let fileRowCount = 0;

        for await (const worksheetReader of workbookReader) {
          const BATCH_COUNT = 500;
          let currentCount = 0;

          const dbColNames = Object.keys(relation);
          const dbColNamesTmp = dbColNames.map((item) => `\`${item}\``);
          const sqlTpl = `insert into ${dbInfo.table} (${dbColNamesTmp.join(
            ","
          )}) values `;
          let sql = sqlTpl;
          let params = [];
          let isFirst = true;
          console.info(
            "导入开始时间： ",
            dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
          );
          for await (const row of worksheetReader) {
            fileRowCount++;
            cb(filePath, fileRowCount);
            // 跳过第一行
            if (isFirst) {
              isFirst = false;
              continue;
            }
            // 获取行的所有值
            let rowCellVals = getRowCellValues(row, dbColNames, relation, file);
            if (currentCount < BATCH_COUNT) {
              // 拼接 sql
              sql += "(";
              const cellsTmp = rowCellVals.map((item) => `?`);
              sql += cellsTmp.join(",");
              params = params.concat(rowCellVals);
              sql += "),";

              currentCount++;
            } else {
              sql = sql.substr(0, sql.length - 1);
              // 达到批量最大值，执行 sql 并重置
              await connection.execute(sql, params);
              // 重置
              sql = sqlTpl;
              params = [];
              currentCount = 0;

              // 拼接 sql
              sql += "(";
              const cellsTmp = rowCellVals.map((item) => `?`);
              sql += cellsTmp.join(",");
              params = params.concat(rowCellVals);
              sql += "),";

              currentCount++;
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
        console.info(
          "提交事务时间： ",
          dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
        );
        await connection.commit();
        console.info(
          "导入结束时间： ",
          dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
        );
      }
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    }
  },
  createTable,
};



