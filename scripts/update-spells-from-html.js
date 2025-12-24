/**
 * Script para extrair magias do HTML de referência e atualizar os JSONs existentes
 * Mantém os dados mecânicos (damage, saves, etc) mas atualiza:
 * - name (nome em português)
 * - school (traduzida)
 * - description_markdown
 * - casting_time
 * - duration
 * - components.material_description
 */

const fs = require('fs');
const path = require('path');

// Mapear escolas do HTML para os IDs em inglês usados nos JSONs
const schoolMap = {
  'abjuração': 'abjuration',
  'adivinhação': 'divination',
  'conjuração': 'conjuration',
  'encantamento': 'enchantment',
  'evocação': 'evocation',
  'ilusão': 'illusion',
  'necromancia': 'necromancy',
  'transmutação': 'transmutation'
};

// Função para normalizar strings para comparação
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '') // remove caracteres especiais
    .trim();
}

// Extrair magias do HTML
function extractSpellsFromHTML(htmlContent) {
  const spells = [];
  
  // Regex para encontrar cada spell-item
  const spellItemRegex = /<div[^>]*data-name="([^"]*)"[^>]*data-level="(\d+)"[^>]*class="[^"]*spell-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*(?=<div|$)/g;
  
  let match;
  while ((match = spellItemRegex.exec(htmlContent)) !== null) {
    const dataName = match[1];
    const level = parseInt(match[2]);
    const content = match[3];
    
    // Extrair nome
    const nameMatch = content.match(/<div class="name">\s*<p>([^<]+)<\/p>/);
    const name = nameMatch ? nameMatch[1].trim() : dataName;
    
    // Extrair escola
    const schoolMatch = content.match(/<p class="school">([^<]+)<\/p>/);
    let school = '';
    if (schoolMatch) {
      const schoolText = schoolMatch[1].toLowerCase().trim();
      // Extrair apenas o nome da escola (remover o número do nível)
      const schoolOnly = schoolText.replace(/\s*\d+$/, '').trim();
      school = schoolMap[schoolOnly] || schoolOnly;
    }
    
    // Extrair meta informações
    const metaItems = content.match(/<div class="meta-item">([\s\S]*?)<\/div>/g) || [];
    let castingTime = '';
    let range = '';
    let components = '';
    let duration = '';
    let concentration = false;
    
    metaItems.forEach((meta, index) => {
      const contentMatch = meta.match(/<div class="meta-content">([^<]+)<\/div>/);
      if (contentMatch) {
        const value = contentMatch[1].trim();
        switch (index) {
          case 0: castingTime = value; break;
          case 1: range = value; break;
          case 2: components = value; break;
          case 3: 
            duration = value;
            concentration = meta.includes('concentration.svg');
            break;
        }
      }
    });
    
    // Extrair descrição
    const descMatch = content.match(/<div class="description">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    let description = '';
    let materialDescription = '';
    
    if (descMatch) {
      let descContent = descMatch[1];
      
      // Extrair material se existir
      const materialMatch = descContent.match(/<p><strong>Material<\/strong>:\s*([^<]+)<\/p>/);
      if (materialMatch) {
        materialDescription = materialMatch[1].trim();
        // Remover a linha de material da descrição
        descContent = descContent.replace(/<p><strong>Material<\/strong>:[^<]*<\/p>/, '');
      }
      
      // Limpar HTML e converter para markdown
      description = descContent
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<strong>/g, '**')
        .replace(/<\/strong>/g, '**')
        .replace(/<em>/g, '*')
        .replace(/<\/em>/g, '*')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
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
      duration,
      concentration,
      description,
      materialDescription,
      normalized: normalize(name)
    });
  }
  
  return spells;
}

// Carregar todos os JSONs de magias
function loadSpellJSONs() {
  const spellsDir = path.join(__dirname, '..', 'src', 'data', 'spells');
  const files = fs.readdirSync(spellsDir).filter(f => f.endsWith('.json'));
  
  const allSpells = [];
  
  files.forEach(file => {
    const filePath = path.join(spellsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    content.magias.forEach(spell => {
      allSpells.push({
        ...spell,
        _sourceFile: file,
        _normalized: normalize(spell.name)
      });
    });
  });
  
  return allSpells;
}

// Encontrar correspondência entre magias
function findMatch(htmlSpell, jsonSpells) {
  // Primeiro, tentar match exato pelo nome normalizado
  let match = jsonSpells.find(js => js._normalized === htmlSpell.normalized);
  if (match) return match;
  
  // Tentar por nome em inglês normalizado
  match = jsonSpells.find(js => normalize(js.name_en || '') === htmlSpell.normalized);
  if (match) return match;
  
  // Tentar por data-name
  match = jsonSpells.find(js => normalize(js.name) === normalize(htmlSpell.dataName));
  if (match) return match;
  
  return null;
}

// Main
function main() {
  console.log('Carregando HTML de referência...');
  const htmlPath = path.join(__dirname, '..', 'public', 'data', 'magias-referencia.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  console.log('Extraindo magias do HTML...');
  const htmlSpells = extractSpellsFromHTML(htmlContent);
  console.log(`Encontradas ${htmlSpells.length} magias no HTML`);
  
  console.log('Carregando JSONs existentes...');
  const jsonSpells = loadSpellJSONs();
  console.log(`Encontradas ${jsonSpells.length} magias nos JSONs`);
  
  // Encontrar correspondências
  const matches = [];
  const noMatch = [];
  const htmlOnly = [];
  
  htmlSpells.forEach(hs => {
    const match = findMatch(hs, jsonSpells);
    if (match) {
      matches.push({ html: hs, json: match });
    } else {
      htmlOnly.push(hs);
    }
  });
  
  jsonSpells.forEach(js => {
    const hasMatch = matches.some(m => m.json.id === js.id);
    if (!hasMatch) {
      noMatch.push(js);
    }
  });
  
  console.log('\n=== RESUMO ===');
  console.log(`Correspondências encontradas: ${matches.length}`);
  console.log(`Magias só no HTML (não no banco): ${htmlOnly.length}`);
  console.log(`Magias só no banco (não no HTML): ${noMatch.length}`);
  
  // Mostrar magias que serão atualizadas
  console.log('\n=== MAGIAS QUE SERÃO ATUALIZADAS ===');
  matches.slice(0, 20).forEach(m => {
    console.log(`  ${m.json.name} <- ${m.html.name}`);
  });
  if (matches.length > 20) {
    console.log(`  ... e mais ${matches.length - 20} magias`);
  }
  
  // Mostrar magias só no HTML
  if (htmlOnly.length > 0) {
    console.log('\n=== MAGIAS SOMENTE NO HTML (podem ser adicionadas) ===');
    htmlOnly.forEach(hs => {
      console.log(`  ${hs.name} (nível ${hs.level})`);
    });
  }
  
  // Mostrar magias sem correspondência no banco
  if (noMatch.length > 0) {
    console.log('\n=== MAGIAS NO BANCO SEM CORRESPONDÊNCIA NO HTML ===');
    noMatch.forEach(js => {
      console.log(`  ${js.name} (${js.name_en})`);
    });
  }
  
  // Agora vamos atualizar os JSONs
  console.log('\n=== ATUALIZANDO JSONs ===');
  
  const spellsDir = path.join(__dirname, '..', 'src', 'data', 'spells');
  const files = fs.readdirSync(spellsDir).filter(f => f.endsWith('.json'));
  
  let totalUpdated = 0;
  
  files.forEach(file => {
    const filePath = path.join(spellsDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let fileUpdated = 0;
    
    content.magias = content.magias.map(spell => {
      const match = matches.find(m => m.json.id === spell.id);
      if (!match) return spell;
      
      const hs = match.html;
      fileUpdated++;
      
      // Atualizar campos com dados do HTML
      const updated = {
        ...spell,
        name: hs.name,
        school: hs.school || spell.school,
        casting_time: hs.castingTime || spell.casting_time,
        duration: hs.duration ? (hs.concentration ? `Concentração, ${hs.duration}` : hs.duration) : spell.duration,
        description_markdown: hs.description || spell.description_markdown
      };
      
      // Atualizar material_description se houver
      if (hs.materialDescription && updated.components) {
        updated.components.material_description = hs.materialDescription;
      }
      
      return updated;
    });
    
    if (fileUpdated > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`  ${file}: ${fileUpdated} magias atualizadas`);
      totalUpdated += fileUpdated;
    }
  });
  
  console.log(`\nTotal de magias atualizadas: ${totalUpdated}`);
  console.log('Concluído!');
}

main();
