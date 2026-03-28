import styles from '../Pages/SignUpPage.module.css'
import Form from '../Modules/SignUpForm'  
import Login from '../Modules/LogInForm'
import SignUpHeader from '../Modules/SignUpHeader'
import AuthPage from '../Pages/AuthPage'
import { useState } from 'react'

function SignUpPage(){

    const [isLogin,setIsLogin] = useState(false)

    return(
        <>
        <SignUpHeader setIsLogin={setIsLogin}/>
        <AuthPage isLogin={isLogin}/>

        </>
    )
}

export default SignUpPage