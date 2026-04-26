<template>
    <Toast position="top-center" :base-z-index="1" />
    <div class="wrapper">
        <div class="wrapper-icon">
            <p>от команды</p>
            <img src="../assets/icon-code-ai.png"/>
            <p>для MWS Tables</p>
        </div>
        <form id="loginForm" class="form">
            <div class="field">
                <label for="email">Логин</label>
                <InputText id="email" v-model="userEmail"  />
                <Message size="small" severity="secondary" variant="simple">введите email</Message>
            </div>
            <div class="field">
                <label for="password">Пароль</label>
                <Password class="pwd" :overlayStyle="isLoginOrRegistration ? 'display: none' : false" v-model="userPassword" inputId="password" promptLabel="Введите пароль" weakLabel="Подумайте еще" mediumLabel="Уже хороший пароль" strongLabel="Уровень Сноудена" toggleMask />
                <Message size="small" severity="secondary" variant="simple">минимум 6 знаков</Message>
            </div>
  
            <div v-if="!isLoginOrRegistration">
                <div class="field">
                    <label for="firstName">Имя</label>
                    <InputText id="firstName" v-model="userFirstName"  />
                    <Message size="small" severity="secondary" variant="simple">введите имя</Message>
                </div>
                <div class="field">
                    <label for="lastName">Фамилия</label>
                    <InputText id="lastName" v-model="userLastName"  />
                    <Message size="small" severity="secondary" variant="simple">введите фамилию</Message>
                </div>
            </div>

            <div v-if="isLoginOrRegistration" class="wrapper-button">
                <Button class="btn-login" @click.prevent="logIn" severity="secondary">Войти</Button>
                <a @click.prevent="isLoginOrRegistration = !isLoginOrRegistration" href="#">Зарегистрироваться</a> 
                <a @click.prevent="resetPassword" href="#">Сброс пароля</a>
            </div>

            <div v-else class="wrapper-button">
                <Button class="btn-login" @click.prevent="signIn" severity="secondary">Зарегистрироваться</Button>
                <a @click.prevent="isLoginOrRegistration = !isLoginOrRegistration" href="#">Войти в систему</a> 
            </div>                                        
                                                                              
        </form>
    </div>

</template>

<script>
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail} from "firebase/auth";
import { ref, set } from "firebase/database";
import { database, auth } from "../main"
import { Button, IftaLabel, InputText, Message, Password, Toast } from "primevue";

export default {
    data(){
        return {
            userEmail: "",
            userPassword: "",
            userFirstName: "",
            userLastName: "",
            isLoginOrRegistration: true,
        }
    },
    methods: {
        async signIn(){
            let email = this.userEmail;
            let password = this.userPassword;
            await createUserWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        this.$router.push("/");
                        const user = userCredential.user;
                    })
                    .catch((error) => {
                        let message = 'Неверный логин или пароль. Email должен быть заполнен по шаблону user@mail.domain например - ivan@yandex.ru'
                        this.showToastError(message)
                    });
            let currentUser = await auth.currentUser.uid;
            set(ref(database, 'users/' + currentUser), {
                login: this.userEmail,
                id: currentUser,
                firstName: this.userFirstName,
                lastName: this.userLastName,
                isAdmin: false
            });
        },
        async logIn() {
            let email = this.userEmail;
            let password = this.userPassword;
            await signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    this.$router.push("/");
                    const user = userCredential.user;
                })
                .catch((error) => {   
                    let message = 'Неверный логин или пароль. Попробуйте еще раз. Если логин вводите правильно, то рекомендуем сбросить пароль через "Сброс пароля"'
                    this.showToastError(message)
                });     
        },
        resetPassword() {
            let email = this.userEmail;
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    let message = `Ссылка на сброс пароля отправлена на указанный email - ${email}.`
                    this.showToastSuccess(message)
                })
                .catch((error) => {
                    let message = `Неверный формат email. Проверьте ввод и повторите попытку. \n\n Пример формата - ivan@yandex.ru`
                    this.showToastError(message)
                });
        },
        showToastError(error) {
            this.$toast.add({ severity: 'error', summary: 'WHAAAT!?', detail: error, life: 100000 });
        },
        showToastSuccess(message) {
            this.$toast.add({ severity: 'success', summary: 'Готово', detail: message, life: 5000 });
        },
    },
    components:{
        InputText,
        Password,
        IftaLabel,
        Message,
        Button,
        Toast
    }
}
</script>

<style scoped>
* {
    font-size: 14px;
    box-sizing: border-box;
}
label {
    font-weight: 500;
}
.wrapper-icon img {
    width: 200px;
}
.wrapper-icon p {
    margin: 0;
    padding: 0;
    color: lightgray;
    font-size: 0.8rem;
}
.wrapper-icon {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    margin-bottom: 40px;
}
.p-password{
    width: 100%;
}
.wrapper {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    height: 98vh;
    min-height: 300px;
}
.wrapper-button {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
}
#loginForm {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    width: 300px;
    padding: 35px;
    border-radius: 30px;
    box-shadow: 0px 0px 35px rgba(70, 71, 71, 0.22);
    transition-property: box-shadow;
    transition-duration: 3s;
    transition-timing-function: ease-in-out;
}
.form {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center; 
} 
.field {
    margin-bottom: 10px;
    width: 100%;
}
input{
    margin: 5px 0px;
    width: 100%;
}
.btn-login{
    margin: 10px 0px;
    background-color: rgb(96, 165, 250);
}
#loginForm:hover {
    box-shadow: 0px 0px 25px rgb(96, 165, 250);
}
.p-inputwrapper {
    display: grid;
}
.pwd {
    margin: 5px 0px;
}
</style>