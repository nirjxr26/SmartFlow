import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-primary-foreground font-bold">SR</span>
        </div>
        <p className="text-muted-foreground">Loading SmartFlow...</p>
      </div>
    </div>
  );
};

export default Index;