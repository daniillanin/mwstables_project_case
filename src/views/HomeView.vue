<template>
  <div class="wrapper-home">
    <AppNavbar class="main"></AppNavbar>
    <Button label="Выйти" severity="secondary" icon="pi pi-user" @click="logOut"></Button>
  </div>
  <div class="layout">
    <RouterView></RouterView>
  </div>
</template>
  
<script>
import { RouterView } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import { Button } from 'primevue';

import { auth } from "../main.js";
import { signOut } from "firebase/auth";

export default {
  data() {
    return {
    }
  },
  methods: {
    async logOut() {
            await signOut(auth)
            .then(() => {
              this.$router.push("/login")
            })
            .catch((error) => {
            });
        }
  },
  components: {
    AppNavbar,
    Button,
  }
}
</script>

<style>
  .wrapper-home{
    display: flex;
    flex-flow: row nowrap;
  }
  .main{
    flex: 1 1 80%;
    margin-right: 10px;
  }
  .main{
    flex: 1 1 10%;
  }
  .layout{
    margin: 10px 0px;
  }
</style>


