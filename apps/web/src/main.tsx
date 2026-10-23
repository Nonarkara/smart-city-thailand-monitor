import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
const isPlacePilot =
  location.pathname.endsWith("/places") ||
  location.pathname.endsWith("/places/");
const App = lazy(async () => {
  if (isPlacePilot) return import("./places/PlaceFitPage");
  await import("./styles.css");
  return import("./App");
});
import AppErrorBoundary from "./AppErrorBoundary";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppErrorBoundary>
          <Suspense fallback={<p>Opening Bangkok…</p>}>
            <App />
          </Suspense>
        </AppErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
