import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Sword, CheckCircle, Loader2, Shield } from "lucide-react";

interface PromoToken {
  id: string;
  code: string;
  tier: string;
}

export default function SupporterSubmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  // Auth state
  const [step, setStep] = useState<"validate" | "form" | "success">("validate");
  const [promoCode, setPromoCode] = useState(initialCode);
  const [validating, setValidating] = useState(false);
  const [validatedToken, setValidatedToken] = useState<PromoToken | null>(null);

  // Form state
  const [submissionType, setSubmissionType] = useState<"npc" | "item">("npc");
  const [submitting, setSubmitting] = useState(false);

  // Creator info
  const [creatorName, setCreatorName] = useState("");
  const [creatorMessage, setCreatorMessage] = useState("");

  // NPC fields
  const [npcName, setNpcName] = useState("");
  const [npcTitle, setNpcTitle] = useState("");
  const [npcDescription, setNpcDescription] = useState("");
  const [npcAppearance, setNpcAppearance] = useState("");
  const [npcPersonality, setNpcPersonality] = useState("");
  const [npcBackstory, setNpcBackstory] = useState("");
  const [npcOccupation, setNpcOccupation] = useState("");
  const [npcLocation, setNpcLocation] = useState("");
  const [npcImageUrl, setNpcImageUrl] = useState("");
  const [npcTags, setNpcTags] = useState("");

  // Item fields
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemRarity, setItemRarity] = useState("common");
  const [itemType, setItemType] = useState("wonderous");
  const [itemRequiresAttunement, setItemRequiresAttunement] = useState(false);
  const [itemAttunementReqs, setItemAttunementReqs] = useState("");
  const [itemProperties, setItemProperties] = useState("");
  const [itemDamage, setItemDamage] = useState("");
  const [itemDamageType, setItemDamageType] = useState("");
  const [itemAcBonus, setItemAcBonus] = useState("");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemTags, setItemTags] = useState("");

  // Auto-validate if code is in URL
  useEffect(() => {
    if (initialCode) {
      handleValidateCode();
    }
  }, []);

  const handleValidateCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Digite o código promocional");
      return;
    }

    setValidating(true);
    try {
      // Check if promo code exists and is valid for high tiers
      const { data: token, error } = await supabase
        .from("promo_tokens")
        .select("id, code, tier")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !token) {
        toast.error("Código inválido ou inativo");
        setValidating(false);
        return;
      }

      // Check if tier allows submissions (Mestre Épico or Lendário)
      const allowedTiers = ["mestre", "heroi"]; // Adjust based on your tier names
      if (!allowedTiers.includes(token.tier.toLowerCase())) {
        toast.error("Este código não permite criar conteúdo personalizado. Apenas apoiadores Herói ou Mestre podem submeter.");
        setValidating(false);
        return;
      }

      setValidatedToken(token);
      setStep("form");
      toast.success("Código validado! Agora preencha os detalhes da sua criação.");
    } catch (err) {
      console.error("Error validating code:", err);
      toast.error("Erro ao validar código");
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!validatedToken) return;

    // Validate required fields
    if (!creatorName.trim()) {
      toast.error("Preencha seu nome");
      return;
    }

    if (submissionType === "npc") {
      if (!npcName.trim()) {
        toast.error("Preencha o nome do NPC");
        return;
      }
    } else {
      if (!itemName.trim()) {
        toast.error("Preencha o nome do item");
        return;
      }
    }

    setSubmitting(true);
    try {
      const submissionData = submissionType === "npc" 
        ? {
            name: npcName.trim(),
            title: npcTitle.trim() || null,
            description: npcDescription.trim() || null,
            appearance: npcAppearance.trim() || null,
            personality: npcPersonality.trim() || null,
            backstory: npcBackstory.trim() || null,
            occupation: npcOccupation.trim() || null,
            location: npcLocation.trim() || null,
            image_url: npcImageUrl.trim() || null,
            tags: npcTags.trim() ? npcTags.split(",").map(t => t.trim()) : null,
          }
        : {
            name: itemName.trim(),
            description: itemDescription.trim() || null,
            rarity: itemRarity,
            item_type: itemType,
            requires_attunement: itemRequiresAttunement,
            attunement_requirements: itemAttunementReqs.trim() || null,
            properties: itemProperties.trim() || null,
            damage: itemDamage.trim() || null,
            damage_type: itemDamageType.trim() || null,
            ac_bonus: itemAcBonus ? parseInt(itemAcBonus) : null,
            image_url: itemImageUrl.trim() || null,
            tags: itemTags.trim() ? itemTags.split(",").map(t => t.trim()) : null,
          };

      const { error } = await supabase.from("supporter_submissions").insert({
        promo_code: validatedToken.code,
        submission_type: submissionType,
        creator_name: creatorName.trim(),
        creator_tier: validatedToken.tier,
        creator_message: creatorMessage.trim() || null,
        data: submissionData,
      });

      if (error) throw error;

      setStep("success");
      toast.success("Submissão enviada com sucesso!");
    } catch (err) {
      console.error("Error submitting:", err);
      toast.error("Erro ao enviar submissão");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Submeter Criação | Ward RPG</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="container px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-serif text-lg font-bold">Submeter Criação</h1>
              <p className="text-xs text-muted-foreground">Galeria de Apoiadores</p>
            </div>
          </div>
        </header>

        <main className="container px-4 py-6 max-w-2xl mx-auto">
          {/* Step 1: Validate Code */}
          {step === "validate" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Validar Código de Apoiador</CardTitle>
                <CardDescription>
                  Digite o mesmo código promocional que você usou para ativar sua assinatura no Ward RPG.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-code">Código Promocional</Label>
                  <Input
                    id="promo-code"
                    placeholder="Ex: MESTREVIP"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono uppercase"
                  />
                </div>
                <Button 
                  onClick={handleValidateCode} 
                  disabled={validating}
                  className="w-full"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Validar Código"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Form */}
          {step === "form" && validatedToken && (
            <div className="space-y-6">
              {/* Creator Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Seus Créditos</CardTitle>
                  <CardDescription>
                    Como você quer aparecer na galeria?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="creator-name">Seu Nome *</Label>
                    <Input
                      id="creator-name"
                      placeholder="Como você quer ser creditado"
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creator-message">Mensagem para a Comunidade</Label>
                    <Textarea
                      id="creator-message"
                      placeholder="Uma mensagem opcional que aparecerá junto com sua criação"
                      value={creatorMessage}
                      onChange={(e) => setCreatorMessage(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tier: <span className="font-medium text-primary">{validatedToken.tier}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Type */}
              <Tabs value={submissionType} onValueChange={(v) => setSubmissionType(v as "npc" | "item")}>
                <TabsList className="w-full">
                  <TabsTrigger value="npc" className="flex-1 gap-2">
                    <User className="h-4 w-4" />
                    NPC
                  </TabsTrigger>
                  <TabsTrigger value="item" className="flex-1 gap-2">
                    <Sword className="h-4 w-4" />
                    Item Mágico
                  </TabsTrigger>
                </TabsList>

                {/* NPC Form */}
                <TabsContent value="npc">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalhes do NPC</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="npc-name">Nome *</Label>
                          <Input
                            id="npc-name"
                            placeholder="Nome do NPC"
                            value={npcName}
                            onChange={(e) => setNpcName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="npc-title">Título/Apelido</Label>
                          <Input
                            id="npc-title"
                            placeholder="Ex: O Ferreiro Maldito"
                            value={npcTitle}
                            onChange={(e) => setNpcTitle(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="npc-occupation">Ocupação</Label>
                          <Input
                            id="npc-occupation"
                            placeholder="Ex: Mercador, Guarda"
                            value={npcOccupation}
                            onChange={(e) => setNpcOccupation(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="npc-location">Localização</Label>
                          <Input
                            id="npc-location"
                            placeholder="Onde vive/trabalha"
                            value={npcLocation}
                            onChange={(e) => setNpcLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="npc-description">Descrição Geral</Label>
                        <Textarea
                          id="npc-description"
                          placeholder="Uma breve descrição do NPC"
                          value={npcDescription}
                          onChange={(e) => setNpcDescription(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="npc-appearance">Aparência</Label>
                        <Textarea
                          id="npc-appearance"
                          placeholder="Descrição física detalhada"
                          value={npcAppearance}
                          onChange={(e) => setNpcAppearance(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="npc-personality">Personalidade</Label>
                        <Textarea
                          id="npc-personality"
                          placeholder="Traços de personalidade, manias, etc."
                          value={npcPersonality}
                          onChange={(e) => setNpcPersonality(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="npc-backstory">História de Fundo</Label>
                        <Textarea
                          id="npc-backstory"
                          placeholder="Backstory do NPC"
                          value={npcBackstory}
                          onChange={(e) => setNpcBackstory(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="npc-image">URL da Imagem</Label>
                        <Input
                          id="npc-image"
                          placeholder="https://..."
                          value={npcImageUrl}
                          onChange={(e) => setNpcImageUrl(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="npc-tags">Tags (separadas por vírgula)</Label>
                        <Input
                          id="npc-tags"
                          placeholder="Ex: vilão, misterioso, comerciante"
                          value={npcTags}
                          onChange={(e) => setNpcTags(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Item Form */}
                <TabsContent value="item">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalhes do Item Mágico</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="item-name">Nome do Item *</Label>
                        <Input
                          id="item-name"
                          placeholder="Nome do item mágico"
                          value={itemName}
                          onChange={(e) => setItemName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="item-type">Tipo</Label>
                          <Select value={itemType} onValueChange={setItemType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weapon">Arma</SelectItem>
                              <SelectItem value="armor">Armadura</SelectItem>
                              <SelectItem value="shield">Escudo</SelectItem>
                              <SelectItem value="ring">Anel</SelectItem>
                              <SelectItem value="rod">Bastão</SelectItem>
                              <SelectItem value="staff">Cajado</SelectItem>
                              <SelectItem value="wand">Varinha</SelectItem>
                              <SelectItem value="potion">Poção</SelectItem>
                              <SelectItem value="scroll">Pergaminho</SelectItem>
                              <SelectItem value="wonderous">Maravilhoso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-rarity">Raridade</Label>
                          <Select value={itemRarity} onValueChange={setItemRarity}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Comum</SelectItem>
                              <SelectItem value="uncommon">Incomum</SelectItem>
                              <SelectItem value="rare">Raro</SelectItem>
                              <SelectItem value="very_rare">Muito Raro</SelectItem>
                              <SelectItem value="legendary">Lendário</SelectItem>
                              <SelectItem value="artifact">Artefato</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item-description">Descrição e Poderes *</Label>
                        <Textarea
                          id="item-description"
                          placeholder="Descreva os poderes e efeitos do item"
                          value={itemDescription}
                          onChange={(e) => setItemDescription(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Requer Sintonização?</Label>
                          <p className="text-xs text-muted-foreground">O item precisa de sintonização para funcionar?</p>
                        </div>
                        <Switch
                          checked={itemRequiresAttunement}
                          onCheckedChange={setItemRequiresAttunement}
                        />
                      </div>

                      {itemRequiresAttunement && (
                        <div className="space-y-2">
                          <Label htmlFor="item-attunement">Requisitos de Sintonização</Label>
                          <Input
                            id="item-attunement"
                            placeholder="Ex: por um conjurador, por um paladino"
                            value={itemAttunementReqs}
                            onChange={(e) => setItemAttunementReqs(e.target.value)}
                          />
                        </div>
                      )}

                      {(itemType === "weapon") && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="item-damage">Dano</Label>
                            <Input
                              id="item-damage"
                              placeholder="Ex: 1d8+2"
                              value={itemDamage}
                              onChange={(e) => setItemDamage(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="item-damage-type">Tipo de Dano</Label>
                            <Input
                              id="item-damage-type"
                              placeholder="Ex: cortante, fogo"
                              value={itemDamageType}
                              onChange={(e) => setItemDamageType(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {(itemType === "armor" || itemType === "shield") && (
                        <div className="space-y-2">
                          <Label htmlFor="item-ac">Bônus de CA</Label>
                          <Input
                            id="item-ac"
                            type="number"
                            placeholder="Ex: 2"
                            value={itemAcBonus}
                            onChange={(e) => setItemAcBonus(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="item-properties">Propriedades Especiais</Label>
                        <Textarea
                          id="item-properties"
                          placeholder="Outras propriedades ou efeitos"
                          value={itemProperties}
                          onChange={(e) => setItemProperties(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item-image">URL da Imagem</Label>
                        <Input
                          id="item-image"
                          placeholder="https://..."
                          value={itemImageUrl}
                          onChange={(e) => setItemImageUrl(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="item-tags">Tags (separadas por vírgula)</Label>
                        <Input
                          id="item-tags"
                          placeholder="Ex: espada, fogo, lendário"
                          value={itemTags}
                          onChange={(e) => setItemTags(e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Submissão"
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle>Submissão Enviada!</CardTitle>
                <CardDescription>
                  Sua criação foi enviada para revisão. Nossa equipe irá analisar e, se aprovada, 
                  ela aparecerá na Galeria de Apoiadores em breve.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Voltar ao Início
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
}
