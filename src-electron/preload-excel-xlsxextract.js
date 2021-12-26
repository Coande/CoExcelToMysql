const XLSX = require("xlsx-extract").XLSX;
const {
  getCellShowValueXlsxExtract: getCellShowValueXlsxExtract,
} = require("./preload-util");

module.exports = {
  getColumnNames: async (filePath) => {
    let colNames = [];
    const headRows = [];
    let count = 0;

    const result = await new Promise(async (resolve) => {
      new XLSX()
        .extract(filePath, { sheet_id: 1 })
        .on("row", function (row) {
          count++;
          if (count == 1) {
            colNames = row;
          } else if (count <= 4) {
            // 根据头部获取头部相关的列单元格（避免中间有空值的情况）
            const rowCellVals = [];
            for (let index = 0; index < colNames.length; index++) {
              const cell = row[index];
              rowCellVals.push(getCellShowValueXlsxExtract(cell));
            }
            headRows.push(rowCellVals);
          } else {
            resolve({
              colNames,
              headRows,
            });
            throw new Error("抛出异常以中断读取，异常无需处理");
          }
        })
        .on("end", function (err) {
          resolve({
            colNames,
            headRows,
          });
        });
    });

    return result;
  },
};
