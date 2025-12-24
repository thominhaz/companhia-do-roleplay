/**
 * Script para converter magias do HTML de referência para JSON
 * Execução: node scripts/convert-html-spells.js
 * 
 * Gera: src/data/spells-from-html.json
 */

const fs = require('fs');
const path = require('path');

// Mapear escolas do HTML para inglês
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

// Converter alcance texto para metros
function parseRange(rangeText) {
  if (!rangeText) return { range: 0, range_type: 'self' };
  
  const text = rangeText.toLowerCase().trim();
  
  if (text === 'pessoal') return { range: 0, range_type: 'self' };
  if (text === 'toque') return { range: 0, range_type: 'touch' };
  
  const metersMatch = text.match(/(\d+)\s*metros?/);
  if (metersMatch) {
    return { range: parseInt(metersMatch[1]), range_type: 'ranged' };
  }
  
  return { range: 0, range_type: 'self' };
}

// Converter componentes
function parseComponents(compText) {
  const text = compText.toUpperCase();
  return {
    verbal: text.includes('V'),
    somatic: text.includes('S'),
    material: text.includes('M')
  };
}

// Criar ID a partir do nome
function createId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// Limpar texto HTML
function cleanHtml(html) {
  return html
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<ul>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSpellsFromHTML(htmlContent) {
  const spells = [];
  
  // Encontrar cada spell-item usando regex
  const spellRegex = /<div[^>]*data-name="([^"]*)"[^>]*data-level="(\d+)"[^>]*class="[^"]*spell-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*(?=<div[^>]*(?:data-name|class="separator")|$)/g;
  
  let match;
  while ((match = spellRegex.exec(htmlContent)) !== null) {
    try {
      const dataName = match[1];
      const level = parseInt(match[2]);
      const content = match[3];
      
      // Nome
      const nameMatch = content.match(/<div class="name">\s*<p>([^<]+)<\/p>/);
      const name = nameMatch ? nameMatch[1].trim() : dataName;
      
      // Verificar se é ritual
      const isRitual = content.includes('ritual.svg');
      
      // Escola
      const schoolMatch = content.match(/<p class="school">([^<]+)<\/p>/);
      let school = 'evocation';
      if (schoolMatch) {
        const schoolText = schoolMatch[1].toLowerCase().replace(/\s*\d+$/, '').trim();
        school = schoolMap[schoolText] || schoolText;
      }
      
      // Meta informações
      const metaItems = content.match(/<div class="meta-content">([^<]+)<\/div>/g) || [];
      let castingTime = '1 ação';
      let rangeText = 'pessoal';
      let componentsText = 'V, S';
      let durationText = 'Instantânea';
      let concentration = false;
      
      metaItems.forEach((meta, index) => {
        const valueMatch = meta.match(/<div class="meta-content">([^<]+)<\/div>/);
        if (valueMatch) {
          const value = valueMatch[1].trim();
          switch (index) {
            case 0: castingTime = value; break;
            case 1: rangeText = value; break;
            case 2: componentsText = value; break;
            case 3: durationText = value; break;
          }
        }
      });
      
      // Verificar concentração
      concentration = content.includes('concentration.svg');
      
      // Descrição
      const descMatch = content.match(/<div class="description">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
      let description = '';
      let materialDescription = '';
      let atHigherLevels = '';
      
      if (descMatch) {
        let descContent = descMatch[1];
        
        // Extrair material
        const materialMatch = descContent.match(/<p><strong>Material<\/strong>:\s*([\s\S]*?)<\/p>/);
        if (materialMatch) {
          materialDescription = materialMatch[1].replace(/<[^>]+>/g, '').trim();
          descContent = descContent.replace(/<p><strong>Material<\/strong>:[\s\S]*?<\/p>/, '');
        }
        
        // Extrair "Em Níveis Superiores"
        const higherMatch = descContent.match(/<p><strong>Em Níveis Superiores<\/strong>\.\s*([\s\S]*?)<\/p>/);
        if (higherMatch) {
          atHigherLevels = cleanHtml(higherMatch[1]);
          descContent = descContent.replace(/<p><strong>Em Níveis Superiores<\/strong>\.[\s\S]*?<\/p>/, '');
        }
        
        // Remover "Reação" se houver (está duplicado com casting_time)
        descContent = descContent.replace(/<p><strong>Reação<\/strong>[\s\S]*?<\/p>/, '');
        
        description = cleanHtml(descContent);
      }
      
      const { range, range_type } = parseRange(rangeText);
      const components = parseComponents(componentsText);
      
      if (materialDescription) {
        components.material_description = materialDescription;
      }
      
      const spell = {
        id: createId(name),
        name: name,
        level: level,
        school: school,
        casting_time: castingTime,
        range: range,
        range_type: range_type,
        components: components,
        duration: concentration ? `Concentração, ${durationText}` : durationText,
        concentration: concentration,
        ritual: isRitual,
        description_markdown: description
      };
      
      if (atHigherLevels) {
        spell.at_higher_levels = atHigherLevels;
      }
      
      spells.push(spell);
    } catch (err) {
      console.error(`Erro ao processar magia: ${match[1]}`, err.message);
    }
  }
  
  return spells;
}

// Carregar magias existentes para mesclar dados mecânicos
function loadExistingMechanicalData() {
  const spellsDir = path.join(__dirname, '..', 'src', 'data', 'spells');
  const files = fs.readdirSync(spellsDir).filter(f => f.endsWith('.json'));
  
  const mechanicalData = {};
  
  files.forEach(file => {
    const filePath = path.join(spellsDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      content.magias.forEach(spell => {
        if (spell.mechanical) {
          // Normalizar nome para busca
          const normalizedName = spell.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
          
          mechanicalData[normalizedName] = spell.mechanical;
          mechanicalData[spell.id] = spell.mechanical;
        }
      });
    } catch (err) {
      console.error(`Erro ao ler ${file}:`, err.message);
    }
  });
  
  return mechanicalData;
}

function main() {
  console.log('🔮 Convertendo magias do HTML para JSON...\n');
  
  const htmlPath = path.join(__dirname, '..', 'public', 'data', 'magias-referencia.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ Arquivo HTML não encontrado:', htmlPath);
    process.exit(1);
  }
  
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  console.log('📖 HTML carregado:', (htmlContent.length / 1024).toFixed(1), 'KB');
  
  // Extrair magias
  const spells = extractSpellsFromHTML(htmlContent);
  console.log('✨ Magias extraídas:', spells.length);
  
  // Carregar dados mecânicos existentes
  console.log('\n📊 Carregando dados mecânicos existentes...');
  const mechanicalData = loadExistingMechanicalData();
  console.log('   Dados mecânicos encontrados:', Object.keys(mechanicalData).length);
  
  // Mesclar dados mecânicos
  let mergedCount = 0;
  spells.forEach(spell => {
    const normalizedName = spell.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    const mechanical = mechanicalData[normalizedName] || mechanicalData[spell.id];
    if (mechanical) {
      spell.mechanical = mechanical;
      mergedCount++;
    }
  });
  console.log('   Dados mecânicos mesclados:', mergedCount);
  
  // Organizar por nível
  spells.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
  
  // Estatísticas por nível
  console.log('\n📈 Magias por nível:');
  const byLevel = {};
  spells.forEach(s => {
    byLevel[s.level] = (byLevel[s.level] || 0) + 1;
  });
  Object.keys(byLevel).sort((a, b) => a - b).forEach(level => {
    console.log(`   Nível ${level}: ${byLevel[level]} magias`);
  });
  
  // Salvar JSON
  const output = { magias: spells };
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'spells-from-html.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  
  console.log('\n✅ JSON salvo em:', outputPath);
  console.log('\n🎉 Conversão concluída!');
  console.log('\nPróximos passos:');
  console.log('1. Revise o arquivo src/data/spells-from-html.json');
  console.log('2. Se estiver OK, substitua os arquivos antigos ou atualize os imports');
}

main();
