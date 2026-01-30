import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { QrCode, CheckCircle2, AlertCircle, User, Phone, Mail, MessageCircle, Download, Share2, ExternalLink, Globe, MapPin } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { API, BACKEND_URL, LOGO_URL, AuthContext, socialPlatforms } from "./App";

// Loading Spinner Component
const LoadingSpinner = ({ message = "Chargement..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
    <div className="text-center p-8">
      <img src={LOGO_URL} alt="FlexCard" className="w-16 h-16 mx-auto mb-6 drop-shadow-lg" />
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Card Scanner - Shows profile or activation page based on card status
const CardScanner = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkCard = async () => {
      try {
        // First check card status
        const cardResponse = await axios.get(`${API}/cards/${cardId}`);
        const { status, redirect_to, username } = cardResponse.data;
        
        if (status === "activated" && username) {
          // Card is activated, fetch the profile
          try {
            const profileResponse = await axios.get(`${API}/public/${username}`);
            setProfileData(profileResponse.data);
            setCardData({ status: "activated", username });
          } catch (profileErr) {
            setError("Profil non trouvé");
          }
        } else {
          // Card not activated
          setCardData({ status: "unactivated", cardId: cardId.toUpperCase() });
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Aucun profil trouvé");
        } else {
          setError("Erreur lors de la vérification");
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkCard();
  }, [cardId]);

  const handleLinkClick = (link) => {
    if (profileData?.profile?.username) {
      axios.post(`${API}/public/${profileData.profile.username}/click/${link.link_id}`).catch(() => {});
    }
    let url = link.url;
    if (url && !url.startsWith("http")) {
      url = `https://${url}`;
    }
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSaveContact = () => {
    if (!profileData?.profile) return;
    const { profile, links } = profileData;
    
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || "Contact";
    
    let vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${displayName}`,
      `N:${profile.last_name || ""};${profile.first_name || ""};;;`,
    ];
    
    if (profile.title) vcardLines.push(`TITLE:${profile.title}`);
    if (profile.company) vcardLines.push(`ORG:${profile.company}`);
    
    if (profile.emails?.length > 0) {
      profile.emails.forEach(email => {
        vcardLines.push(`EMAIL:${email.value}`);
      });
    }
    
    if (profile.phones?.length > 0) {
      profile.phones.forEach(phone => {
        vcardLines.push(`TEL:${phone.value}`);
      });
    }
    
    if (profile.location) vcardLines.push(`ADR:;;${profile.location};;;;`);
    if (profile.bio) vcardLines.push(`NOTE:${profile.bio.replace(/\n/g, "\\n")}`);
    
    vcardLines.push("END:VCARD");
    
    const blob = new Blob([vcardLines.join("\r\n")], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${displayName.replace(/\s+/g, "_")}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: profileData?.profile?.title || "FlexCard", url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAvatarUrl = (profile) => {
    if (!profile?.avatar) return null;
    if (profile.avatar.startsWith("http")) return profile.avatar;
    return `${BACKEND_URL}${profile.avatar}`;
  };

  const getCoverUrl = (profile) => {
    if (profile?.cover_type === "color") return null;
    if (!profile?.cover_image) return null;
    if (profile.cover_image.startsWith("http")) return profile.cover_image;
    return `${BACKEND_URL}${profile.cover_image}`;
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Vérification de la carte..." />;
  }

  // Error state - Card not found
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-heading mb-2">Aucun profil trouvé</h1>
            <p className="text-muted-foreground mb-6">
              Cette carte n'est pas encore associée à un profil FlexCard.
            </p>
            <div className="space-y-3">
              <Button variant="gradient" className="w-full" asChild>
                <Link to="/register">Créer mon profil</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Card not activated - Show activation prompt
  if (cardData?.status === "unactivated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading mb-2">Carte FlexCard</h1>
            <p className="text-muted-foreground mb-2">
              Code: <span className="font-mono font-bold text-foreground">{cardData.cardId}</span>
            </p>
            <p className="text-muted-foreground mb-6">
              Cette carte n'est pas encore activée. Connectez-vous ou créez un compte pour l'activer.
            </p>
            <div className="space-y-3">
              <Button variant="gradient" className="w-full" asChild>
                <Link to={`/login?return=/activate/${cardData.cardId}`}>Se connecter</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/register?return=/activate/${cardData.cardId}`}>Créer un compte</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Card activated - Show profile
  if (profileData) {
    const { profile, links } = profileData;
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || "Utilisateur";
    const avatarUrl = getAvatarUrl(profile);
    const coverUrl = getCoverUrl(profile);
    const primaryEmail = profile.emails?.[0]?.value;
    const primaryPhone = profile.phones?.[0]?.value;

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="card-profile">
        <div className="max-w-md mx-auto">
          {/* Card Header with Cover */}
          <div className="bg-card rounded-b-3xl overflow-hidden shadow-xl">
            {/* Cover */}
            <div 
              className="h-32 relative"
              style={{ 
                backgroundColor: profile.cover_color || "#8645D6",
                backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />

            {/* Profile Info */}
            <div className="px-6 pb-6 -mt-12 relative">
              <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden mx-auto bg-muted">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <h1 className="text-2xl font-bold font-heading">{displayName}</h1>
                {profile.title && <p className="text-muted-foreground">{profile.title}</p>}
                {profile.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}
                {profile.location && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </p>
                )}
              </div>

              {profile.bio && (
                <p className="text-center text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
                  {profile.bio}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 mt-6">
                <Button variant="gradient" className="flex-1" onClick={handleSaveContact} data-testid="save-contact-btn">
                  <Download className="w-4 h-4 mr-2" /> Enregistrer
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShare} data-testid="share-btn">
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {copied ? "Copié !" : "Partager"}
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center gap-4 mt-6">
                {primaryPhone && (
                  <Button size="icon" variant="outline" className="rounded-full w-12 h-12"
                    onClick={() => window.open(`tel:${primaryPhone}`)}>
                    <Phone className="w-5 h-5" />
                  </Button>
                )}
                {primaryEmail && (
                  <Button size="icon" variant="outline" className="rounded-full w-12 h-12"
                    onClick={() => window.open(`mailto:${primaryEmail}`)}>
                    <Mail className="w-5 h-5" />
                  </Button>
                )}
                {primaryPhone && (
                  <Button size="icon" variant="outline" className="rounded-full w-12 h-12"
                    onClick={() => window.open(`https://wa.me/${primaryPhone.replace(/\D/g, "")}`)}>
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          {links && links.length > 0 && (
            <div className="mt-6 px-4 space-y-3 pb-8">
              {links.map((link) => {
                const platform = socialPlatforms.find(p => p.id === link.platform);
                return (
                  <Card 
                    key={link.link_id}
                    className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                    onClick={() => handleLinkClick(link)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: platform?.color || "#8645D6" }}
                      >
                        {platform?.icon ? (
                          <img src={platform.icon} alt="" className="w-6 h-6 invert" />
                        ) : (
                          <Globe className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{link.title || platform?.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{platform?.name || "Lien"}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="text-center pb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <img src={LOGO_URL} alt="FlexCard" className="w-6 h-6 object-contain" />
              <span className="text-sm">Créé avec FlexCard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
};

// Card Activation Page - For users who need to activate their card
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
          navigate(`/c/${cardId}`, { replace: true });
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
      navigate(`/login?return=/activate/${cardId}`);
      return;
    }

    setActivating(true);
    setError(null);
    
    try {
      await axios.post(`${API}/cards/${cardId}/activate`);
      setSuccess(true);
      
      // Redirect to the card profile after 2 seconds
      setTimeout(() => {
        navigate(`/c/${cardId}`, { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'activation");
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Vérification de la carte..." />;
  }

  if (error && !cardStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold font-heading mb-2 text-green-600">Carte activée !</h1>
            <p className="text-muted-foreground mb-2">
              Votre carte FlexCard est maintenant liée à votre profil.
            </p>
            <p className="text-sm text-muted-foreground">Redirection en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 px-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Activer ma carte</CardTitle>
          <CardDescription>
            Code: <span className="font-mono font-bold text-foreground">{cardId?.toUpperCase()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!user ? (
            <>
              <p className="text-center text-muted-foreground">
                Connectez-vous ou créez un compte pour activer votre carte FlexCard.
              </p>
              <div className="space-y-3">
                <Button variant="gradient" className="w-full" asChild>
                  <Link to={`/login?return=/activate/${cardId}`}>Se connecter</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/register?return=/activate/${cardId}`}>Créer un compte</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                Cliquez sur le bouton ci-dessous pour lier cette carte à votre profil.
              </p>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}
              <Button 
                variant="gradient" 
                className="w-full" 
                onClick={handleActivate}
                disabled={activating}
              >
                {activating ? "Activation en cours..." : "Activer ma carte"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Export both components
export { CardScanner, CardActivation, LoadingSpinner };
