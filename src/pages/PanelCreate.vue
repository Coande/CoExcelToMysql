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
    <q-btn color="primary" label="自动填充" @click="handleAutoPinyin" />
    <q-btn color="primary" label="创建表" @click="handleCreate" />
  </div>
  <panel-col-builder ref="panelColBuilder" />
</template>

<script>
import PanelColBuilder from './PanelColBuilder.vue';
import PanelFile from "./PanelFile.vue";
import PanelDatabase from "./PanelDatabase.vue";

export default {
  components: {
    PanelColBuilder,
    PanelFile,
    PanelDatabase
  },
  data() {
    return {
    };
  },
  methods: {
    handleFileChange(fileInfo) {
      // 显示列信息
      this.$refs.panelColBuilder.refreshBuilderCols(fileInfo);
    },
    handleAutoPinyin() {
      this.$refs.panelColBuilder.autoFill();
    },
    async handleCreate() {
      const builderCols = this.$refs.panelColBuilder.getBuilderCols();
      // 仅获取勾选的
      const checkedCols = builderCols.filter(item => item.isChecked);
      // 必须要有勾选
      if (!checkedCols.length) {
        this.$q.notify({
          type: 'negative',
          message: '请勾选需要的字段'
        });
        return;
      }
      // 验证必填是否填写
      const valiFailCol = checkedCols.findIndex(checkedCol => {
        if (!checkedCol.dbColName.trim() || !checkedCol.dbType.trim()) {
          return true;
        }
        return false;
      });
      if (valiFailCol != -1) {
        this.$q.notify({
          type: 'negative',
          message: '请填写完整的字段名称及类型'
        });
        return;
      }

      // 创建
      const builderColsClone = JSON.parse(JSON.stringify(checkedCols));

      const dbInfoRaw = this.$refs.panelDatabase.getDbInfo();
      const dbInfo = JSON.parse(JSON.stringify(dbInfoRaw));
      try {
        await window.dbTool.createTable(dbInfo, builderColsClone);
        this.$q.notify({
          type: 'positive',
          message: '表 ' + dbInfo.table + ' 已创建'
        });
      } catch(error) {
        console.error(error);
        this.$q.dialog({
          title: '错误',
          message: error.message
        });
      }

    }
  }
}
</script>

<style>

</style>
