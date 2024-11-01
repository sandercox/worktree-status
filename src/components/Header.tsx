import React from "react";

import styles from "./header.module.css";

export const Header: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <>
            <header className={styles.header + " " + styles.headerNormal}>
                <h1>{children}</h1>
            </header>
            <header className={styles.header}>
                <h1>{children}</h1>
            </header>
        </>
    );
};

export default Header;