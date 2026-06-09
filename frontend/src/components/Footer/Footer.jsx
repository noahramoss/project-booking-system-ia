import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p>© {new Date().getFullYear()} BookingSys - Noah Ramos González. Todos los derechos reservados.</p>
        <div className={styles.links}>
          <a href="#">Términos de servicio</a>
          <a href="#">Privacidad</a>
          <a href="#">Contacto</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
