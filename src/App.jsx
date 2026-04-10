import { useEffect, useRef, useState } from "react";
import LoadingPage from "./components/LoadingPage";
import MainPage from "./components/MainPage";
import TermsPage from "./components/TermsPage";
import { claimDiscount } from "./js/claimDiscount";

const MOBILE_MAX_WIDTH = 480;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

function App() {
  const [code, setCode] = useState(null);
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [translateY, setTranslateY] = useState(100);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showMain, setShowMain] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [goToLoading, setGoToLoading] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });
  const claimDiscountPromiseRef = useRef(null);
  const sectionsRef = useRef(null);

  const scrollToY = (vh) => setTranslateY(vh);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleMobileChange = (event) => {
      setIsMobileDevice(event.matches);
    };

    setIsMobileDevice(mobileQuery.matches);

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", handleMobileChange);
      return () => mobileQuery.removeEventListener("change", handleMobileChange);
    }

    mobileQuery.addListener(handleMobileChange);
    return () => mobileQuery.removeListener(handleMobileChange);
  }, []);

  useEffect(() => {
    const handleAssetsLoaded = () => {
      setAssetsLoaded(true);
    };

    if (document.readyState === "complete") {
      handleAssetsLoaded();
      return undefined;
    }

    window.addEventListener("load", handleAssetsLoaded);
    return () => window.removeEventListener("load", handleAssetsLoaded);
  }, []);

  useEffect(() => {
    if (!isMobileDevice) {
      return undefined;
    }

    let isCancelled = false;

    if (!claimDiscountPromiseRef.current) {
      claimDiscountPromiseRef.current = claimDiscount();
    }

    claimDiscountPromiseRef.current.then((result) => {
      if (isCancelled) {
        return;
      }

      if (result.error) {
        setHasError(true);
        setMessage(result.error);
        return;
      }

      setCode(result.code);
      setPrice(result.price);
      setMessage("");
      setDataLoaded(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [isMobileDevice]);

  useEffect(() => {
    if (isMobileDevice) {
      return;
    }

    setTranslateY(100);
    setInitialLoad(true);
    setShowMain(true);
    setShowTerms(false);
    setShowLoading(true);
    setGoToLoading(false);
  }, [isMobileDevice]);

  useEffect(() => {
    if (isMobileDevice && !hasError && dataLoaded && assetsLoaded && initialLoad) {
      const timeoutId = window.setTimeout(() => {
        scrollToY(0);
        setInitialLoad(false);
      }, 100 );

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [assetsLoaded, dataLoaded, hasError, initialLoad, isMobileDevice]);

  useEffect(() => {
    const handleTransitionEnd = () => {
      if (translateY === 220 && goToLoading) {
        setShowMain(false);
        setShowTerms(false);
        setTranslateY(200);
        setGoToLoading(false);
      }

      if (translateY === 0 && !initialLoad && isMobileDevice) {
        setShowTerms(true);
        setShowLoading(false);
      }
    };

    const node = sectionsRef.current;
    node?.addEventListener("transitionend", handleTransitionEnd);

    return () => node?.removeEventListener("transitionend", handleTransitionEnd);
  }, [goToLoading, initialLoad, isMobileDevice, translateY]);

  const handleMainClick = () => {
    if (translateY === 78) {
      scrollToY(0);
    }
  };

  const handleTransitionToLoading = () => {
    setShowLoading(true);
    setGoToLoading(true);

    window.setTimeout(() => {
      scrollToY(200);
    }, 600);

    window.setTimeout(() => {
      window.location.href = "https://www.instagram.com/shaffers.co/";
    }, 1500);
  };

  return (
    <div className="app">
      <div
        className="sections"
        ref={sectionsRef}
        style={{ transform: `translateY(-${translateY}svh)` }}
      >
        {showMain && (
          <MainPage
            onClick={handleMainClick}
            onScroll={() => scrollToY(78)}
            code={code}
            price={price}
          />
        )}
        {showTerms && <TermsPage onGoToLoading={handleTransitionToLoading} />}
        {showLoading && (
          <LoadingPage
            message={hasError ? message : ""}
            desktopNotice={!isMobileDevice}
          />
        )}
      </div>
    </div>
  );
}

export default App;
