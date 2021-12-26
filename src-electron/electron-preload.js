/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */


import { contextBridge } from "electron";
const remote = require("@electron/remote");

const { parser } = remote.getGlobal("sharedObject").cmdParams;
// const parser = "xlsxextract";

const preloadExcelExceljs = require('./preload-excel-exceljs');
const preloadExcelXlsxextract = require('./preload-excel-xlsxextract');
const preloadDatabaseExceljs = require('./preload-database-exceljs');
const preloadDatabaseXlsxextract = require('./preload-database-xlsxextract');


const excelTools = {
  exceljs: preloadExcelExceljs,
  xlsxextract: preloadExcelXlsxextract,
};

const dbTools = {
  exceljs: preloadDatabaseExceljs,
  xlsxextract: preloadDatabaseXlsxextract,
};

console.log("using parser:", parser);
contextBridge.exposeInMainWorld("excelTool", excelTools[parser]);
contextBridge.exposeInMainWorld("dbTool", dbTools[parser]);
