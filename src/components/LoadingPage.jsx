import Button from "./Button";
function LoadingPage({ message, desktopNotice = false }) {
    return (
      <section className="section loading-page">
        <div className="loading-page-content">
          <div className="loading-page-logo">
          </div>

          {desktopNotice ? (
            <Button type="button" className="desktop-only-button">
              disponible solo para celulares
            </Button>
          ) : null}
        </div>

        {message && !desktopNotice ? (
          <div className="error-msj">
            <Button type="button">{message}</Button>
          </div>
        ) : null}
      </section>
    );
  }
  
  export default LoadingPage;
