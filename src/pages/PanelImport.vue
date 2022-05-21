<template>
  <q-expansion-item
    default-opened
    dense
    class="shadow-1 overflow-hidden q-mb-sm"
    style="border-radius: 3px"
    icon="attach_file"
    label="文件"
    header-class="bg-primary text-white"
    expand-icon-class="text-white"
  >
    <q-card>
      <q-card-section>
        <panel-file @fileChange="handleFileChange" />
      </q-card-section>
    </q-card>
  </q-expansion-item>

  <q-expansion-item
    default-opened
    dense
    class="shadow-1 overflow-hidden"
    style="border-radius: 3px"
    icon="storage"
    label="数据库"
    header-class="bg-primary text-white"
    expand-icon-class="text-white"
  >
    <q-card>
      <q-card-section>
        <panel-database ref="panelDatabase" />
      </q-card-section>
    </q-card>
  </q-expansion-item>

  <div class="row q-gutter-x-md q-my-md">
    <q-btn color="primary" label="读取表列" @click="handleReadDbTable" />
    <q-btn color="primary" label="自动匹配" @click="handleAutoMatch" />
    <!-- <q-btn color="primary" label="顺序匹配" @click="handleAppendImport" /> -->
    <q-btn color="primary" label="追加导入" @click="handleAppendImport" />
    <!-- <q-btn color="primary" label="重新导入" @click="handleAppendImport" /> -->
    <!-- <q-btn color="primary" label="自动顺序" @click="handleAppendImport" /> -->
  </div>
  <panel-col-list ref="panelColList" />

</template>

<script>
import { defineComponent,toRaw } from "vue";
import PanelDatabase from "./PanelDatabase.vue";
import PanelFile from "./PanelFile.vue";
import PanelColList from "./PanelColList.vue";
import { QSpinnerGears } from "quasar";

export default defineComponent({
  components: {
    PanelDatabase,
    PanelFile,
    PanelColList
  },
  data() {
    return {
      fileInfo: {
        files: [],
        sheetno: 1
      }
    };
  },
  methods: {
    handleAutoMatch() {
      this.$refs.panelColList.autoMatch();
    },
    async handleReadDbTable() {
      const dbInfo = this.$refs.panelDatabase.getDbInfo();

      const dbCols = [];
      let rows;
      try {
        rows = await window.dbTool.getColInfo(JSON.parse(JSON.stringify(dbInfo)));
      } catch (error) {
        console.error('读取表失败：', error);
        this.$q.notify({
          type: 'negative',
          message: '读取表失败：' + error.message
        });
        return;
      }
      rows.forEach((field, i) => {
        dbCols.push({
          id: "dbColId_" + i,
          name: field.COLUMN_NAME,
          comment: field.COLUMN_COMMENT,
          type: field.COLUMN_TYPE
        });
      });

      this.$refs.panelColList.refreshDbCols(dbCols);
    },
    async handleAppendImport() {
      const relation = JSON.parse(JSON.stringify(this.$refs.panelColList.getRelation()));

      if (Object.keys(relation).length == 0) {
        this.$q.notify({
          type: 'negative',
          message: '请先连线以建立关联关系'
        });
        return;
      }
      const dbInfo = JSON.parse(JSON.stringify(this.$refs.panelDatabase.getDbInfo()));

      this.$q.loading.show({
        spinner: QSpinnerGears,
        message: "执行追加导入中...",
      });
      try {
        await window.dbTool.appendImportExcel(
          this.fileInfo.files.map(item => {
            return {
              path: item.path,
              name: item.name
            }
          }),
          this.fileInfo.sheetno,
          dbInfo,
          relation,
          (filePath, readCount) => {
            this.$q.loading.show({
              spinner: QSpinnerGears,
              message: `执行追加导入中...<br/>正在处理：${filePath}<br/>已读取数据：${readCount}`,
              html: true
            });
          }
        );
        this.$q.dialog({
          title: '成功',
          message: this.fileInfo.files.map(item => item.name).join('、') + " 导入完毕"
        });
      } catch(error) {
        console.error(error);
        this.$q.dialog({
          title: '错误',
          message: error.message
        });
      } finally {
        this.$q.loading.hide();
      }
    },
    /**
     * 暴露给父组件，用来刷新 jsplumb
     */
    repaintJsplumb() {
      this.$refs.panelColList.repaintJsplumb();
    },
    handleFileChange(fileInfo) {
      this.$refs.panelColList.refreshExcelCols(fileInfo);
      this.fileInfo = fileInfo;
    },
  },
  mounted() {
  }
});
</script>
