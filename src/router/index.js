import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AppTable from '@/components/AppTable.vue'
import AppDocument from '@/components/AppDocument.vue'
import LoginView from '@/views/LoginView.vue'
import { auth } from '../main.js'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/table',
      name: 'home',
      component: HomeView,
      meta: {
        requiredAuth: true,
        isAdmin: false
      },
      children: [
        {
          path: '/table',
          name: 'table',
          component: AppTable,
          meta: {
            requiredAuth: true,
            isAdmin: false
          }
        },
        {
          path: '/document',
          name: 'document',
          component: AppDocument,
          meta: {
            requiredAuth: true,
            isAdmin: false
          }
        },
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
            requiredAuth: false,
            isAdmin: false
        }
    },
  ],
})

router.beforeEach(async (to, from) => {
    let user = auth.currentUser;
    let require = to.matched.some(item => item.meta.requiredAuth);

    let admin = to.matched.some(item => item.meta.isAdmin);
    //проверка на права админа
    // let userAdmin
    // if (user) {
    //   let currentUser = user.uid;
    //   let response2 = await fetch(`https://mwstables-project-case-default-rtdb.firebaseio.com/users/${currentUser}.json`);
    //   let data2 = await response2.json();
    //   userAdmin = data2.isAdmin;
    // }

    if(require && !user) {              //если страница требует аутентификации и пользователь не в системе
        return "/login"
    }
    // else if(admin && !userAdmin) {      //если страница требует права админа и пользователь не админ
    //     next("/table")
    // }
    else {
        return true // true разрешает любой переход
    }
})

export default router
