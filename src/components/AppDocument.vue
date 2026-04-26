<template>
    <Toast position="top-center" :base-z-index="1" />
    <Dialog v-model:visible="visible" modal header="Редактирование пункта" :style="{'width': '50vw'}">
            <div v-if="visibleWarningDialog" class="warn-dialog">
                Обратите внимание! Данное поле было изменено другим пользователем. Сейчас у Вас отображаются актуальные данные этого поля с которыми вы можете работать.
            </div>
            <h1>Контент</h1>
            <Textarea class="area-body" v-model="currentDataContent"></Textarea>
        <div class="wrapper-dialog-button">
            <Button class="btn-dialog" type="button" label="Отменить" severity="secondary" @click="visible = false; visibleWarningDialog = false"></Button>
            <Button class="btn-dialog" type="button" label="Сохранить" severity="succsess" @click="safeResultEditItemData"></Button>
        </div>
    </Dialog>
    <Dialog class="recomendation-ai" v-model:visible="visibleRecomendation" modal header="Рекомендации AI" :style="{'width': '50vw'}">
        <h1>Вы можете изменить рекомендации от AI для преобразования в этом поле</h1>
        <Textarea class="area-body" v-model="recomendationResponseAi"></Textarea>
        <h1>Вы можете добавить дополнительные инструкции для преобразования в этом поле</h1>
        <Textarea class="user-area-body" v-model="userAdditionalPrompt"></Textarea>
        <div class="wrapper-dialog-button">
            <Button class="btn-dialog" type="button" label="Понятно, спасибо" severity="secondary" @click="visibleRecomendation = false"></Button>
            <Button class="btn-dialog btn-ai" type="button" label="Переписать документ" severity="help" icon="pi pi-sparkles" :loading="loading" @click="runAdditionalMWS"></Button>
        </div>
    </Dialog>
    <Dialog class="recomendation-ai" v-model:visible="visibleAdditionalUser" modal header="Доработать документ" :style="{'width': '50vw'}">
        <h1>Вы можете добавить инструкции для преобразования в этом поле</h1>
        <Textarea class="user-area-body" v-model="userAdditionalPrompt"></Textarea>
        <div class="wrapper-dialog-button">
            <Button class="btn-dialog" type="button" label="Отменить" severity="secondary" @click="visibleAdditionalUser = false"></Button>
            <Button class="btn-dialog btn-ai" type="button" label="Переписать документ" icon="pi pi-sparkles" :loading="loading" @click="runAdditionalUser"></Button>
        </div>
    </Dialog>
    <div class="wrapper-document-button">
        <Button v-if="visibleSafeResultUserPrompt" class="btn-table" type="button" label="Сохранить результат" @click="safeResultUserPrompt"></Button>
        <Button class="btn-table" type="button" label="Доработать документ"  @click="visibleAdditionalUser = true"></Button>
        <Button class="btn-ai" severity="help" type="button" label="Рекомендации AI" icon="pi pi-sparkles" :loading="loading" @click="runMWS"></Button>
    </div>
    <div class="wrapper-document">
        <div class="tree">
            <div class="toggle">
                <p>Редактировать пункты</p>
                <ToggleSwitch v-model="checked" :disabled="visibleToogle"></ToggleSwitch>
            </div>
            <Tree v-model:selectionKeys="selectedKey" :value="dataDocument" selectionMode="single" class="w-full md:w-[30rem]" @node-select="selectItemTree"></Tree>
        </div>
        <ul class="wrapper-ul"> 
            <li class="wrapper-li" v-for="item in dataDocument" :key="item.key">
                <div class="wrapper-item">
                    <h1 class="caption" :id="item.key">{{ item.label }}</h1>
                    <Button v-if="checked" class="btn-edit" icon="pi pi-pencil" size="small" severity="secondary" @click="editItemData($event, item.label, item.key, 'label')"></Button>
                </div>
                <li class="wrapper-second-li" v-for="item in item.children" :key="item.key">
                    <div class="wrapper-item">
                        <h2 class="caption" :id="item.key">{{ item.label }}</h2>
                        <Button v-if="checked" class="btn-edit" icon="pi pi-pencil" size="small" severity="secondary" @click="editItemData($event, item.label, item.key, 'label')"></Button>
                    </div>
                    <div class="wrapper-item">
                        <p>{{ item.body }}</p>
                        <Button v-if="checked" class="btn-edit" icon="pi pi-pencil" size="small" severity="secondary" @click="editItemData($event, item.body, item.key, 'body')"></Button>
                    </div>
                </li>
            </li>
        </ul>
    </div>
</template>

<script>
import { Button, Dialog, InputText, Textarea, Toast } from 'primevue';
import ToggleSwitch from 'primevue/toggleswitch';
import Tree from 'primevue/tree';
import { database } from '@/main';
import { set, ref } from 'firebase/database';

export default {
    data() {
        return {
            visible: false,
            checked: false,
            loading: false,
            selectedKey: null,
            dataDocument: null,
            preDataDocument: null,
            currentDataKey: null,
            currentDataContent: null,
            currentDataProperty: null,
            visibleToogle: false,
            visibleRecomendation: false,
            visibleAdditionalUser: false,
            visibleWarningDialog: false,
            visibleSafeResultUserPrompt: null,
            recomendationPrompt: "Предоставь профессиональные рекомендации по структуре и наполнению документа, напиши что можно улучшить, каких пунктов возможно не хватает",
            recomendationResponseAi: null,
            userAdditionalPrompt: null,
        }
    },
    components: {
        Button,
        Dialog,
        InputText,
        Textarea,
        Tree,
        ToggleSwitch,
        Toast
    },
    methods: {
        selectItemTree(node) {
            let elem = Array.from(document.querySelectorAll(".caption")).find((item) => item.id == node.key);
            if (elem) {
                elem.scrollIntoView({behavior: "smooth", block: 'start'})
            }
        },
        async editItemData(event, content, key, prop) {
            let cont = content
            await this.updateData();
            this.dataDocument.forEach((item, index) => {
                    if (item.key === key) {
                        cont = item.label
                    } else {
                        item.children.forEach((item, index) => {
                            if (item.key === key & prop == 'label') {
                                cont = item.label
                            } else if (item.key === key & prop == 'body') {
                                cont = item.body
                            }
                        })
                    }
                })
            this.currentDataContent = cont;
            this.currentDataKey = key;
            this.currentDataProperty = prop;     
            this.visible = true;
            if (content != cont) {this.visibleWarningDialog = true}
        },
        safeResultEditItemData() {
            if (this.currentDataContent) {
                let currentProp = this.currentDataProperty
                let firstIndex
                let secondIndex
                this.dataDocument.forEach((item, index) => {
                    firstIndex = index;
                    if (item.key === this.currentDataKey) {
                        this.dataDocument[firstIndex][currentProp] = this.currentDataContent            
                    } else {
                        item.children.forEach((item, index) => {
                            secondIndex = index
                            if (item.key === this.currentDataKey) {
                                this.dataDocument[firstIndex].children[secondIndex][currentProp] = this.currentDataContent
                            }
                        })
                    }
                }
                );
                this.visible = false;
                this.visibleWarningDialog = false;
                set(ref(database, 'dataDocument'), this.dataDocument); 
            } else {
                alert("Контент не может быть пустым!")
            }
        },
        showToastInfo() {
            this.$toast.add({ severity: 'info', summary: 'Дождитесь выполения скрипта AI', detail: `Когда AI завершит работу мы покажем уведомление. \n\n Во время работы AI будет временно недоступно редактирование документа.`, life: 10000 });
        },
        showToastError(error) {
            this.$toast.add({ severity: 'error', summary: 'WHAAAT!?', detail: `Упс( Что-то пошло не так. Попробуйте снова.`, life: 100000 });
        },
        showToastSuccess(message) {
            this.$toast.add({ severity: 'success', summary: 'Готово', detail: message, life: 10000 });
        },
        async updateData() {
            let response = await fetch('https://mwstables-project-case-default-rtdb.firebaseio.com/dataDocument.json', {
            method: 'GET'
            });
            let data = await response.json();
            this.dataDocument = data;
        },
        async runMWS() {
            try {
                this.checked = false;
                this.visibleToogle = true;
                this.loading = true; //включается отображение загрузки на кнопке Ai
                this.showToastInfo(); //показывается всплывающее окно с просьбой дождаться ответа от Ai
                const prompt = this.recomendationPrompt + ' Данные: ' + JSON.stringify(this.dataDocument);
                let response = await fetch("/mws-api/projects/mws-tables-project-case/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${import.meta.env.VITE_MWS_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: import.meta.env.VITE_MWS_AI_MODEL,
                            messages: [{role: "user", content: prompt}],
                            }
                        )
                    });
                    let data = await response.json();
                    let doneText = data.choices[0].message.content;
                    this.recomendationResponseAi = doneText;
                    this.visibleRecomendation = true;
                    this.loading = false; //выключается отображение загрузки на кнопке Ai
                    this.visibleToogle = false;
                    let message = 'AI успешно выполнил задание'
                    this.showToastSuccess(message); //показывается всплывающее окно с успешным ответом от Ai
            } catch(error) {
                this.visibleToogle = false;
                this.loading = false; //выключается отображение загрузки на кнопке Ai
                this.showToastError(error); //показывается всплывающее окно с ошибкой ответа от Ai
            }
        },
        async runAdditionalMWS() {
            try {
                this.checked = false;
                this.visibleToogle = true;
                this.visibleRecomendation = false; //закрывается модальное окно с рекомендациями
                this.loading = true; //включается отображение загрузки на кнопке Ai
                this.showToastInfo(); //показывается всплывающее окно с просьбой дождаться ответа от Ai
                const prompt = `Здесь находятся твои рекомендации по данным которые содержаться в этом запросе: ${this.recomendationResponseAi}.
                                Здесь дополнительные инструкции которые тебе нужно строго выполнить: ${this.userAdditionalPrompt}.
                                Здесь находятся исходные данные с которыми тебе необходимо работать строго соблюдая их структуру: ${JSON.stringify(this.dataDocument)}.
                                Тебе нужно переписать текущие данные строго сохранив их структуру руководствуясь теми инструкциями которые находятся выше в текущем запросе.
                                Ответ нужно предоставить в виде JSON файла СТРОГО соблюдая структуру ответа.`

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
                this.dataDocument = preData

                this.loading = false; //выключается отображение загрузки на кнопке Ai
                let message = `AI успешно закончил все преобразования. \n\n Сохраните изменения нажав кнопку "Сохранить результат" или отмените изменения перезагрузив страницу`
                this.showToastSuccess(message); //показывается всплывающее окно с успешным ответом от Ai
                this.visibleSafeResultUserPrompt = true; //показывается кнопка с сохранением результата Ai после пользовательского промпта
            } catch(error) {
                this.visibleToogle = false;
                this.loading = false; //выключается отображение загрузки на кнопке Ai
                this.showToastError(error); //показывается всплывающее окно с ошибкой ответа от Ai
            }
        },
        async runAdditionalUser() {
            try {
                this.checked = false;
                this.visibleToogle = true;
                this.visibleAdditionalUser = false; //закрывается модальное окно с промтом пользователя
                this.loading = true; //включается отображение загрузки на кнопке Ai
                this.showToastInfo(); //показывается всплывающее окно с просьбой дождаться ответа от Ai
                const prompt = `Инструкция: ${this.userAdditionalPrompt}.
                                Данные для работы: ${JSON.stringify(this.dataDocument)}
                                Тебе нужно переписать текущие данные строго сохранив их структуру руководствуясь теми инструкциями которые находятся выше в текущем запросе.
                                Ответ нужно предоставить в виде JSON файла СТРОГО соблюдая структуру ответа.`

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
                                            description: "Уникальный идентификатор строго формата 0, по порядку для каждого объекта, где число это порядковый номер текущего объекта в текущем массиве",
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
                                                        description: "Уникальный идентификатор строго формата 0-0, по порядку для каждого объекта, где левое число это номер свойства key родительского объекта, правое число это порядковый номер текущего объекта в текущем массиве",
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
                this.dataDocument = preData

                this.loading = false; //выключается отображение загрузки на кнопке Ai
                let message = `AI успешно закончил все преобразования. \n\n Сохраните изменения нажав кнопку "Сохранить результат" или отмените изменения перезагрузив страницу`
                this.showToastSuccess(message); //показывается всплывающее окно с успешным ответом от Ai
                this.visibleSafeResultUserPrompt = true; //показывается кнопка с сохранением результата Ai после пользовательского промпта
            } catch(error) {
                this.visibleToogle = false;
                this.loading = false; //выключается отображение загрузки на кнопке Ai
                this.showToastError(error); //показывается всплывающее окно с ошибкой ответа от Ai
            }
        },
        safeResultUserPrompt() {
            set(ref(database, 'dataDocument'), this.dataDocument);
            this.visibleSafeResultUserPrompt = false;
            this.visibleToogle = false;
            let message = "Измененеия сохранены"
            this.showToastSuccess(message);
        },
    },
    watch: {
        userAdditionalPrompt(value) {
            localStorage.setItem("userAdditionalPrompt", value)
        },
    },
    async created() {
        let response = await fetch('https://mwstables-project-case-default-rtdb.firebaseio.com/dataDocument.json', {
            method: 'GET'
        });
        let data = await response.json();
        this.dataDocument = data;
        
        this.userAdditionalPrompt ? "" || null : this.userAdditionalPrompt = localStorage.getItem("userAdditionalPrompt") 
    }
}
</script>

<style scoped>
    .warn-dialog {
        width: 100%;
        margin: 10px auto;
        padding: 20px;
        border-radius: 10px;
        background-color: #08de1a68;
    }
    .btn-ai {
        margin-right: 1px;
        background-image: linear-gradient(45deg, rgb(96, 165, 250), #a339d5);
        border: 1px solid rgb(96, 165, 250);
    }
    .toggle {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: rgba(211, 211, 211, 0.3);
        border-radius: 6px;
        margin: 10px;
    }
    .toggle p {
        margin: 15px 0px;
        margin-right: 5px;
    }
    .area-label {
        width: 100%;
    }
    .area-body {
        height: 35vh;
        width: 100%;
    }
    .user-area-body {
        height: 15vh;
        width: 100%;
    }
    .btn-edit {
       height: 28px;
       margin: auto 10px;
    }
    .tree {
        border: 1px solid rgb(226, 232, 240);
        border-radius: 6px;
        min-width: 300px;
        max-width: 300px;
    }
    .wrapper-document {
        display: flex;
        flex-flow: row nowrap;
        position: fixed;
        height: 86vh;
        margin-right: 8px;
    }
    .p-tree {
        padding: 5px;
        height: 76vh;
        overflow: scroll;
    }
    .wrapper-ul {
        list-style: none;
        margin: 0;
        padding: 0;
        margin-left: 10px;
        padding-left: 10px;
        border: 1px solid rgb(226, 232, 240);
        border-radius: 6px;
        overflow: scroll;
    }
    .wrapper-second-li {
        margin-left: 20px;
    }
    .wrapper-li:nth-child(1n+1) {
        margin: 10px;
    }
    h1.caption {
        font-size: 1.2rem;
    }
    p {
        margin-top: 2px;
    }
    .wrapper-item {
       display: flex;
    }
    .wrapper-dialog-button {
        display: flex;
        justify-content: flex-end;
        margin-top: 20px;
    }
    .btn-dialog {
        margin-left: 10px;
    }
    .wrapper-document-button {
        display: flex;
        flex-flow: row nowrap;
        justify-content: end;
        padding: 5px;
        margin-bottom: 10px;
        background-color: rgba(211, 211, 211, 0.3);
        border: 1px solid rgb(226, 232, 240);
        border-radius: 6px;
    }
    .btn-table {
        margin: 0px 3px;
        color: rgb(51, 65, 85);
    }
</style>