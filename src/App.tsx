import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { initDatabase } from "@/lib/db";

function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-4 text-red-500">Σφάλμα βάσης δεδομένων: {error}</div>;
  if (!ready) return <div className="p-4">Φόρτωση...</div>;

  return <AppLayout />;
}
export default App;
