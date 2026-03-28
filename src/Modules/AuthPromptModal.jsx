import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AuthPromptModal.module.css';
import { FaLock } from 'react-icons/fa';

const AuthPromptModal = ({ message, onClose }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <FaLock className={styles.lockIcon} />
        </div>

        <h2 className={styles.title}>Members Only</h2>
        <p className={styles.message}>{message || 'You need to be logged in to do that.'}</p>

        <div className={styles.actions}>
          <button className={styles.loginBtn} onClick={() => navigate('/signup')}>
            Log In / Sign Up
          </button>
          <button className={styles.cancelBtn} onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;
