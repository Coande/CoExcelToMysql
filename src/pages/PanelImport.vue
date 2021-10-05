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
        <panel-database ref="panelDatabase" @readTable="handleReadTable" />
      </q-card-section>
    </q-card>
  </q-expansion-item>

  <div class="row q-gutter-x-md q-my-md">
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
        files: []
      }
    };
  },
  methods: {
    handleAutoMatch() {
      this.$refs.panelColList.autoMatch();
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
    /**
     * 点击 读取表 后获取到表的列信息
     */
    handleReadTable(dbCols) {
      this.$refs.panelColList.refreshDbCols(dbCols);
    }
  },
  mounted() {
  }
});
</script>
