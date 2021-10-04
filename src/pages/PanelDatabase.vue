<template>
  <div class="row justify-evenly">
    <q-input class="col-5" v-model="dbInfo.host" label="host" />
    <q-input class="col-5" v-model="dbInfo.port" label="port" />
    <q-input class="col-5" v-model="dbInfo.database" label="database" />
    <q-input class="col-5" v-model="dbInfo.table" label="table" />
    <q-input class="col-5" v-model="dbInfo.username" label="username" />
    <q-input class="col-5" v-model="dbInfo.password" label="password" />
  </div>
  <div class="row justify-center q-pt-md">
    <q-btn color="primary" label="读取表" @click="handleReadTable" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      dbInfo: {
        host: 'localhost',
        port: '3306',
        database: 'test',
        table: 't_excel',
        username: 'root',
        password: '123456'
      },
    }
  },
  methods: {
    async handleReadTable() {
      // 记录配置信息
      this.saveDbConfig();

      const dbCols = [];
      let rows;
      try {
        rows = await window.dbTool.getColInfo(JSON.parse(JSON.stringify(this.dbInfo)));
      } catch (error) {
        console.error('读取表失败：', error);
        this.$q.notify({
          type: 'negative',
          message: '读取表失败：' + error
        });
        return;
      }
      rows.forEach((field, i) => {
        dbCols.push({
          id: "dbCol_" + i,
          name: field.COLUMN_NAME,
          comment: field.COLUMN_COMMENT,
        });
      });
      this.$emit('readTable', dbCols);
    },
    /**
     * 记录数据库配置信息
     */
    saveDbConfig() {
      localStorage.setItem('dbConfig', JSON.stringify(this.dbInfo));
    },
    /**
     * 读取数据库配置信息
     */
    readDbConfig() {
      const dbConfigStr = localStorage.getItem('dbConfig');
      if (dbConfigStr) {
        const dbConfig = JSON.parse(dbConfigStr);
        this.dbInfo = dbConfig;
      }
    },
    /**
     * 暴露给父组件，用户获取数据库配置信息
     */
    getDbInfo() {
      return this.dbInfo;
    }
  },
  mounted() {
    this.readDbConfig();
  }
})
</script>

<style>

</style>
