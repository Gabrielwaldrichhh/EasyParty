require('dotenv').config();
const prisma = require('../src/config/prisma');

// ─── Usuário autor dos eventos de teste ──────────────────────────────────────
const SEED_USERNAME = 'fervomap_demo';

// ─── Helpers de data ──────────────────────────────────────────────────────────
function proximoEvento(diasOffset, horaInicio, horaFim) {
  const base = new Date();
  base.setDate(base.getDate() + diasOffset);
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFim.split(':').map(Number);
  const inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hi, mi, 0);
  // Se fim < início → dia seguinte
  const diaFim = hf * 60 + mf <= hi * 60 + mi ? base.getDate() + 1 : base.getDate();
  const fim = new Date(base.getFullYear(), base.getMonth(), diaFim, hf, mf, 0);
  return { date: inicio, endDate: fim };
}

// ─── Dados dos eventos ────────────────────────────────────────────────────────
function buildEventos(authorId) {
  return [
    // ══════════ BLUMENAU — concentração principal ══════════
    {
      title: '[TESTE] Open Bar — Sexta no Madri',
      description: '⚠️ Evento de demonstração — dados fictícios para teste do FervoMap.\n\nOpen bar completo das 22h às 3h, com DJ residente e pista coberta. Venha curtir a sexta no melhor estilo Blumenau.',
      category: 'PARTY',
      ...proximoEvento(0, '22:00', '03:00'),
      price: 40,
      maxCapacity: 300,
      minAge: 18,
      latitude: -26.9192,
      longitude: -49.0661,
      address: 'Rua XV de Novembro, 1200 — Centro, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Festa Junina do Bairro Velha',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nTradição de mais de 20 anos! Forró, quadrilha, comidas típicas e muito arraiá. Entrada gratuita para crianças até 10 anos.',
      category: 'FESTIVAL',
      ...proximoEvento(1, '18:00', '23:00'),
      price: 15,
      maxCapacity: 500,
      minAge: 0,
      latitude: -26.9341,
      longitude: -49.0512,
      address: 'Rua Almirante Barroso, 340 — Bairro Velha, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Show de Rock — Garage Blumenau',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nNoite de rock com 3 bandas locais: The Broken Strings, Voltage e Neon Crash. Bar aberto a partir das 20h.',
      category: 'SHOW',
      ...proximoEvento(2, '20:00', '01:00'),
      price: 25,
      maxCapacity: 200,
      minAge: 16,
      latitude: -26.9089,
      longitude: -49.0733,
      address: 'Rua Nereu Ramos, 87 — Centro, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Torneio de Futsal — Ginásio Municipal',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nTorneio amador de futsal com 16 times inscritos. Fase de grupos sábado, semifinais e final domingo. Entrada franca para torcida.',
      category: 'SPORTS',
      ...proximoEvento(3, '08:00', '18:00'),
      price: 0,
      maxCapacity: 800,
      minAge: 0,
      latitude: -26.9244,
      longitude: -49.0801,
      address: 'Av. Brasil, 3400 — Ponta Aguda, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Workshop de Fotografia Urbana',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nAprenda técnicas de fotografia de rua com o fotógrafo Lucas Henke. Vagas limitadas. Traga sua câmera ou smartphone.',
      category: 'WORKSHOP',
      ...proximoEvento(4, '14:00', '18:00'),
      price: 60,
      maxCapacity: 20,
      minAge: 14,
      latitude: -26.9155,
      longitude: -49.0648,
      address: 'Rua 7 de Setembro, 521 — Centro, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Campeonato de League of Legends',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nTorneio 5v5 presencial com premiação em dinheiro. Inscrições abertas para times de qualquer elo. Estrutura com PCs gamer e transmissão ao vivo.',
      category: 'ESPORTS',
      ...proximoEvento(5, '10:00', '22:00'),
      price: 30,
      maxCapacity: 80,
      minAge: 14,
      latitude: -26.9198,
      longitude: -49.0580,
      address: 'Rua Curt Hering, 20 — Victor Konder, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Noite Gospel — Igreja Batista Central',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nEsperança em Canção: noite de louvor e adoração com coral de 80 vozes e banda de worship. Entrada franca.',
      category: 'RELIGIOUS',
      ...proximoEvento(1, '19:00', '22:00'),
      price: 0,
      maxCapacity: 600,
      minAge: 0,
      latitude: -26.9270,
      longitude: -49.0694,
      address: 'Rua Doutor Luís Lepper, 50 — Água Verde, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Festival Gastronômico de Blumenau',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nMais de 30 restaurantes e food trucks reunidos no Parque Ramiro Ruediger. Pratos típicos alemães, massas, frutos do mar e muito mais.',
      category: 'GASTRONOMY',
      ...proximoEvento(6, '11:00', '22:00'),
      price: 0,
      maxCapacity: 2000,
      minAge: 0,
      latitude: -26.9061,
      longitude: -49.0643,
      address: 'Parque Ramiro Ruediger — Itoupava Norte, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Peça Teatral: "A Herança"',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nDrama em 2 atos do Grupo Teatral Renascer. Baseado na obra de Thomas Ostermeier, adaptado para o contexto brasileiro. Classificação: 14 anos.',
      category: 'THEATER',
      ...proximoEvento(7, '20:00', '22:30'),
      price: 35,
      maxCapacity: 120,
      minAge: 14,
      latitude: -26.9182,
      longitude: -49.0710,
      address: 'Teatro Carlos Gomes — Rua XV de Novembro, 1971, Centro, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Happy Hour Tech — Dev Blumenau',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nEncuentro mensal de desenvolvedores, designers e empreendedores de tech. Cerveja, papo sobre carreira e networking descontraído.',
      category: 'NETWORKING',
      ...proximoEvento(2, '19:00', '22:00'),
      price: 0,
      maxCapacity: 60,
      minAge: 18,
      latitude: -26.9121,
      longitude: -49.0622,
      address: 'Coworking InovaBlu — Rua Padre Jacobs, 100, Vila Nova, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Rave Industrial — Complexo Hering',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nNão é uma festa comum. Ambiente industrial, som 3D, line-up com DJs de Berlin e São Paulo. Das 23h ao amanhecer.',
      category: 'PARTY',
      ...proximoEvento(3, '23:00', '06:00'),
      price: 80,
      maxCapacity: 600,
      minAge: 18,
      latitude: -26.9310,
      longitude: -49.0768,
      address: 'Complexo Industrial Hering — Rua Ingo Hering, Blumenau SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Corrida Rústica do Parque',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\n10km pela trilha do Parque Municipal São Francisco de Assis. Categorias: elite, amador e caminhada. Kit do corredor incluso na inscrição.',
      category: 'SPORTS',
      ...proximoEvento(8, '07:00', '11:00'),
      price: 50,
      maxCapacity: 400,
      minAge: 16,
      latitude: -26.8980,
      longitude: -49.1150,
      address: 'Parque São Francisco de Assis — Blumenau SC',
      isPublic: true,
      authorId,
    },

    // ══════════ FLORIANÓPOLIS ══════════
    {
      title: '[TESTE] Sundowner — Praia de Jurerê',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nFesta ao entardecer na beira da praia de Jurerê Internacional. DJ set de deep house, gin tônica e vista pro mar. Começa às 17h.',
      category: 'PARTY',
      ...proximoEvento(1, '17:00', '23:00'),
      price: 60,
      maxCapacity: 250,
      minAge: 18,
      latitude: -27.4313,
      longitude: -48.5233,
      address: 'Jurerê Internacional — Florianópolis SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Campeonato Catarinense de Surf',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nEtapa oficial do campeonato estadual na Praia Mole. Categorias adulto masculino e feminino, júnior e master. Entrada franca para o público.',
      category: 'SPORTS',
      ...proximoEvento(4, '07:00', '17:00'),
      price: 0,
      maxCapacity: null,
      minAge: 0,
      latitude: -27.5987,
      longitude: -48.4553,
      address: 'Praia Mole — Florianópolis SC',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Festival Internacional de Dança',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\n3 dias de espetáculos com companhias do Brasil, Argentina e Portugal. Ballet clássico, contemporâneo e danças folclóricas no Teatro Ademir Rosa.',
      category: 'FESTIVAL',
      ...proximoEvento(5, '20:00', '23:00'),
      price: 45,
      maxCapacity: 350,
      minAge: 0,
      latitude: -27.5969,
      longitude: -48.5495,
      address: 'Teatro Ademir Rosa — CIC, Florianópolis SC',
      isPublic: true,
      authorId,
    },

    // ══════════ SÃO PAULO ══════════
    {
      title: '[TESTE] Ultra Music Festival SP',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nEdição paulistana do maior festival de música eletrônica do mundo. 3 palcos, 40+ artistas internacionais, 2 dias de festa no Autódromo de Interlagos.',
      category: 'FESTIVAL',
      ...proximoEvento(10, '14:00', '06:00'),
      price: 380,
      maxCapacity: 30000,
      minAge: 18,
      latitude: -23.7011,
      longitude: -46.6978,
      address: 'Autódromo de Interlagos — São Paulo SP',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Show Ana Castela — Allianz Parque',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nAna Castela em sua maior turnê pelo Brasil. Abertura com Cristiano Araújo Jr. Portões abrem às 17h, show começa às 20h.',
      category: 'SHOW',
      ...proximoEvento(12, '20:00', '23:30'),
      price: 180,
      maxCapacity: 43000,
      minAge: 0,
      latitude: -23.5270,
      longitude: -46.6766,
      address: 'Allianz Parque — Av. Francisco Matarazzo, 1705, São Paulo SP',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Maratona de SP — Largada Ibirapuera',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\n42km pelas avenidas de São Paulo. Largada e chegada no Parque Ibirapuera. Categorias: maratona, meia maratona e 10km. Inscrições encerradas.',
      category: 'SPORTS',
      ...proximoEvento(9, '06:00', '13:00'),
      price: 120,
      maxCapacity: 15000,
      minAge: 18,
      latitude: -23.5874,
      longitude: -46.6576,
      address: 'Parque Ibirapuera — São Paulo SP',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Feira Gastronômica Liberdade',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nO maior evento gastronômico oriental do Brasil. Culinária japonesa, chinesa, coreana e tailandesa. Toda semana no bairro da Liberdade.',
      category: 'GASTRONOMY',
      ...proximoEvento(0, '10:00', '20:00'),
      price: 0,
      maxCapacity: null,
      minAge: 0,
      latitude: -23.5588,
      longitude: -46.6333,
      address: 'Praça da Liberdade — São Paulo SP',
      isPublic: true,
      authorId,
    },

    // ══════════ RIO DE JANEIRO ══════════
    {
      title: '[TESTE] Baile Funk — Pedra do Sal',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nO clássico baile na Pedra do Sal, berço do samba e do funk carioca. Toda segunda e sexta, entrada franca. Um patrimônio cultural do Rio.',
      category: 'PARTY',
      ...proximoEvento(2, '21:00', '02:00'),
      price: 0,
      maxCapacity: null,
      minAge: 18,
      latitude: -22.8962,
      longitude: -43.1823,
      address: 'Pedra do Sal — Gamboa, Rio de Janeiro RJ',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Peça: "O Auto da Compadecida" — Teatro Municipal',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nClássico de Ariano Suassuna em nova montagem do Grupo Galpão. Uma das maiores obras do teatro brasileiro reimaginada para 2025.',
      category: 'THEATER',
      ...proximoEvento(6, '19:30', '22:00'),
      price: 70,
      maxCapacity: 780,
      minAge: 0,
      latitude: -22.9102,
      longitude: -43.1759,
      address: 'Teatro Municipal do Rio — Praça Floriano, Rio de Janeiro RJ',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Torneio de Beach Tennis — Copacabana',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nTorneio open de Beach Tennis na areia de Copacabana. Duplas mistas e femininas. Premiação em troféu e produtos esportivos.',
      category: 'SPORTS',
      ...proximoEvento(3, '08:00', '17:00'),
      price: 40,
      maxCapacity: 200,
      minAge: 16,
      latitude: -22.9668,
      longitude: -43.1746,
      address: 'Posto 5 — Praia de Copacabana, Rio de Janeiro RJ',
      isPublic: true,
      authorId,
    },

    // ══════════ CURITIBA ══════════
    {
      title: '[TESTE] Sarau Literário — Livraria Ouvidor',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nNoite de poesia, prosa e música ao vivo. Espaço aberto para leituras dos participantes. Traz seu texto ou só venha ouvir.',
      category: 'OTHER',
      customCategory: 'Sarau Cultural',
      ...proximoEvento(1, '19:00', '22:00'),
      price: 0,
      maxCapacity: 80,
      minAge: 16,
      latitude: -25.4284,
      longitude: -49.2733,
      address: 'Rua Mateus Leme, 50 — São Francisco, Curitiba PR',
      isPublic: true,
      authorId,
    },
    {
      title: '[TESTE] Feira Orgânica do Passeio Público',
      description: '⚠️ Evento de demonstração — dados fictícios.\n\nProdutores rurais direto ao consumidor. Frutas, legumes, mel, queijos artesanais e flores. Todo sábado das 8h ao meio-dia.',
      category: 'GASTRONOMY',
      ...proximoEvento(5, '08:00', '12:00'),
      price: 0,
      maxCapacity: null,
      minAge: 0,
      latitude: -25.4166,
      longitude: -49.2696,
      address: 'Passeio Público — Centro, Curitiba PR',
      isPublic: true,
      authorId,
    },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed de eventos de teste...\n');

  // Cria ou reutiliza usuário demo
  const bcrypt = require('bcrypt');
  const senhaHash = await bcrypt.hash('Demo@12345', 10);

  const author = await prisma.user.upsert({
    where:  { username: SEED_USERNAME },
    update: {},
    create: {
      username:    SEED_USERNAME,
      email:       'demo@fervomap.com.br',
      password:    senhaHash,
      displayName: 'FervoMap Demo',
      bio:         '🤖 Conta de demonstração — eventos fictícios para teste da plataforma.',
    },
  });

  console.log(`✅ Usuário demo: @${author.username} (${author.id})\n`);

  // Remove eventos de teste anteriores deste autor
  const deletados = await prisma.event.deleteMany({
    where: { authorId: author.id },
  });
  if (deletados.count > 0) {
    console.log(`🗑️  ${deletados.count} eventos anteriores removidos\n`);
  }

  // Cria os eventos
  const eventos = buildEventos(author.id);
  let criados = 0;

  for (const ev of eventos) {
    await prisma.event.create({ data: ev });
    console.log(`  ✓ ${ev.title}`);
    criados++;
  }

  console.log(`\n🎉 ${criados} eventos de teste criados com sucesso!`);
  console.log('\n⚠️  Todos os eventos têm "[TESTE]" no título e aviso na descrição.');
  console.log('   Para remover, rode: node prisma/seed.js --limpar\n');
}

// ─── Modo limpar ──────────────────────────────────────────────────────────────

async function limpar() {
  const author = await prisma.user.findUnique({ where: { username: SEED_USERNAME } });
  if (!author) { console.log('Nenhum dado de teste encontrado.'); return; }

  const { count } = await prisma.event.deleteMany({ where: { authorId: author.id } });
  console.log(`🗑️  ${count} eventos de teste removidos.`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const fn = args.includes('--limpar') ? limpar : main;

fn()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
