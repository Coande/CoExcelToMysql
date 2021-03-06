const Excel = require('exceljs');
const { getCellShowValueExceljs: getCellShowValueExceljs  } = require('./preload-util');

module.exports = {
  getColumnNames: async (filePath, sheetno) => {
    const workbookReader = new Excel.stream.xlsx.WorkbookReader(filePath);
    let colNames = [];
    const headRows = [];
    let currentSheetNo = 0;
    for await (const worksheetReader of workbookReader) {
      currentSheetNo ++;
      if (currentSheetNo != sheetno) {
        continue;
      }
      let count = 0;
      for await (const row of worksheetReader) {
        count ++;
        if (count == 1) {
          colNames = row.values;
          colNames.splice(0, 1);
        } else if (count <= 4) {
          // 根据头部获取头部相关的列单元格（避免中间有空值的情况）
          const rowCellVals = [];
          for (let index = 0; index < colNames.length; index++) {
            const cell = row.getCell(index + 1);
            rowCellVals.push(getCellShowValueExceljs(cell));
          }
          headRows.push(rowCellVals);
        } else {
          break;
        }
      }
      break;
    }
    return {
      colNames,
      headRows
    }
  }
}
