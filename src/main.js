import './assets/main.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes';
import ToastService from 'primevue/toastservice';

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { initializeApp } from 'firebase/app';
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY_FIREBASE,
    authDomain: "mwstables-project-case.firebaseapp.com",
    databaseURL: "https://mwstables-project-case-default-rtdb.firebaseio.com",
    projectId: "mwstables-project-case",
    storageBucket: "mwstables-project-case.firebasestorage.app",
    messagingSenderId: "907762919141",
    appId: "1:907762919141:web:6ce7c22adf51fe78fd160c"
}

const firebaseApp = initializeApp(firebaseConfig, "mws-case-dmlanin");     
export const database = getDatabase(firebaseApp);
export const auth = getAuth(firebaseApp);

let MyPresetStyle = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{blue.400}',
                    inverseColor: '#ffffff',
                    hoverColor: '{blue.200}',
                    activeColor: '{blue.400}'
                },
                highlight: {
                    background: '{blue.400}',
                    focusBackground: '{blue.400}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                }
            }
        }
    }
})

let app
auth.onAuthStateChanged((user) => {
    if(!app) {
        app = createApp(App)
        .use(router)
        .use(PrimeVue, {
            theme: {
                preset: MyPresetStyle,
                options: {
                    darkModeSelector: false,
            }
            }
        })
        .use(ToastService)
        .mount('#app')
    } 
    if(user) {
        console.log("Активная сессия пользователя: " + user.uid + "  " + user.email);
        
    } else {
        console.log("Нет активной сессии");
    }
})