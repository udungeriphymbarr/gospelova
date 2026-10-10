function LoadingState({ message = "Loading...", fullPage = false }) {
  return (
    <div
      className={`loading-state${fullPage ? " loading-state--page" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <span className="loading-state__spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export default LoadingState;
