<template>
  <q-page class="q-pa-xl">
      <q-tabs
        v-model="currentTab"
        inline-label
        align="justify"
        class="bg-primary text-white shadow-2 q-mb-sm"
        :breakpoint="0"
        style="border-radius: 3px"
        >
        <q-tab name="craeteTable" icon="add_circle_outline" label="创建表" />
        <q-tab name="importExcel" icon="file_upload" label="导入" />
        <!-- <q-tab name="exportExcel" icon="file_download" label="导出" /> -->
      </q-tabs>
      <q-tab-panels v-model="currentTab" keep-alive animated>
        <q-tab-panel name="craeteTable">
          <panel-create />
        </q-tab-panel>

        <q-tab-panel name="importExcel">
          <panel-import ref="panelImport" />
        </q-tab-panel>

        <!-- <q-tab-panel name="exportExcel">
          <panel-export ref="panelExport" />
        </q-tab-panel> -->
      </q-tab-panels>
  </q-page>
</template>

<script>
import { defineComponent } from 'vue';
import PanelImport from './PanelImport.vue';
// import PanelExport from './PanelExport.vue';
import PanelCreate from './PanelCreate.vue';

export default defineComponent({
  name: 'PageIndex',
  components: {
    PanelImport,
    PanelCreate,
    // PanelExport
  },
  data() {
    return {
      currentTab: 'importExcel'
    }
  },
  methods: {

  },
  mounted() {

  }
})
</script>
