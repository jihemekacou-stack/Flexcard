import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { QrCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { API, LOGO_URL, AuthContext } from "./App";

// Card Scanner - Redirects based on card status
const CardScanner = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkCard = async () => {
      try {
        const response = await axios.get(`${API}/cards/${cardId}`);
        const { status, redirect_to } = response.data;
        
        if (status === "activated" && redirect_to) {
          // Card is activated, redirect to profile
          navigate(redirect_to, { replace: true });
        } else {
          // Card not activated, redirect to activation page
          navigate(`/activate/${cardId}`, { replace: true });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Cette carte n'existe pas.");
        } else {
          setError("Erreur lors de la vérification de la carte.");
        }
        setLoading(false);
      }
    };
    
    checkCard();
  }, [cardId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-heading mb-2">Carte invalide</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Vérification de la carte...</p>
      </div>
    </div>
  );
};

// Card Activation Page
const CardActivation = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [cardStatus, setCardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkCard = async () => {
      try {
        const response = await axios.get(`${API}/cards/${cardId}`);
        setCardStatus(response.data);
        
        if (response.data.status === "activated") {
          // Already activated, redirect to profile
          navigate(response.data.redirect_to, { replace: true });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Cette carte n'existe pas.");
        } else {
          setError("Erreur lors de la vérification de la carte.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkCard();
  }, [cardId, navigate]);

  const handleActivate = async () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/activate/${cardId}`;
      navigate(`/login?return=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setActivating(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API}/cards/${cardId}/activate`,
        {}
      );
      
      setSuccess(true);
      
      // Redirect to profile after 2 seconds
      setTimeout(() => {
        navigate(`/u/${response.data.profile_username}`);
      }, 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        const returnUrl = `/activate/${cardId}`;
        navigate(`/login?return=${encodeURIComponent(returnUrl)}`);
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || "Cette carte est déjà activée.");
      } else {
        setError("Erreur lors de l'activation de la carte.");
      }
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !cardStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-heading mb-2">Carte invalide</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold font-heading mb-2">Carte activée !</h1>
              <p className="text-muted-foreground mb-4">
                Votre carte FlexCard est maintenant liée à votre profil.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirection vers votre profil...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-subtle px-4" data-testid="card-activation">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <img src={LOGO_URL} alt="FlexCard" className="w-12 h-12 object-contain" />
            </Link>
            <CardTitle className="text-2xl">Activez votre carte</CardTitle>
            <CardDescription>
              Liez cette carte physique à votre profil FlexCard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Card ID Display */}
            <div className="bg-muted/50 rounded-2xl p-6 text-center">
              <QrCode className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">ID de la carte</p>
              <p className="text-2xl font-mono font-bold">{cardId}</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            {user ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Connecté en tant que <strong>{user.name}</strong>
                  </p>
                </div>
                <Button 
                  variant="gradient" 
                  className="w-full" 
                  size="lg"
                  onClick={handleActivate}
                  disabled={activating}
                  data-testid="activate-card-btn"
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Activation en cours...
                    </>
                  ) : (
                    "Activer cette carte"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Connectez-vous ou créez un compte pour activer votre carte.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/login?return=${encodeURIComponent(`/activate/${cardId}`)}`)}
                  >
                    Connexion
                  </Button>
                  <Button 
                    variant="gradient"
                    onClick={() => navigate(`/register?return=${encodeURIComponent(`/activate/${cardId}`)}`)}
                  >
                    Créer un compte
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                En savoir plus sur FlexCard
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export { CardScanner, CardActivation };
