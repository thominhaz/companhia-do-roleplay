import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getModifier } from "@/data/srd";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf", fontWeight: 700 },
  ],
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#1a1a2e",
    padding: 30,
    fontFamily: "Roboto",
    color: "#e2e8f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#a855f7",
  },
  characterName: {
    fontSize: 28,
    fontWeight: 700,
    color: "#a855f7",
  },
  subtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: "#a855f7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#a855f7",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#a855f740",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
  },
  // Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#252540",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3f3f5c",
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  statModifier: {
    fontSize: 12,
    color: "#a855f7",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 4,
    textTransform: "uppercase",
  },
  // Combat stats
  combatGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  combatBox: {
    flex: 1,
    backgroundColor: "#252540",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3f3f5c",
  },
  combatValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  combatLabel: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 4,
  },
  // Skills
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillItem: {
    width: "48%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  skillItemProficient: {
    backgroundColor: "#a855f720",
  },
  skillName: {
    fontSize: 8,
    color: "#94a3b8",
  },
  skillNameProficient: {
    color: "#a855f7",
    fontWeight: 700,
  },
  skillModifier: {
    fontSize: 9,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  // Features
  featureItem: {
    backgroundColor: "#252540",
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  featureName: {
    fontSize: 10,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  featureSource: {
    fontSize: 8,
    color: "#a855f7",
  },
  featureDescription: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 4,
    lineHeight: 1.4,
  },
  // Spells
  spellLevel: {
    marginBottom: 8,
  },
  spellLevelTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#a855f7",
    marginBottom: 4,
  },
  spellList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  spellItem: {
    backgroundColor: "#252540",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
    color: "#e2e8f0",
  },
  // Equipment
  equipmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#3f3f5c20",
  },
  equipmentName: {
    fontSize: 9,
    color: "#e2e8f0",
  },
  equipmentDetails: {
    fontSize: 8,
    color: "#94a3b8",
  },
  // Inventory
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  inventoryItem: {
    backgroundColor: "#252540",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inventoryText: {
    fontSize: 8,
    color: "#e2e8f0",
  },
  // Currency
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currencyLabel: {
    fontSize: 8,
    color: "#94a3b8",
  },
  currencyValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#fbbf24",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#3f3f5c",
  },
  footerText: {
    fontSize: 8,
    color: "#64748b",
  },
  // Backstory page
  backstoryText: {
    fontSize: 10,
    color: "#e2e8f0",
    lineHeight: 1.6,
  },
  personalitySection: {
    marginBottom: 12,
  },
  personalityLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#a855f7",
    marginBottom: 4,
  },
  personalityText: {
    fontSize: 9,
    color: "#94a3b8",
    lineHeight: 1.4,
  },
  // Saving throws
  savingThrowsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  savingThrowItem: {
    width: "30%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: "#252540",
  },
  savingThrowProficient: {
    backgroundColor: "#a855f720",
    borderWidth: 1,
    borderColor: "#a855f740",
  },
  proficiencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3f3f5c",
  },
  proficiencyDotActive: {
    backgroundColor: "#a855f7",
  },
  savingThrowLabel: {
    fontSize: 8,
    color: "#94a3b8",
  },
  savingThrowValue: {
    fontSize: 9,
    fontWeight: 700,
    color: "#e2e8f0",
    marginLeft: "auto",
  },
});

const ATTR_NAMES: Record<string, string> = {
  strength: "FOR",
  dexterity: "DES",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "SAB",
  charisma: "CAR",
};

const ATTR_FULL_NAMES: Record<string, string> = {
  strength: "Força",
  dexterity: "Destreza",
  constitution: "Constituição",
  intelligence: "Inteligência",
  wisdom: "Sabedoria",
  charisma: "Carisma",
};

const SKILLS = [
  { id: "acrobatics", name: "Acrobacia", attr: "dexterity" },
  { id: "animal_handling", name: "Lidar com Animais", attr: "wisdom" },
  { id: "arcana", name: "Arcanismo", attr: "intelligence" },
  { id: "athletics", name: "Atletismo", attr: "strength" },
  { id: "deception", name: "Enganação", attr: "charisma" },
  { id: "history", name: "História", attr: "intelligence" },
  { id: "insight", name: "Intuição", attr: "wisdom" },
  { id: "intimidation", name: "Intimidação", attr: "charisma" },
  { id: "investigation", name: "Investigação", attr: "intelligence" },
  { id: "medicine", name: "Medicina", attr: "wisdom" },
  { id: "nature", name: "Natureza", attr: "intelligence" },
  { id: "perception", name: "Percepção", attr: "wisdom" },
  { id: "performance", name: "Atuação", attr: "charisma" },
  { id: "persuasion", name: "Persuasão", attr: "charisma" },
  { id: "religion", name: "Religião", attr: "intelligence" },
  { id: "sleight_of_hand", name: "Prestidigitação", attr: "dexterity" },
  { id: "stealth", name: "Furtividade", attr: "dexterity" },
  { id: "survival", name: "Sobrevivência", attr: "wisdom" },
];

interface CharacterPDFProps {
  character: any;
}

// PDF Document Component
function CharacterPDFDocument({ character }: CharacterPDFProps) {
  const attributes = character.attributes || {};
  const skills = character.skills || {};
  const savingThrows = character.saving_throws || {};
  const features = (character.features as any[]) || [];
  const spells = (character.spells as any[]) || [];
  const equipment = (character.equipment as any[]) || [];
  const inventory = (character.inventory as any[]) || [];
  const currency = character.currency || {};
  const proficiencies = character.proficiencies || {};

  // Group spells by level
  const spellsByLevel: Record<number, any[]> = {};
  spells.forEach((spell: any) => {
    const level = typeof spell === "string" ? 0 : spell.level || 0;
    if (!spellsByLevel[level]) spellsByLevel[level] = [];
    spellsByLevel[level].push(spell);
  });

  const getSpellLevelName = (level: number) => {
    if (level === 0) return "Truques";
    return `${level}º Círculo`;
  };

  return (
    <Document>
      {/* Page 1: Main Stats */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.characterName}>{character.name}</Text>
            <Text style={styles.subtitle}>
              {character.race}
              {character.subrace ? ` (${character.subrace})` : ""} •{" "}
              {character.class}
              {character.background ? ` • ${character.background}` : ""}
            </Text>
            {character.alignment && (
              <Text style={styles.subtitle}>{character.alignment}</Text>
            )}
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Nível {character.level}</Text>
          </View>
        </View>

        {/* Attributes */}
        <View style={styles.statsGrid}>
          {Object.entries(attributes).map(([key, value]) => {
            const mod = getModifier(value as number);
            return (
              <View key={key} style={styles.statBox}>
                <Text style={styles.statValue}>{value as number}</Text>
                <Text style={styles.statModifier}>
                  {mod >= 0 ? "+" : ""}
                  {mod}
                </Text>
                <Text style={styles.statLabel}>{ATTR_NAMES[key]}</Text>
              </View>
            );
          })}
        </View>

        {/* Combat Stats */}
        <View style={styles.combatGrid}>
          <View style={styles.combatBox}>
            <Text style={styles.combatValue}>{character.armor_class}</Text>
            <Text style={styles.combatLabel}>CA</Text>
          </View>
          <View style={styles.combatBox}>
            <Text style={styles.combatValue}>
              {character.current_hp}/{character.max_hp}
            </Text>
            <Text style={styles.combatLabel}>PV</Text>
          </View>
          <View style={styles.combatBox}>
            <Text style={styles.combatValue}>
              {character.initiative >= 0 ? "+" : ""}
              {character.initiative}
            </Text>
            <Text style={styles.combatLabel}>Iniciativa</Text>
          </View>
          <View style={styles.combatBox}>
            <Text style={styles.combatValue}>{character.speed}ft</Text>
            <Text style={styles.combatLabel}>Deslocamento</Text>
          </View>
          <View style={styles.combatBox}>
            <Text style={styles.combatValue}>
              +{character.proficiency_bonus}
            </Text>
            <Text style={styles.combatLabel}>Proficiência</Text>
          </View>
        </View>

        {/* Two columns: Saving Throws + Skills */}
        <View style={styles.row}>
          {/* Saving Throws */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Salvaguardas</Text>
              <View style={styles.savingThrowsGrid}>
                {Object.entries(ATTR_FULL_NAMES).map(([key, name]) => {
                  const isProficient =
                    savingThrows[key]?.proficient ||
                    (proficiencies as any)?.savingThrows?.includes(key);
                  const attrMod = getModifier(attributes[key] || 10);
                  const total = isProficient
                    ? attrMod + character.proficiency_bonus
                    : attrMod;
                  return (
                    <View
                      key={key}
                      style={[
                        styles.savingThrowItem,
                        isProficient && styles.savingThrowProficient,
                      ]}
                    >
                      <View
                        style={[
                          styles.proficiencyDot,
                          isProficient && styles.proficiencyDotActive,
                        ]}
                      />
                      <Text style={styles.savingThrowLabel}>
                        {ATTR_NAMES[key]}
                      </Text>
                      <Text style={styles.savingThrowValue}>
                        {total >= 0 ? "+" : ""}
                        {total}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Skills */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Perícias</Text>
              <View style={styles.skillsGrid}>
                {SKILLS.map((skill) => {
                  const skillData = skills[skill.id] || {};
                  const isProficient = skillData.proficient;
                  const hasExpertise = skillData.expertise;
                  const attrMod = getModifier(attributes[skill.attr] || 10);
                  let bonus = 0;
                  if (isProficient) bonus += character.proficiency_bonus;
                  if (hasExpertise) bonus += character.proficiency_bonus;
                  const total = attrMod + bonus;

                  return (
                    <View
                      key={skill.id}
                      style={[
                        styles.skillItem,
                        (isProficient || hasExpertise) &&
                          styles.skillItemProficient,
                      ]}
                    >
                      <Text
                        style={[
                          styles.skillName,
                          (isProficient || hasExpertise) &&
                            styles.skillNameProficient,
                        ]}
                      >
                        {skill.name}
                      </Text>
                      <Text style={styles.skillModifier}>
                        {total >= 0 ? "+" : ""}
                        {total}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Features (compact) */}
        {features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Habilidades & Talentos
            </Text>
            {features.slice(0, 6).map((feature: any, index: number) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.row}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  {feature.source && (
                    <Text style={styles.featureSource}>
                      {" "}
                      ({feature.source})
                    </Text>
                  )}
                </View>
                {feature.description && (
                  <Text style={styles.featureDescription}>
                    {feature.description.substring(0, 150)}
                    {feature.description.length > 150 ? "..." : ""}
                  </Text>
                )}
              </View>
            ))}
            {features.length > 6 && (
              <Text style={styles.featureSource}>
                +{features.length - 6} habilidades adicionais...
              </Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Gerado em {new Date().toLocaleDateString("pt-BR")}
          </Text>
          <Text style={styles.footerText}>Go20 - Companheiro de RPG</Text>
        </View>
      </Page>

      {/* Page 2: Spells & Equipment */}
      {(spells.length > 0 || equipment.length > 0 || inventory.length > 0) && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.characterName, { marginBottom: 20 }]}>
            {character.name} - Equipamento & Magias
          </Text>

          {/* Equipment */}
          {equipment.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipamento</Text>
              {equipment.map((item: any, index: number) => (
                <View key={index} style={styles.equipmentItem}>
                  <Text style={styles.equipmentName}>
                    {item.name}
                    {item.equipped ? " ⚔️" : ""}
                  </Text>
                  <Text style={styles.equipmentDetails}>
                    {item.damage && `${item.damage} `}
                    {item.acBonus && `+${item.acBonus} CA`}
                    {item.type}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Inventory */}
          {inventory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventário</Text>
              <View style={styles.inventoryGrid}>
                {inventory.map((item: any, index: number) => (
                  <View key={index} style={styles.inventoryItem}>
                    <Text style={styles.inventoryText}>
                      {item.name}
                      {item.quantity > 1 ? ` (${item.quantity})` : ""}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Currency */}
              <View style={styles.currencyRow}>
                {currency.platinum > 0 && (
                  <View style={styles.currencyItem}>
                    <Text style={styles.currencyValue}>{currency.platinum}</Text>
                    <Text style={styles.currencyLabel}>PP</Text>
                  </View>
                )}
                {currency.gold > 0 && (
                  <View style={styles.currencyItem}>
                    <Text style={styles.currencyValue}>{currency.gold}</Text>
                    <Text style={styles.currencyLabel}>PO</Text>
                  </View>
                )}
                {currency.electrum > 0 && (
                  <View style={styles.currencyItem}>
                    <Text style={styles.currencyValue}>{currency.electrum}</Text>
                    <Text style={styles.currencyLabel}>PE</Text>
                  </View>
                )}
                {currency.silver > 0 && (
                  <View style={styles.currencyItem}>
                    <Text style={styles.currencyValue}>{currency.silver}</Text>
                    <Text style={styles.currencyLabel}>PP</Text>
                  </View>
                )}
                {currency.copper > 0 && (
                  <View style={styles.currencyItem}>
                    <Text style={styles.currencyValue}>{currency.copper}</Text>
                    <Text style={styles.currencyLabel}>PC</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Spells */}
          {spells.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Magias</Text>
              {Object.entries(spellsByLevel)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, levelSpells]) => (
                  <View key={level} style={styles.spellLevel}>
                    <Text style={styles.spellLevelTitle}>
                      {getSpellLevelName(Number(level))}
                    </Text>
                    <View style={styles.spellList}>
                      {levelSpells.map((spell: any, index: number) => (
                        <Text key={index} style={styles.spellItem}>
                          {typeof spell === "string" ? spell : spell.name}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Gerado em {new Date().toLocaleDateString("pt-BR")}
            </Text>
            <Text style={styles.footerText}>Go20 - Companheiro de RPG</Text>
          </View>
        </Page>
      )}

      {/* Page 3: Backstory & Personality */}
      {(character.backstory ||
        character.personality_traits ||
        character.ideals ||
        character.bonds ||
        character.flaws) && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.characterName, { marginBottom: 20 }]}>
            {character.name} - Personalidade & História
          </Text>

          <View style={styles.row}>
            <View style={styles.column}>
              {character.personality_traits && (
                <View style={styles.personalitySection}>
                  <Text style={styles.personalityLabel}>
                    Traços de Personalidade
                  </Text>
                  <Text style={styles.personalityText}>
                    {character.personality_traits}
                  </Text>
                </View>
              )}

              {character.ideals && (
                <View style={styles.personalitySection}>
                  <Text style={styles.personalityLabel}>Ideais</Text>
                  <Text style={styles.personalityText}>{character.ideals}</Text>
                </View>
              )}
            </View>

            <View style={styles.column}>
              {character.bonds && (
                <View style={styles.personalitySection}>
                  <Text style={styles.personalityLabel}>Vínculos</Text>
                  <Text style={styles.personalityText}>{character.bonds}</Text>
                </View>
              )}

              {character.flaws && (
                <View style={styles.personalitySection}>
                  <Text style={styles.personalityLabel}>Defeitos</Text>
                  <Text style={styles.personalityText}>{character.flaws}</Text>
                </View>
              )}
            </View>
          </View>

          {character.backstory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>História</Text>
              <Text style={styles.backstoryText}>{character.backstory}</Text>
            </View>
          )}

          {/* Languages */}
          {(character.languages as any[])?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Idiomas</Text>
              <View style={styles.spellList}>
                {(character.languages as any[]).map(
                  (lang: string, index: number) => (
                    <Text key={index} style={styles.spellItem}>
                      {lang}
                    </Text>
                  )
                )}
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Gerado em {new Date().toLocaleDateString("pt-BR")}
            </Text>
            <Text style={styles.footerText}>Go20 - Companheiro de RPG</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}

interface CharacterPDFExportProps {
  character: any;
  variant?: "default" | "icon";
}

export function CharacterPDFExport({
  character,
  variant = "default",
}: CharacterPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    if (!character) return;

    setIsGenerating(true);
    try {
      const blob = await pdf(
        <CharacterPDFDocument character={character} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${character.name.replace(/\s+/g, "_")}_ficha.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF gerado com sucesso!", {
        description: `Ficha de ${character.name} exportada`,
        icon: "📄",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExport}
        disabled={isGenerating}
        className="h-9 w-9"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
}
