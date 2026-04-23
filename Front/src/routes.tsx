import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { Home } from "./pages/Home";
import { DashboardPage } from "./pages/DashboardPage";
import { CheckoutSucesso } from "./pages/CheckoutSucesso";
import { CheckoutCancelado } from "./pages/CheckoutCancelado";
import { authService } from "./services/authService";

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { username } = useParams<{ username: string }>();
  const user = authService.getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Username da URL tem que bater com o usuário logado
  if (username && username.toLowerCase() !== user.username.toLowerCase()) {
    return <Navigate to={`/${user.username}`} replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    // Landing page pública
    path: "/",
    element: authService.isAuthenticated()
      ? <Navigate to={`/${authService.getStoredUser()?.username}`} replace />
      : <LandingPage />,
  },
  {
    // Mapa interativo (app principal)
    path: "/app",
    element: <Home />,
  },
  {
    // Dashboard do organizador — requer autenticação
    path: "/dashboard",
    element: authService.isAuthenticated()
      ? <DashboardPage />
      : <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: authService.isAuthenticated()
      ? <Navigate to={`/${authService.getStoredUser()?.username}`} replace />
      : <LoginPage />,
  },
  {
    path: "/:username/*",
    element: (
      <RotaProtegida>
        <Home />
      </RotaProtegida>
    ),
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/checkout/sucesso",
    element: <CheckoutSucesso />,
  },
  {
    path: "/checkout/cancelado",
    element: <CheckoutCancelado />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
