<template>
  <div ref="container" :key="componentKey" class="row justify-between" style="position: relative;">
    <div class="col-5 col-md-4">
      <div v-if="excelCols.length" class="text-grey-6 q-mb-sm">Excel 列信息：</div>
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
                <div class="text-grey-4 q-gutter-xs">
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
      <div v-if="excelCols.length" class="text-grey-6 q-mt-md q-mb-sm">变量与常量：</div>
      <q-list v-if="excelCols.length" dense bordered separator>
        <template v-for="(vari) in varList" :key="vari.id">
          <q-item v-if="vari.varType == 'const'" :id="vari.id">
            <q-item-section>
              <q-item-label :lines="1">变量：{{vari.name}}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-else :id="vari.id" class="list-item-const">
            <q-item-section>
              <q-item-label :lines="1">
                <q-input v-model="vari.varValue" square standout="bg-grey-6" dense :placeholder="vari.name" @blur="handleVarInputBlur(vari.id)">
                  <template v-slot:before>
                    常量：
                  </template>
                </q-input>
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </div>

    <div class="col-5 col-md-4">
      <div v-if="dbCols.length" class="text-grey-6 q-mb-sm">数据库列信息：</div>
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
                <q-item-label caption :lines="1">{{ element.type }}</q-item-label>
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
      componentKey: 0,
      varList: [
        {
          id: 'varAndConst_0',
          name: '文件名',
          varType: 'const'
        },
        {
          id: 'varAndConst_1',
          name: '常量值',
          varType: 'var',
          varValue: ''
        }
      ]
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
          // 初始化变量端点
          if (this.excelCols.length) {
            this.initEndpoint(this.varList, AnchorLocations.Right, -1);
          }
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
    removeEndpoint(id) {
      const el = document.getElementById(id);
      const eps = this.jsPlumbIns.getEndpoints(el);
      eps.forEach(ep => {
        this.jsPlumbIns.deleteEndpoint(ep);
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
      } else if (id.startsWith('dbColId_')) {
        let found = this.dbCols.find((item) => item.id == id);
        return {
          isExcel: false,
          found: found,
        };
      } else if (id.startsWith('varAndConst_')) {
        let found = this.varList.find((item) => item.id == id);
        return {
          isExcel: true,
          found: found,
        };
      } else {
        console.error('未处理的 id 类型');
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
    },
    async handleVarInputBlur(currentId) {
      const currentIndex = this.varList.findIndex(item => item.id == currentId);
      // 检查是否还有空的
      const emptyIndex = this.varList.findIndex(item => item.varType == 'var' && !item.varValue);
      if (emptyIndex == -1) {
        // 没有空的了，添加一行
        const varItem = {
          id: 'varAndConst_' + new Date().getTime(),
          name: '常量值',
          varType: 'var',
          varValue: ''
        };
        this.varList.push(varItem);
        // 渲染为 Endpoint
        // 需要等待渲染完毕
        await this.$nextTick();
        // 初始化右侧端点
        this.initEndpoint([varItem], AnchorLocations.Right, -1);
      } else {
        const emptyList = this.varList.filter(item => item.varType == 'var' && !item.varValue);
        if (emptyList.length > 1) {
          const currentItem = this.varList[currentIndex];

          // 删除当前条目
          this.varList.splice(currentIndex, 1);

          // 删除连线及 Endpoint
          this.removeEndpoint(currentItem.id);

          // 等待渲染完毕
          await this.$nextTick();

          // 可能中间节点被删除，需要重绘
          this.repaintJsplumb();
        }
      }
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

.list-item-const input{
  line-height: 1.2em !important;
  padding: 0 !important;
}
</style>

<style>
.list-item-const .q-field--dense .q-field__control, .q-field--dense .q-field__marginal {
  height: 1.2em;
}
.list-item-const .q-field__marginal {
  color: inherit;
  font-size: 14px;
}
.list-item-const .q-field--standout .q-field__control {
  padding: 0;
}
.list-item-const .q-field--dense .q-field__before, .q-field--dense .q-field__prepend {
  padding-right: 0;
}
</style>
