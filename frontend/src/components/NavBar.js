import { Link, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import logo from "../images/reco2.png";

const NavBar = ({ children }) => {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logoContainer}>
          <Link to="/">
            <img src={logo} alt="Logo" className="responsive-image" />
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link
            to="/"
            className={`${styles.navLink} ${
              location.pathname === "/" ? styles.activeNavLink : ""
            }`}
          >
            Search
          </Link>
          <Link
            to="/favorites"
            className={`${styles.navLink} ${styles.mobileOnlyNav} ${
              location.pathname === "/favorites" ? styles.activeNavLink : ""
            }`}
          >
            Favorites
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
