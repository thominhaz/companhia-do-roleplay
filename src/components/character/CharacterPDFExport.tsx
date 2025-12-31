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
import { FileDown, Loader2, Palette, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Color theme styles
const createStyles = (theme: 'color' | 'bw') => {
  const isColor = theme === 'color';
  
  const colors = {
    pageBg: isColor ? "#1a1a2e" : "#ffffff",
    text: isColor ? "#e2e8f0" : "#1a1a1a",
    textMuted: isColor ? "#94a3b8" : "#666666",
    accent: isColor ? "#a855f7" : "#333333",
    accentBg: isColor ? "#a855f720" : "#f0f0f0",
    boxBg: isColor ? "#252540" : "#f8f8f8",
    border: isColor ? "#3f3f5c" : "#cccccc",
    borderLight: isColor ? "#3f3f5c40" : "#e0e0e0",
    gold: isColor ? "#fbbf24" : "#666666",
    profDot: isColor ? "#a855f7" : "#333333",
    profDotInactive: isColor ? "#3f3f5c" : "#cccccc",
  };

  return StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: colors.pageBg,
      padding: 30,
      fontFamily: "Roboto",
      color: colors.text,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    characterName: {
      fontSize: 28,
      fontWeight: 700,
      color: colors.accent,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    levelBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    levelText: {
      fontSize: 14,
      fontWeight: 700,
      color: isColor ? "#ffffff" : "#ffffff",
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: colors.accent,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    column: {
      flex: 1,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.boxBg,
      borderRadius: 8,
      padding: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 700,
      color: colors.text,
    },
    statModifier: {
      fontSize: 12,
      color: colors.accent,
      marginTop: 2,
    },
    statLabel: {
      fontSize: 8,
      color: colors.textMuted,
      marginTop: 4,
      textTransform: "uppercase",
    },
    combatGrid: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    combatBox: {
      flex: 1,
      backgroundColor: colors.boxBg,
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    combatValue: {
      fontSize: 24,
      fontWeight: 700,
      color: colors.text,
    },
    combatLabel: {
      fontSize: 9,
      color: colors.textMuted,
      marginTop: 4,
    },
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
      backgroundColor: colors.accentBg,
    },
    skillName: {
      fontSize: 8,
      color: colors.textMuted,
    },
    skillNameProficient: {
      color: colors.accent,
      fontWeight: 700,
    },
    skillModifier: {
      fontSize: 9,
      fontWeight: 700,
      color: colors.text,
    },
    featureItem: {
      backgroundColor: colors.boxBg,
      borderRadius: 6,
      padding: 8,
      marginBottom: 6,
    },
    featureName: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.text,
    },
    featureSource: {
      fontSize: 8,
      color: colors.accent,
    },
    featureDescription: {
      fontSize: 8,
      color: colors.textMuted,
      marginTop: 4,
      lineHeight: 1.4,
    },
    spellLevel: {
      marginBottom: 8,
    },
    spellLevelTitle: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.accent,
      marginBottom: 4,
    },
    spellList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    spellItem: {
      backgroundColor: colors.boxBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 8,
      color: colors.text,
    },
    equipmentItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    equipmentName: {
      fontSize: 9,
      color: colors.text,
    },
    equipmentDetails: {
      fontSize: 8,
      color: colors.textMuted,
    },
    inventoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    inventoryItem: {
      backgroundColor: colors.boxBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    inventoryText: {
      fontSize: 8,
      color: colors.text,
    },
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
      color: colors.textMuted,
    },
    currencyValue: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.gold,
    },
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
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 8,
      color: colors.textMuted,
    },
    backstoryText: {
      fontSize: 10,
      color: colors.text,
      lineHeight: 1.6,
    },
    personalitySection: {
      marginBottom: 12,
    },
    personalityLabel: {
      fontSize: 9,
      fontWeight: 700,
      color: colors.accent,
      marginBottom: 4,
    },
    personalityText: {
      fontSize: 9,
      color: colors.textMuted,
      lineHeight: 1.4,
    },
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
      backgroundColor: colors.boxBg,
    },
    savingThrowProficient: {
      backgroundColor: colors.accentBg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    proficiencyDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.profDotInactive,
    },
    proficiencyDotActive: {
      backgroundColor: colors.profDot,
    },
    savingThrowLabel: {
      fontSize: 8,
      color: colors.textMuted,
    },
    savingThrowValue: {
      fontSize: 9,
      fontWeight: 700,
      color: colors.text,
      marginLeft: "auto",
    },
  });
};

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
  theme: 'color' | 'bw';
}

// PDF Document Component
function CharacterPDFDocument({ character, theme }: CharacterPDFProps) {
  const styles = createStyles(theme);
  const attributes = character.attributes || {};
  const skills = character.skills || {};
  const savingThrows = character.saving_throws || {};
  const features = (character.features as any[]) || [];

  const spellsRaw = (character.spells as any[]) ?? [];
  const spells = (Array.isArray(spellsRaw) ? spellsRaw : []).filter((spell) => {
    if (typeof spell === "string") return spell.trim().length > 0;
    return !!spell && typeof spell === "object" && typeof (spell as any).name === "string";
  });

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
            <Text style={styles.combatValue}>{character.speed}m</Text>
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
        character.flaws ||
        character.age ||
        character.goals) && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.characterName, { marginBottom: 20 }]}>
            {character.name} - Personalidade & História
          </Text>

          {/* Physical Appearance */}
          {(character.age || character.height || character.weight || character.eyes || character.hair || character.skin) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aparência Física</Text>
              <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
                {character.age && (
                  <View style={{ width: '30%', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Idade</Text>
                    <Text style={{ fontSize: 10, color: '#e2e8f0' }}>{character.age}</Text>
                  </View>
                )}
                {character.height && (
                  <View style={{ width: '30%', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Altura</Text>
                    <Text style={{ fontSize: 10, color: '#e2e8f0' }}>{character.height}</Text>
                  </View>
                )}
                {character.weight && (
                  <View style={{ width: '30%', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Peso</Text>
                    <Text style={{ fontSize: 10, color: '#e2e8f0' }}>{character.weight}</Text>
                  </View>
                )}
                {character.eyes && (
                  <View style={{ width: '30%', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Olhos</Text>
                    <Text style={{ fontSize: 10, color: '#e2e8f0' }}>{character.eyes}</Text>
                  </View>
                )}
                {character.hair && (
                  <View style={{ width: '30%', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Cabelo</Text>
                    <Text style={{ fontSize: 10, color: '#e2e8f0' }}>{character.hair}</Text>
                  </View>
                )}
                {character.skin && (
                  <View style={{ width: '30%', marginBottom: 4 }}>
                    <Text style={{ fontSize: 8, color: '#94a3b8' }}>Pele</Text>
                    <Text style={{ fontSize: 10, color: '#e2e8f0' }}>{character.skin}</Text>
                  </View>
                )}
              </View>
              {character.distinctive_features && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 8, color: '#a855f7', fontWeight: 700 }}>Características Distintivas</Text>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{character.distinctive_features}</Text>
                </View>
              )}
            </View>
          )}

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

          {character.goals && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Objetivos & Motivações</Text>
              <Text style={styles.backstoryText}>{character.goals}</Text>
            </View>
          )}

          {character.backstory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>História</Text>
              <Text style={styles.backstoryText}>{character.backstory}</Text>
            </View>
          )}

          {character.allies_organizations && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aliados & Organizações</Text>
              <Text style={styles.backstoryText}>{character.allies_organizations}</Text>
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
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (theme: 'color' | 'bw') => {
    if (!character) return;

    setIsGenerating(true);
    setIsOpen(false);
    try {
      const blob = await pdf(
        <CharacterPDFDocument character={character} theme={theme} />
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const suffix = theme === 'bw' ? '_pb' : '';
      link.download = `${character.name.replace(/\s+/g, "_")}_ficha${suffix}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF gerado com sucesso!", {
        description: `Ficha de ${character.name} exportada ${theme === 'bw' ? '(preto e branco)' : '(colorido)'}`,
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
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isGenerating}
            className="h-9 w-9"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('color')} className="gap-2">
            <Palette className="h-4 w-4 text-purple-400" />
            <span>PDF Colorido</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('bw')} className="gap-2">
            <Printer className="h-4 w-4" />
            <span>PDF Preto & Branco</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isGenerating}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            "Exportar PDF"
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => handleExport('color')} className="gap-2">
          <Palette className="h-4 w-4 text-purple-400" />
          <span>PDF Colorido</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('bw')} className="gap-2">
          <Printer className="h-4 w-4" />
          <span>PDF Preto & Branco</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
