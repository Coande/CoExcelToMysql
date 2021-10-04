<template>
  <div ref="container" :key="componentKey" class="row justify-between" style="position: relative;">
    <div class="col-5 col-md-4">
      <q-list dense v-if="excelCols.length" bordered separator>
        <draggable
          v-model="excelCols"
          tag="transition-group"
          :component-data="{
            type: 'transition-group',
            name: !drag ? 'flip-list' : null,
          }"
          item-key="id"
          v-bind="dragOptions"
          :move="checkMove"
          @start="drag = true"
          @end="drag = false"
        >
          <template #item="{ element }">
            <q-item :id="element.id" style="cursor: move">
              <div class="q-focus-helper" tabindex="-1"></div>
              <q-item-section>
                <q-item-label :lines="1"
                  >{{ element.name }}
                  <q-tooltip>
                    {{ element.name }}
                  </q-tooltip>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-grey-8 q-gutter-xs">
                  <q-btn size="sm" flat dense round>
                    <q-icon name="visibility" />
                    <q-tooltip
                      class="bg-white shadow-2"
                      anchor="center right"
                      self="center left"
                      >
                      <q-list dense class="text-grey-9">
                        <q-item>
                          <q-item-section>
                            <q-item-label caption>
                              前 3 条数据预览:
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                        <q-item v-for="row in element.headRows" :key="row">
                          <q-item-section>
                            <q-item-label><span>{{row}}</span></q-item-label>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-list>
      <q-list v-if="excelCols.length" bordered separator> </q-list>
      <q-btn
        v-if="excelCols.length"
        class="q-mt-md full-width"
        color="primary"
        icon="add_circle_outline"
        label="附加信息"
      />
    </div>

    <div class="col-5 col-md-4">
      <q-list dense v-if="dbCols.length" bordered separator>
        <draggable
          v-model="dbCols"
          tag="transition-group"
          :component-data="{
            type: 'transition-group',
            name: !drag ? 'flip-list' : null,
          }"
          item-key="id"
          v-bind="dragOptions"
          :move="checkMove"
          @start="drag = true"
          @end="drag = false"
        >
          <template #item="{ element }">
            <q-item :id="element.id" style="cursor: move">
              <div class="q-focus-helper" tabindex="-1"></div>
              <q-item-section>
                <q-item-label :lines="1">{{element.name}}</q-item-label>
                <q-tooltip max-width="20rem">
                  {{ element.name }}
                </q-tooltip>
              </q-item-section>
              <q-item-section>
                <q-item-label caption :lines="1">
                  {{ element.comment }}
                  <q-tooltip max-width="20rem">
                    {{ element.comment }}
                  </q-tooltip>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption :lines="1">varchar(255)</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-list>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import * as jsPlumb from "@jsplumb/browser-ui";
import { AnchorLocations } from '@jsplumb/common';

export default {
  components: {
    draggable,
  },
  data() {
    return {
      drag: false,
      excelCols: [],
      dbCols: [],
      jsPlumbIns: null,
      componentKey: 0
    }
  },
  computed: {
    dragOptions() {
      return {
        animation: 100,
        group: { name: "name", pull: false, put: false },
        disabled: false,
        ghostClass: "ghost"
      };
    },
  },
  methods: {
    async initJsPlumbIns() {
      await new Promise(async (resolve) => {
        if (this.jsPlumbIns) {
          // 先移除 Endpoint
          const eps = this.jsPlumbIns.getEndpoints();
          this.jsPlumbIns.destroy();
        }
        // jsPlumbIns.destroy() 时会删除DOM，需要重新渲染页面列表
        this.componentKey += 1;
        // 等待页面页面渲染完毕后再渲染 jsPlumb
        await this.$nextTick();
        jsPlumb.ready(() => {
          let instance = jsPlumb.newInstance({
            container: this.$refs.container,
            elementsDraggable: false,
          });
          instance.importDefaults({
            endpoint: {
              type: "Rectangle",
              options: {
                width: 14,
                height: 31,
              },
            },
            // endpoint 背景色设置 fill
            endpointHoverStyle: { fill: "#1976d2" },
            // connector 背景色设置 stroke
            paintStyle: { stroke: "#456", strokeWidth: 3 },
            hoverPaintStyle: { stroke: "#1976d2", strokeWidth: 10 },
          });
          this.jsPlumbIns = instance;
          // 设置连线限制
          instance.bind("beforeDrop", (params) => {
            const sourcePrefix = params.sourceId.split("_")?.[0];
            const targetPrefix = params.targetId.split("_")?.[0];
            if (sourcePrefix == targetPrefix) {
              return false;
            }
            return true;
          });
          // 双击连线时移除
          instance.bind(jsPlumb.EVENT_CONNECTION_DBL_CLICK, (param) => {
            this.jsPlumbIns.deleteConnection(param);
          });

          // 初始化左侧端点
          this.initEndpoint(this.excelCols, AnchorLocations.Right, -1);
          // 初始化右侧端点
          this.initEndpoint(this.dbCols, AnchorLocations.Left, 1);

          resolve(instance);
        });
      });
    },
    initEndpoint(dataArr, anchor, maxConnections) {
      dataArr.forEach((item) => {
        this.jsPlumbIns.addEndpoint(document.getElementById(item.id), {
          source: true,
          target: true,
          anchor: anchor,
          maxConnections: maxConnections,
        });
      });
    },
    connectEndpoint(leftId, RightId) {
      const leftEp = this.jsPlumbIns.getEndpoints(
        document.getElementById(leftId)
      )?.[0];
      const rightEp = this.jsPlumbIns.getEndpoints(
        document.getElementById(RightId)
      )?.[0];
      this.jsPlumbIns.connect({
        // 必须要获取已有的 Endpoint，如直接传入元素则不会沿用已有 Endpoint
        source: leftEp,
        target: rightEp,
        anchors: [AnchorLocations.Right, AnchorLocations.Left],
      });
    },
    /**
     * 暴露父组件调用重绘
     */
    repaintJsplumb() {
      if (this.jsPlumbIns) {
        this.jsPlumbIns.repaintEverything();
      }
    },
    // 拖动排序后，刷新 jsPlumb
    checkMove() {
      setTimeout(() => {
        this.repaintJsplumb();
      }, 0);
      // 返回 true 不阻断拖动
      return true;
    },
    /**
     * 暴露给父组件，用于刷新 Excel 列信息
     */
    async refreshExcelCols(fileInfo) {
      console.log('fileInfo:', fileInfo);
      const {colNames, headRows} = fileInfo;
      this.excelCols = [];
      for (let i = 0; i < colNames.length; i++) {
        const colName = colNames[i];
        const tmpHeadRows = []
        headRows.forEach(row => {
          tmpHeadRows.push(row[i]);
        });
        this.excelCols.push({
          id: "excelColId_" + i,
          name: colName,
          colIndex: i,
          headRows: tmpHeadRows
        });
      }

      await this.initJsPlumbIns();
    },
    /**
     * 暴露给父组件用于刷新数据库列信息刷新
     */
    async refreshDbCols(dbCols) {
      this.dbCols = dbCols;
      await this.initJsPlumbIns();
    },
    /**
     * 暴露给父组件调用，用于自动匹配 Excl 与 数据库 的列信息
     */
    autoMatch() {
      // 先根据列名匹配
      this.excelCols.forEach((excelCol) => {
        let found = this.dbCols.find((dbCol) => excelCol.name == dbCol.name);
        if (!found) {
          found = this.dbCols.find((dbCol) => excelCol.name == dbCol.comment);
        }
        if (found) {
          // 如果找到了，则自动连接上
          this.connectEndpoint(excelCol.id, found.id);
        }
      });
    },
    getExcelOrDbColById(id) {
      let isExcel = false;
      if (id.startsWith("excelColId_")) {
        let found = this.excelCols.find((item) => item.id == id);
        return {
          isExcel: true,
          found: found,
        };
      } else {
        let found = this.dbCols.find((item) => item.id == id);
        return {
          isExcel: false,
          found: found,
        };
      }
    },
    /**
     * 暴露给父组件调用，用户获取已连接的关系
     */
    getRelation() {
      if (!this.jsPlumbIns) {
        return {};
      }
      // 获取所有关联关系
      const conns = this.jsPlumbIns.getConnections();
      const relation = {};
      conns.forEach((conn) => {
        const sourceFound = this.getExcelOrDbColById(conn.sourceId);
        const targetFound = this.getExcelOrDbColById(conn.targetId);
        if (sourceFound.isExcel) {
          relation[targetFound.found.name] = sourceFound.found;
        } else {
          relation[sourceFound.found.name] = targetFound.found;
        }
      });
      return relation;
    }
  },
  async mounted() {
    // resize 时需要重绘 Endpoint 的位置，延迟 200 ms 等待 DOM 调整完毕
    window.addEventListener("resize", () => {
      setTimeout(() => {
        this.repaintJsplumb();
      }, 200);
    });
  }
}
</script>

<style scoped>
.ghost .q-focus-helper {
  background: currentColor;
  opacity: 0.15;
}
</style>
<style>
.jtk-endpoint {
  cursor: crosshair;
}

.jtk-endpoint-drop-allowed {
  background: red !important;
  box-shadow: black;
}
</style>
