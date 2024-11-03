import React from 'react';
import NavBar from './NavBar';
import styles from './Layout.module.css';

function Layout({ children }) {
  return (
    <div className={styles.container}>
      <NavBar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
