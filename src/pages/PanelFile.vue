<template>
  <q-file
    filled
    use-chips
    multiple
    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    v-model="files"
    label="选择/拖入 Excel"
    @update:model-value="fileChange"
  />
</template>

<script>
export default {
  data() {
    return {
      files: []
    };
  },
  methods: {
    async fileChange() {
      let lastColNames = [];
      let firstHeadRows = [];
      for (let index = 0; index < this.files.length; index++) {
        const file = this.files[index];
        const {colNames, headRows} = await window.excelTool.getColumnNames(file.path);
        if (index > 0) {
          // 验证，仅允许列名都相同的 Excel
          if (lastColNames.length != colNames.length) {
            // 报错并清空文件
            this.files = [];
            this.$q.notify({
              type: 'negative',
              message: '仅支持选择多个表头一致的 Excel'
            });
            return;
          }
          for (let colIndex = 0; colIndex < lastColNames.length; colIndex++) {
            const colsNameLast = lastColNames[colIndex];
            const idxColName = colNames[colIndex];
            if (colsNameLast != idxColName) {
              // 报错并清空文件
              this.files = [];
              this.$q.notify({
                type: 'negative',
                message: '仅支持选择多个表头一致的 Excel'
              });
              return;
            }
          }
        } else {
          firstHeadRows = headRows;
        }
        lastColNames = colNames;
      }
      // 通知父组件文件更新
      this.$emit('fileChange', {
        files: this.files,
        colNames: lastColNames,
        headRows: firstHeadRows
      });
    }
  }
}
</script>

<style>

</style>
