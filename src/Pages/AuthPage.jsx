import React, { useState } from 'react';
import SignUpHeader from '../Modules/SignUpHeader';
import SignUpPage from './SignUpPage';
import SignUp from '../Modules/SignUpForm';
import Login from '../Modules/LogInForm';


function AuthPage({isLogin}){
     
    return(
        <>
        {isLogin ? <Login/> : <SignUp/>}
        </>
    )

}

export default AuthPage