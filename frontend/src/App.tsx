import { Navigate, Outlet } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./context/AuthContext";
import styles from "./App.module.css";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.loading}>
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
