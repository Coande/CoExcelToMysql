const XLSX = require("xlsx-extract").XLSX;
const {
  dateFormat,
  getCellShowValueXlsxExtract: getCellShowValueXlsxExtract,
} = require("./preload-util");

const { getColInfo, getDbConnection,createTable } = require("./preload-database-comm");

const getRowCellValues = (row, dbColNames, relation, file) => {
  let rowCellVals = [];
  dbColNames.forEach((dbColName) => {
    const relValue = relation[dbColName];
    if (relValue.id.startsWith("varAndConst_")) {
      let colValue = "";
      if (relValue.name == "文件名") {
        colValue = file.name;
      } else if (relValue.name == "常量值") {
        colValue = relValue.varValue;
      }
      rowCellVals.push(colValue);
    } else {
      const cell = row[relValue.colIndex];
      const cellValue = getCellShowValueXlsxExtract(cell);
      rowCellVals.push(cellValue);
    }
  });
  return rowCellVals;
};

const importOneFile = (
  relation,
  dbInfo,
  file,
  cb,
  connection,
  resolve,
  reject
) => {
  const filePath = file.path;

  // 队列控制逻辑
  const queue = {
    list: [],
    status: false,
    exec: async (eventValue, next) => {
      try {
        if (eventValue.endOneFile) {
          await processEndOneFile(next);
          eventValue.resolve();
        } else {
          await processRow(eventValue, next);
        }
      } catch (error) {
        eventValue.reject(error);
      }
    },
    push: (eventValue) => {
      queue.list.push(eventValue);
      queue.start();
    },
    start: () => {
      if (!queue.status && queue.list.length) {
        queue.status = true;
        const params = queue.list.shift();
        queue.exec(params, () => {
          queue.status = false;
          queue.start();
        });
      }
    },
  };

  const BATCH_COUNT = 100;
  let currentCount = 0;

  const dbColNames = Object.keys(relation);
  const dbColNamesTmp = dbColNames.map((item) => `\`${item}\``);
  const sqlTpl = `insert into ${dbInfo.table} (${dbColNamesTmp.join(
    ","
  )}) values `;
  let sql = sqlTpl;
  let params = [];
  console.info(
    "导入开始时间： ",
    dateFormat("YYYY-mm-dd HH:MM:SS", new Date())
  );

  let fileRowCount = 0;
  new XLSX()
    .extract(filePath, { sheet_id: 1, ignore_header: 1 })
    .on("row", (row) =>
      queue.push({
        row: row,
        file: file,
        endOneFile: false,
        resolve,
        reject,
      })
    )
    .on("error", (err) => {
      reject(err);
    })
    .on("end", (row) =>
      queue.push({
        row: {},
        file: file,
        endOneFile: true,
        resolve,
        reject,
      })
    );

  async function processEndOneFile(next) {
    // 最后一页入库
    if (currentCount > 0) {
      sql = sql.substr(0, sql.length - 1);
      await connection.execute(sql, params);
    }
    next();
  }

  async function processRow(eventValue, next) {
    const row = eventValue.row;
    const file = eventValue.file;
    fileRowCount++;
    cb(filePath, fileRowCount);
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
    next();
  }
};

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

        await new Promise(async (resolve, reject) => {
          importOneFile(
            relation,
            dbInfo,
            file,
            cb,
            connection,
            resolve,
            reject
          );
        });

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
  createTable
};
