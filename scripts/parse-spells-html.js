/**
 * Script para extrair magias do HTML de referência e comparar com nossos JSONs
 * Execute: node scripts/parse-spells-html.js
 */

const fs = require('fs');
const path = require('path');

// Simple HTML parser (no dependencies)
function parseSpellsFromHtml(html) {
  const spells = [];
  
  // Regex to find spell-item divs
  const spellRegex = /<div data-name="([^"]+)" data-level="(\d+)" class="[^"]*spell-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*(?=<div data-name|$)/g;
  
  let match;
  while ((match = spellRegex.exec(html)) !== null) {
    const dataName = match[1];
    const level = parseInt(match[2]);
    const content = match[3];
    
    // Extract name
    const nameMatch = content.match(/<div class="name">\s*<p>([^<]+)<\/p>/);
    const name = nameMatch ? nameMatch[1].trim() : dataName;
    
    // Extract school
    const schoolMatch = content.match(/<p class="school">([^<]+)<\/p>/);
    const school = schoolMatch ? schoolMatch[1].trim() : '';
    
    // Extract casting time
    const castMatch = content.match(/cast\.svg">\s*<\/div>\s*<div class="meta-item">\s*<img[^>]*>\s*<div class="meta-content">([^<]+)<\/div>/);
    const castMatch2 = content.match(/cast\.svg">\s*<div class="meta-content">([^<]+)<\/div>/);
    const castingTime = castMatch ? castMatch[1].trim() : (castMatch2 ? castMatch2[1].trim() : '');
    
    // Extract range
    const rangeMatch = content.match(/range\.svg">\s*<div class="meta-content">([^<]+)<\/div>/);
    const range = rangeMatch ? rangeMatch[1].trim() : '';
    
    // Extract components
    const componentsMatch = content.match(/components\.svg">\s*<div class="meta-content">([^<]+)<\/div>/);
    const components = componentsMatch ? componentsMatch[1].trim() : '';
    
    // Check for concentration
    const hasConcentration = content.includes('concentration.svg');
    
    // Extract duration
    const durationMatch = content.match(/duration\.svg">[^<]*(?:<img[^>]*>)?\s*<div class="meta-content">([^<]+)<\/div>/);
    const duration = durationMatch ? durationMatch[1].trim() : '';
    
    // Extract description
    const descMatch = content.match(/<div class="description">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    let description = '';
    if (descMatch) {
      description = descMatch[1]
        .replace(/<\/?p>/g, '\n')
        .replace(/<\/?strong>/g, '**')
        .replace(/<\/?em>/g, '*')
        .replace(/<li>/g, '• ')
        .replace(/<\/li>/g, '\n')
        .replace(/<\/?ul>/g, '')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/&amp;/g, '&')
        .replace(/\n+/g, '\n')
        .trim();
    }
    
    spells.push({
      dataName,
      name,
      level,
      school,
      castingTime,
      range,
      components,
      concentration: hasConcentration,
      duration,
      description
    });
  }
  
  return spells;
}

// Simpler parsing approach - just extract the key data
function parseSpellsSimple(html) {
  const spells = [];
  
  // Find all spell items
  const itemMatches = html.matchAll(/data-name="([^"]+)"\s+data-level="(\d+)"/g);
  
  for (const match of itemMatches) {
    const dataName = match[1];
    const level = parseInt(match[2]);
    
    // Find the content after this match until the next spell or end
    const startIdx = match.index;
    const nextMatch = html.indexOf('data-name="', startIdx + 10);
    const endIdx = nextMatch > 0 ? nextMatch : html.length;
    const content = html.substring(startIdx, endIdx);
    
    // Extract title name
    const nameMatch = content.match(/<div class="name">\s*<p>([^<]+)<\/p>/);
    const name = nameMatch ? nameMatch[1].trim() : dataName;
    
    // Extract school
    const schoolMatch = content.match(/<p class="school">([^<]+)<\/p>/);
    const school = schoolMatch ? schoolMatch[1].trim() : '';
    
    // Extract description (everything inside description div)
    const descStart = content.indexOf('<div class="description">');
    if (descStart > 0) {
      const descEnd = content.indexOf('</div>', descStart + 25);
      if (descEnd > descStart) {
        let desc = content.substring(descStart + 25, descEnd);
        // Clean up HTML
        desc = desc
          .replace(/<\/?p>/g, '\n')
          .replace(/<\/?strong>/g, '**')
          .replace(/<\/?em>/g, '*')
          .replace(/<li>/g, '\n• ')
          .replace(/<\/li>/g, '')
          .replace(/<\/?ul>/g, '')
          .replace(/<br\s*\/?>/g, '\n')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ')
          .trim();
        
        spells.push({
          dataName,
          name,
          level,
          school: school.replace(/\s*\d+$/, ''), // Remove level number from school
          description: desc
        });
      }
    }
  }
  
  return spells;
}

// Load our JSON spells
function loadOurSpells() {
  const spellDir = path.join(__dirname, '..', 'src', 'data', 'spells');
  const files = fs.readdirSync(spellDir).filter(f => f.endsWith('.json'));
  
  const allSpells = [];
  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(spellDir, file), 'utf-8'));
    if (content.magias) {
      allSpells.push(...content.magias);
    }
  }
  
  return allSpells;
}

// Normalize name for comparison
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Main execution
async function main() {
  console.log('🔮 Analisando magias do HTML de referência...\n');
  
  // Load HTML
  const htmlPath = path.join(__dirname, '..', 'public', 'data', 'magias-referencia.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ Arquivo HTML não encontrado:', htmlPath);
    console.log('   Copie o arquivo Lista_magias.html para public/data/magias-referencia.html');
    return;
  }
  
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const htmlSpells = parseSpellsSimple(html);
  
  console.log(`📚 Magias extraídas do HTML: ${htmlSpells.length}\n`);
  
  // Load our spells
  const ourSpells = loadOurSpells();
  console.log(`📖 Magias em nossos JSONs: ${ourSpells.length}\n`);
  
  // Create lookup maps
  const htmlByName = new Map();
  for (const spell of htmlSpells) {
    htmlByName.set(normalizeName(spell.name), spell);
    htmlByName.set(spell.dataName, spell); // Also by data-name
  }
  
  const ourByName = new Map();
  for (const spell of ourSpells) {
    ourByName.set(normalizeName(spell.name), spell);
    if (spell.name_en) {
      ourByName.set(normalizeName(spell.name_en), spell);
    }
  }
  
  // Find matches and differences
  const matches = [];
  const notInHtml = [];
  const notInOurs = [];
  
  for (const ourSpell of ourSpells) {
    const normalizedName = normalizeName(ourSpell.name);
    const htmlSpell = htmlByName.get(normalizedName);
    
    if (htmlSpell) {
      matches.push({
        our: ourSpell,
        html: htmlSpell
      });
    } else {
      notInHtml.push(ourSpell);
    }
  }
  
  for (const htmlSpell of htmlSpells) {
    const normalizedName = normalizeName(htmlSpell.name);
    if (!ourByName.has(normalizedName)) {
      notInOurs.push(htmlSpell);
    }
  }
  
  console.log('📊 Resumo:');
  console.log(`   ✅ Magias correspondentes: ${matches.length}`);
  console.log(`   ❌ Em nossos JSONs mas não no HTML: ${notInHtml.length}`);
  console.log(`   ➕ No HTML mas não em nossos JSONs: ${notInOurs.length}`);
  console.log('');
  
  // Show spells not in our database
  if (notInOurs.length > 0) {
    console.log('🆕 Magias no HTML que não temos (podem ser adicionadas):');
    for (const spell of notInOurs.slice(0, 20)) {
      console.log(`   - ${spell.name} (Nível ${spell.level}, ${spell.school})`);
    }
    if (notInOurs.length > 20) {
      console.log(`   ... e mais ${notInOurs.length - 20} magias`);
    }
    console.log('');
  }
  
  // Show sample comparisons
  console.log('📝 Exemplos de magias correspondentes (para verificação):');
  for (const { our, html } of matches.slice(0, 5)) {
    console.log(`\n   📌 ${our.name} (Nível ${our.level})`);
    console.log(`      HTML: ${html.name} (${html.school})`);
    console.log(`      Nossa descrição: ${our.description_markdown?.substring(0, 100)}...`);
    console.log(`      HTML descrição: ${html.description?.substring(0, 100)}...`);
  }
  
  // Save results to JSON
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      htmlSpells: htmlSpells.length,
      ourSpells: ourSpells.length,
      matches: matches.length,
      notInHtml: notInHtml.length,
      notInOurs: notInOurs.length
    },
    notInOurs: notInOurs,
    notInHtml: notInHtml.map(s => ({ id: s.id, name: s.name, name_en: s.name_en, level: s.level })),
    matches: matches.map(m => ({
      ourName: m.our.name,
      htmlName: m.html.name,
      level: m.our.level
    }))
  };
  
  const outputPath = path.join(__dirname, '..', 'public', 'data', 'spell-comparison.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Resultados salvos em: ${outputPath}`);
}

main().catch(console.error);
