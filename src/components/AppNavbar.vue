<template>
    <div class="card">
        <Menubar :model="items" @click="clicklLabel"/>
    </div>
</template>

<script>
import { Menubar } from 'primevue';

export default {
    data() {
        return {
            items: [
                {
                    label: 'Документ',
                    icon: 'pi pi-objects-column'
                },
                {
                    label: 'Таблица',
                    icon: 'pi pi-table'
                }
            ]
        };
    },
    methods: {
        clicklLabel(event){
            if (event.target.textContent === "Таблица") {
                this.$router.push('/table')
            } else if (event.target.textContent === "Документ") {
                this.$router.push('/document')
            }
        },
    },
    components: {
        Menubar,
    }
};
</script>

<style scoped>
    .p-menubar{
        justify-content: center;
    }
</style>
