<template>
    <Toast position="top-center" />
        <Dialog v-model:visible="visible" modal header="Название столбца" :style="{ width: '25rem' }">
                <InputText v-model="newNameColumn" class="flex-auto" autocomplete="off" autofocus />
            <div class="wrapper-dialog-button">
                <Button class="btn-dialog" type="button" label="Отменить" severity="secondary" @click="visible = false"></Button>
                <Button class="btn-dialog" type="button" label="Сохранить" severity="succsess" @click="safeResultEditColumn"></Button>
            </div>
        </Dialog>
    <div class="wrapper-table">
        <div class="wrapper-table-button">
            <Button class="btn-table" type="button" label="Добавить строку" :disabled="!visibleEdit" @click="createRow"></Button>
            <Button class="btn-table" type="button" label="Добавить столбец" :disabled="!visibleEdit" @click="createColumn"></Button>
            <Button v-if="this.columns || this.cells" class="btn-table btn-ai" severity="help" type="button" label="Таблица в текст с помощью AI" icon="pi pi-sparkles" :loading="loading" @click="runMWS"></Button>
        </div>
        <DataTable showGridlines removableSort :loading="!visibleEdit" :value="cells" editMode="cell" @cell-edit-complete="onCellEditComplete"
            v-if="this.columns || this.cells"
            :pt="{
                table: { style: 'min-width: 50rem' },
                column: { bodycell: ({ state }) => ({class: [{ '!py-0': state['d_editing'] }]}) }
            }"
            >
            <Column v-for="col of columns" sortable :key="col.field" :field="col.field" :header="col.header">
                <template #header="{ column }">
                    <div class="wrapper-edit-column-button">
                        <Button class="btn-edit" icon="pi pi-chevron-left" size="small" severity="secondary" :disabled="!visibleEdit" @click="shiftLeftColumn($event, column)"></Button>
                        <Button class="btn-edit" icon="pi pi-chevron-right" size="small" severity="secondary" :disabled="!visibleEdit" @click="shiftRightColumn($event, column)"></Button>
                        <Button class="btn-edit" icon="pi pi-pencil" size="small" severity="secondary" :disabled="!visibleEdit" @click="findCurrentIndexEditColumn($event, column)"></Button>
                        <Button class="btn-edit delete" icon="pi pi-times-circle" size="small" severity="secondary" :disabled="!visibleEdit" @click="deleteColumn($event, column)"></Button>
                    </div>
                </template>
                <template #body="{ data, field }">
                    {{ data[field] }}
                </template>
                <template #editor="{ data, field }">
                    <Textarea v-model="data[field]" autoResize fluid></Textarea>
                </template>
            </Column>
            <Column v-if="this.cells" style="width: 30px;">
                <template #body="{ data }">
                    <Button class="btn-row delete" icon="pi pi-times-circle" size="small" severity="secondary" @click="deleteRow($event, data)"></Button>
                </template>
            </Column>
        </DataTable>
        <div v-else class="no-data-table">
            <img src="../assets/no-data-table.jpg">
            <p>Начните работать с таблицей создав ее первый столбец</p>
        </div>
    </div>
</template>

<script>
import { Button, Column, DataTable, InputText, Textarea, Toast } from 'primevue';
import Dialog from 'primevue/dialog';
import { database } from '@/main';
import { set, ref } from 'firebase/database';

export default {
    data() {
        return {
            visible: false,
            visibleEdit: true,
            newNameColumn: null,
            currentIndexEditColumn: null,
            loading: false,
            userPrompt: "Разбери данные из JSON, проанализируй их и разбей на несколько блоков, собери данные в виде единого текста чтобы это было похоже на документ с несколькими заголовками. Более крупные заголовки раздели не несколько мелких. Например на несколько более мелких смысловых блоков с подтемами. Ответ предоставь в виде JSON файла.",
            donePrompt: null,
            columns: null,
            cells: null,
        };
    },
    methods: {
        onCellEditComplete(event) {
            let { data, newValue, field } = event;
            if (newValue.length > 0) {
                data[field] = newValue;
                } else if (newValue === "") {
                data[field] = "";
                }
                else {
                event.preventDefault();
                }
            set(ref(database, 'dataTable'), this.cells);
        },
        async createColumn() {
            await this.updateData();
            let obj = {
                field: 'column-' + new Date().getTime(),
                header: "Без названия"
            };
            if (this.columns) {
                this.columns.push(obj);
                set(ref(database, 'dataColumns'), this.columns);
            } else {
                this.columns = [];
                this.columns.push(obj);
                set(ref(database, 'dataColumns'), this.columns);
            }   
        },
        findCurrentIndexEditColumn(event, column) {
            this.currentIndexEditColumn = this.columns.findIndex(item => item.field === column.key);
            this.newNameColumn = null;
            this.visible = true 
        },
        safeResultEditColumn() {
            this.columns[this.currentIndexEditColumn].header = this.newNameColumn ? this.newNameColumn : this.newNameColumn = "Без названия"
            this.visible = false;
            set(ref(database, 'dataColumns'), this.columns);
        },
        deleteColumn(event, column){
            let res = confirm("При удалении столбца удалятся все его данные. Удалить столбец?");
            if (res) {
                let indexColumnDataTable = this.columns.findIndex(item => item.field === column.key);
            this.columns.splice(indexColumnDataTable, 1);
            set(ref(database, 'dataColumns'), this.columns);
            } 
        },
        shiftRightColumn(event, column) {
            let indexColumnDataTable = this.columns.findIndex(item => item.field === column.key);
            let copyArrayElem = this.columns[indexColumnDataTable];
            this.columns.splice(indexColumnDataTable, 1);
            this.columns.splice(indexColumnDataTable + 1, 0, copyArrayElem);
            set(ref(database, 'dataColumns'), this.columns);
        },
        shiftLeftColumn(event, column) {
            let indexColumnDataTable = this.columns.findIndex(item => item.field === column.key);
            let copyArrayElem = this.columns[indexColumnDataTable];
            this.columns.splice(indexColumnDataTable, 1);
            this.columns.splice(indexColumnDataTable - 1, 0, copyArrayElem);
            set(ref(database, 'dataColumns'), this.columns);
        },
        async createRow() {
            try{
                await this.updateData();
                let arrKeys = [];
                for (let item of this.columns) {  //перебор массива с объектами чтобы вытащить в отдельный массив названия столбцов которые на данный момент есть в таблице
                    arrKeys.push(item.field)
                }
                const obj = Object.fromEntries(arrKeys.map(key => [key, ""]));  //каждому свойству присваивается пустое значение ""
                obj.id = 'row-' + new Date().getTime();
                if (this.cells) {
                    this.cells.push(obj);
                    set(ref(database, 'dataTable'), this.cells);
                } else {
                    this.cells = [];
                    this.cells.push(obj);
                    set(ref(database, 'dataTable'), this.cells);
                }
            } catch (error) {
                this.showErrorEmptyColumns()
            }
        },
        deleteRow(event, data){
            let res = confirm("При удалении строки удалятся все ее данные. Удалить строку?");
            if (res) {
                let indexRowDataTable = this.cells.findIndex(item => item.id === data.id);
                this.cells.splice(indexRowDataTable, 1);
                set(ref(database, 'dataTable'), this.cells);
            }
        },
        showToastInfo() {
            this.$toast.add({ severity: 'info', summary: 'Дождитесь выполения скрипта AI', detail: `Пожалуйста не переходите на страницу документа пока AI не завершит работу. \n\n Во время работы AI будет временно недоступно редактирование таблицы.`, life: 10000 });
        },
        showToastError(error) {
            this.$toast.add({ severity: 'error', summary: 'WHAAAT!?', detail: `Упс( Что-то пошло не так. Попробуйте снова.`, life: 100000 });
        },
        showToastSuccess() {
            this.$toast.add({ severity: 'success', summary: 'Готово', detail: 'AI успешно закончил все преобразования и теперь можно переходить на страницу документа', life: 10000 });
        },
        showErrorEmptyColumns() {
            this.$toast.add({ severity: 'error', summary: 'Нельзя создать строку без столбцов', detail: "Сначала добавьте столбец в таблицу, только потом сможете создать необходимое количество строк", life: 10000 });
        },
        async updateData() {
            let response = await fetch('https://mwstables-project-case-default-rtdb.firebaseio.com/dataTable.json', {
            method: 'GET'
            });
            let data = await response.json();
            this.cells = data;

            let responseColumns = await fetch('https://mwstables-project-case-default-rtdb.firebaseio.com/dataColumns.json', {
                method: 'GET'
            });
            let dataColumns = await responseColumns.json();
            this.columns = dataColumns
        },
        async runMWS() {
            try {
                this.visibleEdit = false;
                this.loading = true; //включается отображение загрузки на кнопке Ai
                this.showToastInfo(); //показывается всплывающее окно с просьбой дождаться ответа от Ai
                const prompt = this.userPrompt + ' Данные: ' + JSON.stringify(this.cells);

                const mySchema = {
                    name: "Для компонента AppDocument",
                    strict: true, //ответ должен строго соответствовать схеме
                    schema: {
                        type: "object",
                        properties: {
                            data: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        key: {
                                            type: "number",
                                            description: "СТРОГО НЕ ПОВТОРЯЮЩИЕСЯ ЗНАЧЕНИЯ ВО ВСЕМ МАССИВЕ ДАННЫХ. Уникальный идентификатор строго формата 0, по порядку для каждого объекта, где число это порядковый номер текущего объекта в текущем массиве",
                                            nullable: false
                                        },
                                        label: {
                                            type: "string",
                                            description: "Главный заголовок в одно слово который обозначает крупный блок",
                                            nullable: false
                                        },
                                        children: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    key: {
                                                        type: "number",
                                                        description: "СТРОГО НЕ ПОВТОРЯЮЩИЕСЯ ЗНАЧЕНИЯ ВО ВСЕМ МАССИВЕ ДАННЫХ. Уникальный идентификатор строго формата 0-0, по порядку для каждого объекта, где левое число это номер свойства key родительского объекта, правое число это порядковый номер текущего объекта в текущем массиве",
                                                        nullable: false
                                                    },
                                                    label: {
                                                        type: "string",
                                                        description: "Подзаголовок в 2-3 слова который обозначает более мелкое разделение главного заголовка",
                                                        nullable: false
                                                    },
                                                    body: {
                                                        type: "string",
                                                        description: "Содержимое относящееся к подзаголовку",
                                                        nullable: false
                                                    }
                                                },
                                                required: ["key", "label", "body"]
                                            }
                                        }
                                    },
                                    required: ["key", "label", "children"]
                                }
                            }
                        },
                        required: ["data"],
                        additionalProperties: false
                    }
                }  
                let response = await fetch("/mws-api/projects/mws-tables-project-case/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_MWS_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: import.meta.env.VITE_MWS_AI_MODEL,
                        messages: [{role: "user", content: prompt}],
                        response_format: { //добавление "управляемого" запроса по заданной схеме
                            type: "json_schema",
                            json_schema: mySchema
                        }
                        }
                    )
                });
                let data = await response.json();
                let doneText = data.choices[0].message.content;
                let preData = JSON.parse(doneText).data
                set(ref(database, 'dataDocument'), preData);
                this.loading = false; //выключается отображение загрузки на кнопке Ai
                this.visibleEdit = true;
                this.showToastSuccess(); //показывается всплывающее окно с успешным ответом от Ai
            } catch (error) {
                this.visibleEdit = true;
                this.loading = false; //выключается отображение загрузки на кнопке Ai
                this.showToastError(error); //показывается всплывающее окно с ошибкой ответа от Ai
            }
        },
    },
    async created() {
        let response = await fetch('https://mwstables-project-case-default-rtdb.firebaseio.com/dataTable.json', {
            method: 'GET'
        });
        let data = await response.json();
        this.cells = data;

        let responseColumns = await fetch('https://mwstables-project-case-default-rtdb.firebaseio.com/dataColumns.json', {
            method: 'GET'
        });
        let dataColumns = await responseColumns.json();
        this.columns = dataColumns
    },
    components: {
        DataTable,
        Column,
        InputText,
        Textarea,
        Button,
        Toast,
        Dialog
    }
};
</script>

<style scoped>
    .no-data-table {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 85vh;
    }
    .no-data-table img {
        width: 50%;
    }
    .no-data-table p {
        font-size: 1.5rem;
    }
    .wrapper-dialog-button {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
    .btn-dialog {
        margin-left: 10px;
    }
    .wrapper-table {
        display: flex;
        flex-flow: column nowrap;
    }
    .wrapper-table-button {
        display: flex;
        flex-flow: row nowrap;
        justify-content: end;
        padding: 5px;
        margin-bottom: 10px;
        background-color: rgba(211, 211, 211, 0.3);
        border: 1px solid rgb(226, 232, 240);
        border-radius: 6px;
    }
    .wrapper-edit-column-button {
        display: flex;
        margin-left: auto;
        order: 1;
    }
    .btn-table {
        margin: 0px 3px;
        color: rgb(51, 65, 85);
    }
    .btn-edit {
        margin-right: 5px;
    }
    .btn-edit:last-of-type {
        margin-right: 0px;
    }
    .btn-ai {
        margin-right: 1px;
        background-image: linear-gradient(45deg, rgb(96, 165, 250), #a339d5);
        border: 1px solid rgb(96, 165, 250);
    }
    .btn-edit.delete:hover {
        background-color: rgb(239, 68, 68);
    }
    .btn-row.delete:hover {
        background-color: rgb(239, 68, 68);
    }
    .p-inputtext {
        width: 100%;
    }
</style>
