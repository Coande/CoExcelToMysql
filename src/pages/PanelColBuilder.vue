<template>
  <div>
    <q-list dense v-if="builderCols.length" bordered separator>
      <!-- 表头 -->
      <q-item>
        <q-item-section class="col-1">
          <q-item-label :lines="1">
            是否需要
          </q-item-label>
        </q-item-section>
        <q-item-section class="col-3">
          <q-item-label :lines="1">
            Excel 列名称
          </q-item-label>
        </q-item-section>
        <q-item-section class="col-2">
          <q-item-label :lines="1">
            DB 字段名称
          </q-item-label>
        </q-item-section>
        <q-item-section class="col-2">
          <q-item-label :lines="1">
            DB 字段类型
          </q-item-label>
        </q-item-section>
        <q-item-section class="col-3">
          <q-item-label :lines="1">
            DB 注释
          </q-item-label>
        </q-item-section>
      </q-item>
      <draggable
        v-model="builderCols"
        tag="transition-group"
        :component-data="{
          type: 'transition-group',
          name: !drag ? 'flip-list' : null,
        }"
        item-key="id"
        v-bind="dragOptions"
        @start="drag = true"
        @end="drag = false"
        handle=".drag-handle"
      >
        <template #item="{ element }">
          <q-item :id="element.id">
            <div class="q-focus-helper" tabindex="-1"></div>
            <q-item-section class="col-1">
              <q-item-label :lines="1">
                <q-checkbox v-model="element.isChecked" />
              </q-item-label>
            </q-item-section>
            <q-item-section class="col-2 drag-handle" style="cursor: move">
              <q-item-label :lines="1"
                >
                <q-btn v-if="element.name" size="sm" flat dense round class="text-grey-4 q-mr-xs">
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
                {{ element.name }}
                <q-tooltip>
                  {{ element.name }}
                </q-tooltip>
              </q-item-label>
            </q-item-section>
            <q-item-section class="col-3">
              <q-item-label :lines="1">
                <q-input type="textarea" rows="1" dense filled v-model="element.dbColName" :input-style="{resize: 'none'}" @blur="handleBlur($event, element.id)" />
              </q-item-label>
            </q-item-section>
            <q-item-section class="col-2">
              <q-item-label :lines="1">
                <q-select
                  dense
                  options-dense
                  filled
                  :model-value="element.dbType"
                  use-input
                  hide-selected
                  fill-input
                  input-debounce="0"
                  :options="dbTypeOptions"
                  @filter="filterDbType"
                  @input-value="setDbType($event, element)"
                  hide-dropdown-icon
                  @blur="handleBlur($event, element.id)"
                >
                </q-select>
              </q-item-label>
            </q-item-section>
            <q-item-section class="col-3">
              <q-item-label :lines="1">
                <q-input type="textarea" rows="1" dense filled v-model="element.dbComment" :input-style="{resize: 'none'}" @blur="handleBlur($event, element.id)" />
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-list>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import draggable from "vuedraggable";
import pinyin from "pinyin";

export default defineComponent({
  components: {
    draggable,
  },
  data() {
    return {
      drag: false,
      builderCols: [],
      dbTypeModel: '',
      dbTypeOptionsOrig: [
        'bigint(20)', 'binary(1)', 'bit(1)', 'blob', 'char(1)', 'date', 'datetime', 'decimal(10,0)', 'double', 'enum', 'float', 'geometry', 'geometrycollection',
        'int(11)', 'integer', 'json', 'linestring', 'longblob', 'longtext', 'mediumblob', 'mediumint(9)', 'mediumtext', 'multilinestring', 'multipoint',
        'multipolygon', 'numeric', 'point', 'polygon', 'real', 'smallint(6)', 'set', 'text', 'time', 'timestamp', 'tinyblob', 'tinyint(4)', 'tinytext',
        'varbinary(255)', 'varchar(255)', 'year(4)'
      ],
      dbTypeOptions: []
    };
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
        /**
     * 暴露给父组件，用于刷新 Excel 列信息
     */
    async refreshBuilderCols(fileInfo) {
      console.log('fileInfo:', fileInfo);
      const {colNames, headRows} = fileInfo;
      this.builderCols = [];
      for (let i = 0; i < colNames.length; i++) {
        const colName = colNames[i];
        const tmpHeadRows = []
        headRows.forEach(row => {
          tmpHeadRows.push(row[i]);
        });
        this.builderCols.push({
          id: "builderColId_" + i,
          name: colName,
          colIndex: i,
          headRows: tmpHeadRows,
          dbColName: '',
          dbType: '',
          dbComment: '',
          isChecked: true
        });
      }
      // 添加一个附加列
      const additionCol = {
        id: "builderColId_" + new Date().getTime(),
        name: '',
        colIndex: 0,
        headRows: [],
        dbColName: '',
        dbType: '',
        dbComment: '',
        isChecked: false
      };
      this.builderCols.push(additionCol);
    },
    filterDbType (val, update, abort) {
      update(() => {
        const needle = val.toLocaleLowerCase()
        this.dbTypeOptions = this.dbTypeOptionsOrig.filter(v => v.toLocaleLowerCase().indexOf(needle) > -1)
      })
    },
    setDbType (val, element) {
      element.dbType = val
    },
    /**
     * 暴露给父组件，用于自动填充字段名称、类型、注释
     */
    autoFill() {
      this.builderCols.forEach(col => {
        if (!col.name && !col.dbColName) {
          // 如果是空的附加列，则不处理
          return;
        }
        let pyStr = pinyin(col.name, {
          style: pinyin.STYLE_NORMAL
        }).flat().join('');
        // 去除特殊符号
        pyStr = pyStr.replace(/[^a-zA-Z]/g,'');
        if (pyStr.length > 16) {
          // 如果长度大于16，则仅取首字母
          pyStr = pinyin(col.name, {
            style: pinyin.STYLE_FIRST_LETTER
          }).flat().join('');
          // 去除特殊符号
          pyStr = pyStr.replace(/[^a-zA-Z]/g,'');
        }
        col.dbColName = pyStr;
        col.dbType = 'varchar(255)';
        col.dbComment = col.name;
      });
    },
    handleBlur(event, currentId) {
      const currentIndex = this.builderCols.findIndex(item => item.id == currentId);
      // 如果当前列是附加列时才需要处理
      if (this.builderCols[currentIndex].name) {
        return;
      }
      // 检查是否还有空的
      const emptyIndex = this.builderCols.findIndex(item => !item.name && !item.dbColName);
      if (emptyIndex == -1) {
        // 没有空的了，添加一行
        const emptyItem = {
          id: "builderColId_" + new Date().getTime(),
          name: '',
          colIndex: 0,
          headRows: [],
          dbColName: '',
          dbType: '',
          dbComment: '',
          isChecked: false
        };
        this.builderCols.push(emptyItem);
      } else {
        const emptyList = this.builderCols.filter(item => !item.name && !item.dbColName);
        if (emptyList.length > 1) {
          // 删除当前条目
          this.builderCols.splice(currentIndex, 1);
        }
      }
    },
    /**
     * 暴露给父组件，用于获取配置信息
     */
    getBuilderCols() {
      return this.builderCols;
    }
  }
})
</script>

<style scoped>
.ghost .q-focus-helper {
  background: currentColor;
  opacity: 0.15;
}
</style>
