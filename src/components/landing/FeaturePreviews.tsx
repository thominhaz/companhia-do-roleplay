import { useState } from 'react';
import { 
  Swords, 
  Dice5, 
  Skull,
  Coins,
  ChevronRight,
  Heart
} from 'lucide-react';

// 1. Preview da Ficha de Personagem (Cálculo automático)
export const CharacterSheetPreviewInteractive = () => {
  const [stats, setStats] = useState({
    str: { value: 16, mod: 3 },
    dex: { value: 14, mod: 2 },
    con: { value: 15, mod: 2 },
    int: { value: 10, mod: 0 },
    wis: { value: 12, mod: 1 },
    cha: { value: 8, mod: -1 },
  });

  const updateStat = (key: keyof typeof stats, newValue: number) => {
    const mod = Math.floor((newValue - 10) / 2);
    setStats(prev => ({ ...prev, [key]: { value: newValue, mod } }));
  };

  return (
    <div className="bg-surface-0 p-6 rounded-xl border border-border h-full flex flex-col gap-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-solar-orange p-1">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" className="w-full h-full rounded-full bg-background/50" />
        </div>
        <div>
          <h4 className="text-foreground font-bold text-lg">Valeros, o Bravo</h4>
          <p className="text-muted-foreground text-xs uppercase tracking-wider">Guerreiro • Humano • Nível 3</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(stats).map(([key, { value, mod }]) => (
          <div key={key} className="bg-surface-1 p-2 rounded-lg text-center border border-border hover:border-primary/50 transition-colors group">
            <div className="text-xs text-muted-foreground uppercase mb-1">{key}</div>
            <div className="text-xl font-bold text-foreground">{value}</div>
            <div className={`text-xs font-bold ${mod >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {mod >= 0 ? '+' : ''}{mod}
            </div>
            <div className="flex justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => updateStat(key as keyof typeof stats, value - 1)} className="w-5 h-5 flex items-center justify-center bg-surface-2 rounded hover:bg-surface-3 text-foreground">-</button>
              <button onClick={() => updateStat(key as keyof typeof stats, value + 1)} className="w-5 h-5 flex items-center justify-center bg-surface-2 rounded hover:bg-surface-3 text-foreground">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto bg-primary/10 p-3 rounded text-primary text-xs text-center border border-primary/20">
        💡 Tente alterar os atributos para ver os modificadores mudarem automaticamente!
      </div>
    </div>
  );
};

// 2. Preview do Combat Tracker (Iniciativa, HP Bar, Logs e Ações)
export const CombatTrackerPreview = () => {
  const [turn, setTurn] = useState(0);
  const [logs, setLogs] = useState<string[]>(["Combate iniciado!"]);
  const [entities, setEntities] = useState([
    { id: 1, name: "Valeros", type: "player", hp: 28, maxHp: 28, init: 18, ac: 16 },
    { id: 2, name: "Goblin Chefe", type: "enemy", hp: 20, maxHp: 20, init: 15, ac: 14 },
    { id: 3, name: "Goblin Arqueiro", type: "enemy", hp: 12, maxHp: 12, init: 12, ac: 12 },
  ]);

  const activeEntity = entities[turn % entities.length];

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 4));
  };

  const nextTurn = () => {
    setTurn((prev) => (prev + 1));
    const nextIndex = (turn + 1) % entities.length;
    addLog(`▶️ Turno de ${entities[nextIndex].name}`);
  };
  
  const handleAttack = (targetId: number) => {
    const target = entities.find(e => e.id === targetId);
    if (!target) return;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const hitBonus = 5;
    const isHit = (d20 + hitBonus) >= target.ac;
    const isCrit = d20 === 20;

    if (isHit || isCrit) {
        const damage = isCrit ? Math.floor(Math.random() * 12) + 8 : Math.floor(Math.random() * 6) + 3;
        
        setEntities(prev => prev.map(e => 
            e.id === targetId ? { ...e, hp: Math.max(0, e.hp - damage) } : e
        ));
        
        addLog(`⚔️ ${activeEntity.name} atacou ${target.name} (${d20}+${hitBonus}): ${isCrit ? 'CRÍTICO!' : 'Acertou!'} (${damage} dano)`);
    } else {
        addLog(`🛡️ ${activeEntity.name} atacou ${target.name} (${d20}+${hitBonus}): Errou!`);
    }
  };

  const handleHeal = () => {
      const amount = Math.floor(Math.random() * 8) + 2;
      setEntities(prev => prev.map(e => 
        e.id === activeEntity.id ? { ...e, hp: Math.min(e.maxHp, e.hp + amount) } : e
      ));
      addLog(`✨ ${activeEntity.name} se curou em ${amount} HP.`);
  };

  return (
    <div className="bg-surface-0 p-4 rounded-xl border border-border h-full flex flex-col font-sans">
      {/* Header com Turno e Botão de Avançar */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
        <div>
            <h4 className="text-foreground font-bold text-sm">Rodada {Math.floor(turn / entities.length) + 1}</h4>
            <div className="text-xs text-muted-foreground">Turno atual: <span className="text-primary font-bold">{activeEntity.name}</span></div>
        </div>
        <button onClick={nextTurn} className="bg-surface-1 hover:bg-surface-2 text-foreground text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-2">
          Próximo <ChevronRight size={14} />
        </button>
      </div>

      {/* Lista de Entidades */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        {entities.map((entity, index) => {
            const isActive = index === (turn % entities.length);
            const isDead = entity.hp === 0;
            const hpPercent = (entity.hp / entity.maxHp) * 100;
            
            return (
                <div 
                    key={entity.id} 
                    className={`relative p-3 rounded-lg border transition-all duration-300 ${
                    isActive 
                        ? 'bg-primary/10 border-primary/50 shadow-depth-glow' 
                        : 'bg-surface-1 border-transparent opacity-80 hover:opacity-100'
                    } ${isDead ? 'grayscale opacity-50' : ''}`}
                >
                    {/* Infos Principais */}
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`font-mono text-xs font-bold w-6 h-6 flex items-center justify-center rounded bg-background/40 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                {entity.init}
                            </div>
                            <div>
                                <div className={`font-bold text-sm leading-none mb-1 flex items-center gap-2 ${entity.type === 'player' ? 'text-cyan-blue' : 'text-destructive'}`}>
                                    {entity.name}
                                    {isDead && <Skull size={12} />}
                                </div>
                                <div className="text-[10px] text-muted-foreground">AC {entity.ac}</div>
                            </div>
                        </div>
                        
                        {/* Ações contextuais */}
                        {isActive && !isDead && (
                            <div className="flex gap-1">
                                {entity.type === 'player' ? (
                                    <button onClick={handleHeal} className="p-1.5 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors" title="Curar">
                                        <Heart size={14} />
                                    </button>
                                ) : (
                                    <button onClick={() => handleAttack(1)} className="px-2 py-1 rounded bg-destructive/20 text-destructive text-xs hover:bg-destructive/30 transition-colors border border-destructive/30">
                                        Atacar Jogador
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Se for turno do Player (ID 1) e este for um inimigo vivo */}
                        {activeEntity.id === 1 && entity.type === 'enemy' && !isDead && (
                             <button onClick={() => handleAttack(entity.id)} className="p-1.5 rounded bg-solar-orange/20 text-solar-orange hover:bg-solar-orange/30 transition-colors" title="Atacar">
                                <Swords size={14} />
                            </button>
                        )}
                    </div>

                    {/* Barra de Vida */}
                    <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden relative z-10">
                        <div 
                            className={`h-full transition-all duration-500 ${
                                hpPercent > 50 ? 'bg-secondary' : hpPercent > 25 ? 'bg-gold' : 'bg-destructive'
                            }`}
                            style={{ width: `${hpPercent}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-right mt-1 text-muted-foreground font-mono">
                        {entity.hp}/{entity.maxHp} HP
                    </div>
                </div>
            );
        })}
      </div>

      {/* Log de Batalha Compacto */}
      <div className="mt-4 pt-3 border-t border-border h-24 overflow-hidden flex flex-col justify-end">
        {logs.map((log, i) => (
            <div key={i} className="text-[10px] md:text-xs text-muted-foreground py-0.5 border-l-2 border-border pl-2 mb-1 animate-in slide-in-from-left-2 fade-in duration-300">
                {log}
            </div>
        ))}
      </div>
    </div>
  );
};

// 3. Preview de Chat (Rolagem de dados)
export const ChatPreview = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: "GM", text: "Vocês entram na masmorra escura...", type: "text" },
    { id: 2, user: "Valeros", text: "Eu acendo uma tocha.", type: "text" },
  ]);

  const rollDice = () => {
    const result = Math.floor(Math.random() * 20) + 1;
    const newMsg = { 
      id: Date.now(), 
      user: "Valeros", 
      text: `Rolou um d20: ${result}`, 
      type: "roll", 
      value: result 
    };
    setMessages(prev => [...prev, newMsg]);
    
    setTimeout(() => {
        let response = "";
        if (result === 20) response = "CRÍTICO! Você ilumina tudo e acha ouro!";
        else if (result === 1) response = "Falha crítica! Você queima a própria mão.";
        else if (result > 10) response = "Você consegue enxergar o caminho.";
        else response = "A tocha falha e apaga.";

        setMessages(prev => [...prev, { id: Date.now(), user: "GM", text: response, type: "text" }]);
    }, 800);
  };

  return (
    <div className="bg-surface-0 rounded-xl border border-border h-full flex flex-col overflow-hidden">
        <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-white/10">
            {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.user === 'Valeros' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-muted-foreground mb-0.5">{msg.user}</span>
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                        msg.type === 'roll' 
                            ? 'bg-cosmic-purple/30 border border-cosmic-purple/50 text-foreground' 
                            : msg.user === 'GM' ? 'bg-solar-orange/20 text-foreground' : 'bg-surface-1 text-foreground'
                    }`}>
                        {msg.type === 'roll' && <Dice5 size={14} className="inline mr-1 mb-0.5" />}
                        {msg.text}
                    </div>
                </div>
            ))}
        </div>
        <div className="p-3 bg-background/20 border-t border-border flex gap-2">
            <input disabled placeholder="Digite..." className="flex-1 bg-surface-1 border border-border rounded px-3 text-sm text-foreground focus:outline-none" />
            <button onClick={rollDice} className="bg-primary hover:bg-primary/80 text-primary-foreground p-2 rounded transition-colors" title="Rolar d20">
                <Dice5 size={18} />
            </button>
        </div>
    </div>
  );
};

// 4. Preview de Homebrew (Criação de Itens)
export const HomebrewPreview = () => {
    const [item, setItem] = useState({
        name: "Espada do Vazio",
        type: "Arma Lendária",
        desc: "Uma lâmina feita de pura escuridão.",
        rarity: "lendar"
    });

    return (
        <div className="h-full flex flex-col md:flex-row gap-4">
            {/* Form */}
            <div className="md:w-1/2 space-y-3">
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Nome do Item</label>
                    <input 
                        value={item.name} 
                        onChange={(e) => setItem({...item, name: e.target.value})}
                        className="w-full bg-surface-1 border border-border rounded p-2 text-sm text-foreground focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Raridade</label>
                    <select 
                        value={item.rarity}
                        className="w-full bg-surface-0 border border-border rounded p-2 text-sm text-foreground focus:border-primary outline-none appearance-none cursor-pointer"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                        onChange={(e) => setItem({...item, rarity: e.target.value})}
                    >
                        <option value="comum" className="bg-surface-0 text-foreground">Comum</option>
                        <option value="raro" className="bg-surface-0 text-foreground">Raro</option>
                        <option value="lendar" className="bg-surface-0 text-foreground">Lendário</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
                    <textarea 
                        value={item.desc}
                        onChange={(e) => setItem({...item, desc: e.target.value})}
                        className="w-full h-20 bg-surface-1 border border-border rounded p-2 text-sm text-foreground focus:border-primary outline-none resize-none"
                    />
                </div>
            </div>

            {/* Preview Card */}
            <div className="md:w-1/2 flex items-center justify-center">
                <div className={`w-full bg-surface-0 border rounded-lg p-4 shadow-depth-lg relative overflow-hidden group transition-all duration-300 ${
                    item.rarity === 'lendar' ? 'border-solar-orange/50' : 
                    item.rarity === 'raro' ? 'border-cyan-blue/50' : 'border-border'
                }`}>
                    <div className={`absolute top-0 left-0 w-full h-1 ${
                        item.rarity === 'lendar' ? 'bg-gradient-to-r from-solar-orange to-magenta-red' : 
                        item.rarity === 'raro' ? 'bg-cyan-blue' : 'bg-muted'
                    }`}></div>
                    <h3 className={`font-serif font-bold text-lg ${
                         item.rarity === 'lendar' ? 'text-solar-orange' : 
                         item.rarity === 'raro' ? 'text-cyan-blue' : 'text-muted-foreground'
                    }`}>{item.name || "Nome do Item"}</h3>
                    <p className="text-xs italic text-muted-foreground mb-3">{item.type || "Tipo"}</p>
                    <div className="h-px w-full bg-border mb-3"></div>
                    <p className="text-sm text-foreground/80 leading-relaxed font-serif">
                        {item.desc || "Descrição do item aparecerá aqui..."}
                    </p>
                </div>
            </div>
        </div>
    );
};

// 5. Preview de Loja
export const ShopPreview = () => {
    const [gold, setGold] = useState(150);
    const [inventory, setInventory] = useState<string[]>([]);
    
    const items = [
        { id: 1, name: "Poção de Cura", price: 50, icon: "🧪" },
        { id: 2, name: "Corda (15m)", price: 10, icon: "➰" },
        { id: 3, name: "Espada Curta", price: 75, icon: "🗡️" },
        { id: 4, name: "Rações (1 dia)", price: 5, icon: "🍖" },
    ];

    const buyItem = (item: typeof items[0]) => {
        if (gold >= item.price) {
            setGold(prev => prev - item.price);
            setInventory(prev => [...prev, item.name]);
        }
    };

    return (
        <div className="bg-surface-0 rounded-xl border border-border h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4 bg-background/20 p-2 rounded-lg">
                <div className="text-foreground text-sm font-bold flex items-center gap-2">
                    <Coins className="text-gold" size={16} /> {gold} PO
                </div>
                <div className="text-xs text-muted-foreground">
                    Inventário: {inventory.length} itens
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {items.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => buyItem(item)}
                        disabled={gold < item.price}
                        className="flex flex-col items-center p-3 bg-surface-1 hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-surface-1 rounded-lg border border-border transition-all active:scale-95"
                    >
                        <span className="text-2xl mb-1">{item.icon}</span>
                        <span className="text-sm text-foreground font-medium">{item.name}</span>
                        <span className="text-xs text-gold font-bold">{item.price} PO</span>
                    </button>
                ))}
            </div>
            {inventory.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-secondary animate-pulse">
                        + {inventory[inventory.length-1]} adicionado!
                    </p>
                </div>
            )}
        </div>
    );
};

// 6. Preview de Documentos
export const DocumentPreview = () => {
    return (
        <div className="h-full bg-[#e8dcc5] text-gray-900 p-6 rounded-sm shadow-inner font-serif rotate-1 transform hover:rotate-0 transition-transform duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] opacity-50 pointer-events-none"></div>
            <h3 className="font-bold text-xl mb-4 border-b-2 border-gray-800 pb-2 relative z-10">A Profecia Perdida</h3>
            <p className="italic leading-relaxed relative z-10">
                "Quando a lua sangrar sobre os picos de prata,<br/>
                O rei adormecido despertará.<br/>
                Busquem a chave onde as sombras não tocam..."
            </p>
            <div className="mt-8 text-right text-sm opacity-70 relative z-10">- Arquimago Solan</div>
            <div className="absolute bottom-4 right-4 text-red-800 border-2 border-red-800 rounded-full px-2 py-1 text-xs font-bold -rotate-12 opacity-60">
                CONFIDENCIAL
            </div>
        </div>
    );
};
