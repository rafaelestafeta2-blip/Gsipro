export interface AnimatedSticker {
  id: string;
  title: string;
  category: 'obra' | 'reactions' | 'memes' | 'emojis';
  url: string;
  emoji: string;
  previewUrl?: string;
}

export const ANIMATED_STICKERS_PACKS: {
  id: string;
  name: string;
  icon: string;
  stickers: AnimatedSticker[];
}[] = [
  {
    id: 'pack-obra',
    name: '👷 GSI Obra & Ação',
    icon: '🏗️',
    stickers: [
      {
        id: 'st-crane',
        title: 'Guindaste em Ação',
        category: 'obra',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHp1bnhxdmsycGlmdmVycmwxbXZ1cmtwbHptamc3ZXZpdjMxbzRtbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/iI5CbrF7bY7vVjJvIq/giphy.gif',
        emoji: '🏗️'
      },
      {
        id: 'st-helmet',
        title: 'Segurança em Primeiro Lugar',
        category: 'obra',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNndic290bjVzcWtncWxtZm5kcmtxMXh6YmVtOGwzYTFvZndkMmpoZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/v9N2x2l8L5C5v3W9gC/giphy.gif',
        emoji: '👷'
      },
      {
        id: 'st-hammer',
        title: 'A Dar Duro na Obra',
        category: 'obra',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWVzNWF5aGlndjMxbWRwZmhwdHZycmhhd2dtOHExdnptODUzbHZ5ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/L3X9GvnlA5i8yE3E5j/giphy.gif',
        emoji: '🔨'
      },
      {
        id: 'st-coffee',
        title: 'Pausa para o Café',
        category: 'obra',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNm45dzU4bTN5NHlneXlyeXZjczN0a3E3MnQ1aXVxZ3EybWZvaW1ydCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/TDc507M5zxVK8/giphy.gif',
        emoji: '☕'
      },
      {
        id: 'st-ruler',
        title: 'Nível e Aferição',
        category: 'obra',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3EycDhkMnQwcWoxMXhheTFmMWFpdGlzbXh4aWZvaTJsbjdzazZ5MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/xT0xezQGU5xCDJuCPe/giphy.gif',
        emoji: '📐'
      }
    ]
  },
  {
    id: 'pack-reactions',
    name: '🚀 Reações & Hype',
    icon: '🔥',
    stickers: [
      {
        id: 'st-rocket',
        title: 'Foguetão A Abrir!',
        category: 'reactions',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmN2cnk0NGM5d3V2azU0dmJ3aDljZDF2b2dqZXp5OXRwMmhhZXdyOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0HlTy9x8C6K888Fi/giphy.gif',
        emoji: '🚀'
      },
      {
        id: 'st-fire',
        title: 'Fogo no Estaleiro!',
        category: 'reactions',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzgwOWU0dzgzdnV2dG0wMGJ6dmJtbnM5NWxvdmlmbXZndWdtamttOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26tP3M3i03hoI4iM8/giphy.gif',
        emoji: '🔥'
      },
      {
        id: 'st-100',
        title: 'Nota 100 Perfeito',
        category: 'reactions',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnlsNDF1dWU2Ymg0cWRtcmtsZnYxYXBqYW95bjBkb3YyZXBnY2ptbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKr3NZbh5yAQywU/giphy.gif',
        emoji: '💯'
      },
      {
        id: 'st-applause',
        title: 'Muitos Parabéns',
        category: 'reactions',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmFnMGd3cnRwbmZ4eDR4MGp0cmEwaG90dzQxbXdqOXM5b204enYyMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l3q2XhfQ8oCkm1KxO/giphy.gif',
        emoji: '👏'
      },
      {
        id: 'st-money',
        title: 'Dia de Pagamento',
        category: 'reactions',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4bDZmcDNuZXR2eWNtbWZvOHZsd2J1NTRwNjgzcmYxb3cxbDhkZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0HFkA6E4Jyv5vYjg/giphy.gif',
        emoji: '💸'
      },
      {
        id: 'st-beer',
        title: 'Sextou / Brinde!',
        category: 'reactions',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnk1OWFocWthMnN2dXJ5bHNmbXlhM3R1YWJrb3oxZTZsdjJmNHY5dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/g9582DNuQppxC/giphy.gif',
        emoji: '🍻'
      }
    ]
  },
  {
    id: 'pack-fun',
    name: '😎 Humor & Sucesso',
    icon: '🎉',
    stickers: [
      {
        id: 'st-like',
        title: 'Top / Aprovado',
        category: 'memes',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTBkOTQxdG55MjZtdHgzbjcxdTJlMnc5NWY5MmI4Mm4yMzYxMnpxbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/111ebonMs903CA/giphy.gif',
        emoji: '👍'
      },
      {
        id: 'st-party',
        title: 'Festa da Equipa',
        category: 'memes',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqcnptdzd0OHB5cTZoNWF5Z3c4MXA5NHJrc2szMm9reW1tbDdlciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/g4S2E33GBy3IAn3N5a/giphy.gif',
        emoji: '🎉'
      },
      {
        id: 'st-laugh',
        title: 'Gargalhada',
        category: 'memes',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHYxcmluM3M1Y2p3cHBqandmdTcyMGgyZmVwOG4wN3I1OHhicnAxcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MvdaYPuKXM0BW/giphy.gif',
        emoji: '😂'
      },
      {
        id: 'st-cool',
        title: 'Estilo Encarregado',
        category: 'memes',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmtjYTBpY2kwaXdmZWgzdTRqbzFlbDJ2NjhvaTlmdmxqYzI3OWllayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/dM2xuxn3Y21eeTmj4S/giphy.gif',
        emoji: '😎'
      },
      {
        id: 'st-lightning',
        title: 'Velocidade Relâmpago',
        category: 'memes',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWlmeWVtdW4waTFmODltMzR0a2hhcmlvZG95OGttNXEwYXhrcGZ3NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7qDQ4kcSD1P81VS8/giphy.gif',
        emoji: '⚡'
      },
      {
        id: 'st-heart',
        title: 'Coração de Ouro',
        category: 'memes',
        url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGxxc2lhYXdwMndxbnh4aG1uNWZvbGNvZ2UwdjAybzJ1ZHlydGplMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26hpKMTa5Hg1XQDLD/giphy.gif',
        emoji: '❤️'
      }
    ]
  }
];
