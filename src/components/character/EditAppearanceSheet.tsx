import { useState, useEffect } from "react";
import { Edit3, Save, User, Heart, Scroll, Target, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateCharacter, CharacterDB } from "@/hooks/useCharacters";
import { toast } from "sonner";

interface EditAppearanceSheetProps {
  character: CharacterDB;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALIGNMENTS = [
  "Leal e Bom",
  "Neutro e Bom", 
  "Caótico e Bom",
  "Leal e Neutro",
  "Neutro",
  "Caótico e Neutro",
  "Leal e Mau",
  "Neutro e Mau",
  "Caótico e Mau"
];

export function EditAppearanceSheet({ character, open, onOpenChange }: EditAppearanceSheetProps) {
  const updateCharacter = useUpdateCharacter();
  
  // Physical appearance
  const [age, setAge] = useState(character.age || "");
  const [height, setHeight] = useState(character.height || "");
  const [weight, setWeight] = useState(character.weight || "");
  const [eyes, setEyes] = useState(character.eyes || "");
  const [hair, setHair] = useState(character.hair || "");
  const [skin, setSkin] = useState(character.skin || "");
  const [distinctiveFeatures, setDistinctiveFeatures] = useState(character.distinctive_features || "");
  
  // Personality
  const [alignment, setAlignment] = useState(character.alignment || "");
  const [personalityTraits, setPersonalityTraits] = useState(character.personality_traits || "");
  const [ideals, setIdeals] = useState(character.ideals || "");
  const [bonds, setBonds] = useState(character.bonds || "");
  const [flaws, setFlaws] = useState(character.flaws || "");
  const [backstory, setBackstory] = useState(character.backstory || "");
  const [goals, setGoals] = useState(character.goals || "");
  const [alliesOrganizations, setAlliesOrganizations] = useState(character.allies_organizations || "");

  useEffect(() => {
    setAge(character.age || "");
    setHeight(character.height || "");
    setWeight(character.weight || "");
    setEyes(character.eyes || "");
    setHair(character.hair || "");
    setSkin(character.skin || "");
    setDistinctiveFeatures(character.distinctive_features || "");
    setAlignment(character.alignment || "");
    setPersonalityTraits(character.personality_traits || "");
    setIdeals(character.ideals || "");
    setBonds(character.bonds || "");
    setFlaws(character.flaws || "");
    setBackstory(character.backstory || "");
    setGoals(character.goals || "");
    setAlliesOrganizations(character.allies_organizations || "");
  }, [character]);

  const handleSave = async () => {
    await updateCharacter.mutateAsync({
      id: character.id,
      age: age || null,
      height: height || null,
      weight: weight || null,
      eyes: eyes || null,
      hair: hair || null,
      skin: skin || null,
      distinctive_features: distinctiveFeatures || null,
      alignment: alignment || null,
      personality_traits: personalityTraits || null,
      ideals: ideals || null,
      bonds: bonds || null,
      flaws: flaws || null,
      backstory: backstory || null,
      goals: goals || null,
      allies_organizations: alliesOrganizations || null,
    });

    toast.success("Aparência e personalidade atualizadas!");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] bg-darker">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-primary" />
            Editar Aparência & Personalidade
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="appearance" className="h-[calc(100%-80px)]">
          <TabsList className="grid w-full grid-cols-2 mt-4">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Personalidade
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100%-100px)] mt-4">
            <TabsContent value="appearance" className="space-y-4 pb-4">
              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Características Físicas
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Idade</Label>
                    <Input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Ex: 25 anos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura</Label>
                    <Input
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Ex: 1,75m"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso</Label>
                    <Input
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Ex: 70kg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Olhos</Label>
                    <Input
                      value={eyes}
                      onChange={(e) => setEyes(e.target.value)}
                      placeholder="Ex: Castanhos"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cabelo</Label>
                    <Input
                      value={hair}
                      onChange={(e) => setHair(e.target.value)}
                      placeholder="Ex: Preto, curto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pele</Label>
                    <Input
                      value={skin}
                      onChange={(e) => setSkin(e.target.value)}
                      placeholder="Ex: Morena"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Características Distintivas</Label>
                  <Textarea
                    value={distinctiveFeatures}
                    onChange={(e) => setDistinctiveFeatures(e.target.value)}
                    placeholder="Cicatrizes, tatuagens, marcas especiais..."
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personality" className="space-y-4 pb-4">
              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Alinhamento
                </h3>
                <Select value={alignment} onValueChange={setAlignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o alinhamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALIGNMENTS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Traços de Personalidade
                </h3>
                <Textarea
                  value={personalityTraits}
                  onChange={(e) => setPersonalityTraits(e.target.value)}
                  placeholder="Descreva os traços de personalidade do seu personagem..."
                  rows={3}
                />
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground">Ideais</h3>
                <Textarea
                  value={ideals}
                  onChange={(e) => setIdeals(e.target.value)}
                  placeholder="O que você acredita? O que guia suas ações?"
                  rows={2}
                />
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground">Vínculos</h3>
                <Textarea
                  value={bonds}
                  onChange={(e) => setBonds(e.target.value)}
                  placeholder="O que te conecta ao mundo? Pessoas, lugares, objetos..."
                  rows={2}
                />
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground">Defeitos</h3>
                <Textarea
                  value={flaws}
                  onChange={(e) => setFlaws(e.target.value)}
                  placeholder="Quais são suas fraquezas, vícios ou medos?"
                  rows={2}
                />
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Objetivos
                </h3>
                <Textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="O que você busca alcançar?"
                  rows={2}
                />
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Aliados & Organizações
                </h3>
                <Textarea
                  value={alliesOrganizations}
                  onChange={(e) => setAlliesOrganizations(e.target.value)}
                  placeholder="Guildas, facções, aliados importantes..."
                  rows={2}
                />
              </div>

              <div className="glass rounded-xl p-4 space-y-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-primary" />
                  História de Fundo
                </h3>
                <Textarea
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  placeholder="Conte a história do seu personagem..."
                  rows={5}
                />
              </div>
            </TabsContent>
          </ScrollArea>

          {/* Save Button - Fixed at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              className="w-full bg-gradient-primary"
              size="lg"
              onClick={handleSave}
              disabled={updateCharacter.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateCharacter.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
