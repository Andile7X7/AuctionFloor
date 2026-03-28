import styles from '../Modules/SignUpHeader.module.css'
import { IoLogoStencil } from "react-icons/io5";

function SignUpHeader({setIsLogin}){
    return(
        <>
        <div className={styles.Header}>
            <IoLogoStencil size={40} id={styles.Logo}/>
            <div className={styles.Nav}>
            <span id={styles.LogIn} onClick={()=>setIsLogin(true)}>Login</span>
            <span id={styles.Register} onClick={()=>setIsLogin(false)}>Register</span>
            </div>
        </div>
        </>
    )
}

export default SignUpHeader