/**
 * Gestão do Dia — ONG Amigos de Maribondo
 * Backend em Google Apps Script. Banco de dados: uma Planilha Google.
 * Fotos de chegada: uma pasta no Google Drive.
 *
 * Instalação (uma vez): rode a função "setup" e depois implante como App da Web.
 * O plano do dia é editado direto na planilha, aba "Tarefas" (só você tem acesso).
 */

const TZ = 'America/Maceio';
const HEAD = {
  Equipe:  ['id', 'nome', 'cor', 'pin', 'aparelho', 'telefone', 'foto_ref'],
  Tarefas: ['dia', 'id', 'hora', 'ordem', 'turno', 'titulo', 'pessoas', 'itens', 'metas', 'atividade', 'fim'],
  Status:  ['chave', 'dia', 'bloco', 'estado', 'inicio', 'fim', 'lista', 'foto', 'por', 'suporte', 'suporte_hora', 'suporte_por', 'suporte_msg', 'suporte_lat', 'suporte_lng', 'prazo_pedido', 'prazo_opcao', 'prazo_por', 'prazo_ext', 'suporte_resp', 'suporte_resp_hora', 'suporte_cobrado', 'foto_conclusao', 'avaliacao', 'avaliacao_obs', 'avaliacao_hora', 'freq_url', 'freq_hora', 'freq_por'],
  Diagnostico: ['de', 'ate', 'pessoa', 'pts', 'meta', 'pct', 'advertencias', 'nao_feitas_com_prazo', 'atrasos', 'faltas', 'fora_do_app', 'gerado_em'],
  Demandas: ['id', 'dia', 'hora', 'ms', 'pessoa', 'item', 'detalhe', 'estado', 'atendida_por', 'atendida_hora', 'atendida_ms', 'resposta'],
  Visitas: ['id', 'criada_em', 'criada_por', 'regiao', 'nome', 'telefone', 'data', 'responsaveis', 'estado', 'realizada_hora', 'realizada_por'],
  Eventos: ['dia', 'hora', 'ms', 'tipo', 'pessoa', 'bloco', 'texto', 'publico', 'alvo'],
  Horarios: ['pessoa', 'dias', 'inicio', 'fim', 'obs'],
  Ponto:   ['chave', 'dia', 'pessoa', 'entManha', 'saiManha', 'entTarde', 'saiTarde', 'foto_entManha', 'foto_entTarde', 'ultimo', 'ultimo_ms'],
  Fechamento: ['dia', 'hora', 'por', 'opcao', 'obs'],
  Participantes: ['id', 'programa', 'nome', 'telefone', 'endereco', 'sus', 'responsavel', 'ativo', 'criado_em', 'criado_por'],
  Presencas: ['chave', 'dia', 'programa', 'participante', 'presente', 'por', 'hora'],
  SaudeRegistros: ['id', 'nome', 'telefone', 'endereco', 'especialidade', 'data', 'situacao', 'obs', 'criado_em', 'por', 'atualizado_em'],
  EditaisRegistros: ['id', 'nome', 'numero', 'link', 'prazo', 'situacao', 'obs', 'plano_url', 'plano_nome', 'criado_em', 'por', 'atualizado_em'],
  ImportacoesFrequencia: ['dia', 'hora', 'programa', 'por', 'vieram', 'faltaram', 'novos', 'pdf_url'],
  Indiretas: ['id', 'dia', 'pessoa', 'obs', 'por', 'criado'],
  Carteirinhas: ['numero', 'dia', 'hora', 'programa', 'participante', 'nome', 'telefone', 'endereco', 'sus', 'por'],
  Config: ['chave', 'valor', 'atualizado', 'por'],
  Engajamento: ['id', 'dia', 'hora', 'pessoa', 'tipo', 'pontos', 'print', 'post', 'estado', 'criado', 'thumb'],
  Galeria: ['id', 'url', 'legenda', 'criado', 'por'],
  Folha: ['id', 'pessoa', 'funcao', 'valor', 'data_pagamento', 'adicoes', 'obs', 'atualizado'],
  SelosSemana: ['id', 'semana', 'pessoa', 'selo', 'obs', 'por', 'criado'],
  Suportes: ['id', 'dia', 'hora', 'ms', 'pessoa', 'categoria', 'texto', 'estado', 'resposta', 'resp_por', 'resp_hora'],
  Membros: ['num', 'nome', 'telefone', 'endereco', 'rg', 'cpf', 'sus', 'instagram', 'nascimento', 'moradores', 'obs', 'criado', 'por', 'atualizado'],
  MembroDocs: ['id', 'num', 'tipo', 'nome', 'mime', 'file_id', 'dia', 'descricao', 'por'],
  MembroSolicitacoes: ['id', 'num', 'dia', 'data', 'texto', 'estado', 'por'],
  PresencaMembros: ['id', 'dia', 'hora', 'ms', 'num', 'nome', 'tipo', 'atividade', 'por'],
  Atendimentos: ['ficha', 'dia', 'entrada', 'inicio', 'ms', 'num', 'nome', 'tema', 'data_marcada', 'descricao', 'por'],
  Selfies: ['id', 'dia', 'hora', 'ms', 'pessoa', 'url', 'usada', 'lat', 'lng', 'acc', 'dist', 'na_ong', 'rosto', 'rosto_dist'],
  ConfirmaOng: ['id', 'dia', 'hora', 'pessoa', 'lat', 'lng', 'dist'],
  DocsONG: ['id', 'nome', 'ext', 'mime', 'file_id', 'tamanho', 'dia', 'por'],
  AvisoVistos: ['chave', 'ms', 'dia', 'pessoa', 'hora'],
  Registros: ['dia', 'pessoa', 'tipo', 'hora', 'ms', 'foto', 'motivo', 'obs', 'lat', 'lng', 'precisao_m', 'distancia_m']
};
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/* Quem pode ver o painel, montar o dia e gerar relatórios (use o "id" da aba Equipe). */
const GESTORES = ['victor', 'lucas'];
const DONO = 'victor';                       // só ele vê a folha de pagamento
const PRIVADOS = ['victor', 'teste'];        // atividades dessas pessoas só aparecem para elas mesmas
const SEM_LOCAL = ['teste'];                 // usuário de teste: não precisa estar na ONG
const INICIO_GERAL = '2026-11-10';           // tudo (pontos, faltas, pendências) conta a partir de terça 10/11, 08h
const ENG_TIPOS = { curtida: { t: 'Curtida + comentário', p: 2 }, repost: { t: 'Repost', p: 4 }, status: { t: 'Status', p: 3 } };
const SELOS_EVOL = { ritmo: 'No ritmo', evoluir: 'Precisa evoluir', conversar: 'Conversar pessoalmente', urgente: 'Resolver urgente conduta' };
const PODCAST_PADRAO = [
  { h: '07:00', t: 'Diego Menin · Confiar nos planos de Deus', rss: 'https://feeds.soundcloud.com/users/soundcloud:users:729177130/sounds.rss', busca: 'deus|plano|confi', link: 'https://open.spotify.com/show/5TVTgp34CM9Lzx1koboexk' },
  { h: '12:00', t: 'Joel Jota · Dar o seu melhor', rss: 'https://anchor.fm/s/e9728c8/podcast/rss', busca: 'melhor|excel|disciplina|consist', link: 'https://open.spotify.com/show/6wqBtC9OMq2mLvhDjZbqVM' },
  { h: '19:00', t: 'Guto Galamba · Foco', rss: '', busca: 'foco', link: 'https://www.youtube.com/results?search_query=Guto+Galamba+foco' }
];
const MSG_PADRAO = [
  { k: 'confirmar', t: 'Confirmar presença', m: 'Olá, {nome}! 💙 Aqui é da ONG Amigos de Maribondo. Confirma sua presença hoje no {programa}? Responda SIM que a gente te espera! 🙌' },
  { k: 'vamos', t: 'Vamos pra atividade', m: 'Oi, {nome}! Bora pra atividade do {programa} hoje? Estamos te esperando na ONG Amigos de Maribondo! 💪' },
  { k: 'cade', t: 'Cadê você hoje?', m: 'Oi, {nome}! Cadê você hoje? 👀 A turma do {programa} está te esperando aqui na ONG.' },
  { k: 'falta', t: 'Estamos sentindo sua falta', m: 'Oi, {nome}! Estamos sentindo sua falta no {programa} 💙 Volta pra gente? Qualquer coisa, fala com a gente por aqui.' }
];
const MSG_DOACAO = 'Oi! Tudo bem? 💙 Eu faço parte da ONG Amigos de Maribondo, que está reescrevendo histórias aqui na nossa comunidade com crianças, idosos e famílias. Quer ser padrinho ou madrinha da ONG? Com qualquer valor por mês você ajuda a manter as atividades. Posso te mandar como contribuir? Instagram: https://www.instagram.com/amigosdemaribondoal/';
// Primeiro acesso: no 1º dia de uso de cada pessoa, até 12h, ponto e atividades valem sem localização.
const LOC_LIVRE_ATE = 12 * 60;
// Até sexta 13/11 (inclusive): entrada só com PIN (sem trava de celular) e ponto/atividades sem localização.
const LIBERADO_ATE = '2026-11-13 08:00'; // até sexta 08h: entra só com PIN/selfie e confirma "Estou na ONG"
function liberadoGeral_() { return (hoje_() + ' ' + agora_()) < LIBERADO_ATE; }
function locLivrePrimeiro_(pessoa) {
  if (pessoa && liberadoGeral_()) return true;
  if (!pessoa || mins_(agora_()) >= LOC_LIVRE_ATE) return false;
  const hoje = hoje_(), v = sheet_('Registros').getDataRange().getDisplayValues();
  for (let i = 1; i < v.length; i++) if (v[i][1] === pessoa && v[i][0] && v[i][0] < hoje && v[i][0] >= INICIO_GERAL) return false;
  return true;
}
/* Minutos de tolerância antes de contar atraso (chegou até 10 min depois = no horário). */
const TOLERANCIA = 10;
/* Minutos depois do horário previsto para o alerta de "não chegou". */
const ALERTA_APOS = 15;
/* Distância máxima (metros) da sede para o registro contar como "na sede". */
const RAIO_SEDE = 200;
/* Intervalo de almoço de quem trabalha nos dois turnos. */
const ALMOCO_INI = 11 * 60 + 50, ALMOCO_FIM = 14 * 60;
const MOTIVOS = { fim: 'Fim do expediente', intervalo: 'Intervalo', almoco: 'Intervalo', externa: 'Atividade externa', emergencia: 'Saída emergencial' };
const DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
/* Link do app para a equipe. */
const APP_URL = 'https://amigosdemaribondo.github.io/app/';
/* Para marcar Iniciado/Concluído: precisa estar dentro da ONG, com precisão de GPS até este valor (m). */
const PRECISAO_MAX_TAREFA = 100;
/* Pode iniciar a tarefa até X minutos antes do horário de início. */
const ANTECEDENCIA_INICIO = 30;
/* "Turno adicional" estende o prazo em X minutos. */
const TURNO_ADICIONAL_MIN = 120;
let DEVICE_ = null, LOC_ = null;
/* Tarefa não iniciada X minutos depois do horário marcado = atrasada (vermelho + alerta). */
const ATRASO_INICIO_MIN = 60;
/* Prazo para a coordenação responder um pedido de suporte. */
const SUPORTE_RESPOSTA_MIN = 120;
const DEMANDA_PRAZO_H = 5;          // demandas devem ser respondidas em até 5h
/* A lista de frequência das atividades em grupo deve ser enviada até X min após o fim. */
const FREQ_PRAZO_MIN = 30;
/* Demandas da equipe (botões fixos). max = caracteres do campo de texto, quando houver. */
const DEMANDAS = [
  { k: 'agua_terminando', g: 'Abastecimento', t: 'Água mineral · terminando' }, { k: 'agua_terminou', g: 'Abastecimento', t: 'Água mineral · terminou' },
  { k: 'copos_terminando', g: 'Abastecimento', t: 'Copos · terminando' }, { k: 'copos_terminou', g: 'Abastecimento', t: 'Copos · terminou' },
  { k: 'papel_terminando', g: 'Abastecimento', t: 'Papel · terminando' }, { k: 'papel_terminou', g: 'Abastecimento', t: 'Papel · terminou' },
  { k: 'bolacha_terminando', g: 'Abastecimento', t: 'Bolacha e confeito · terminando' }, { k: 'bolacha_terminou', g: 'Abastecimento', t: 'Bolacha e confeito · terminou' },
  { k: 'cafe_terminando', g: 'Abastecimento', t: 'Açúcar e café individuais · terminando' }, { k: 'cafe_terminou', g: 'Abastecimento', t: 'Açúcar e café individuais · terminou' },
  { k: 'mkt', g: 'Comunicação', t: 'MKT não chegou' }, { k: 'video', g: 'Comunicação', t: 'Vídeo não foi entregue' },
  { k: 'saude', g: 'Saúde', t: 'Material de saúde', max: 20 },
  { k: 'lanche_flor', g: 'Lanches', t: 'Lanche do Flor da Idade' }, { k: 'lanche_kids', g: 'Lanches', t: 'Lanche do Kids' },
  { k: 'reuniao', g: 'Reunião', t: 'Reunião emergencial', max: 10 },
  { k: 'chamex', g: 'Escritório', t: 'Papel chamex' }, { k: 'tinta', g: 'Escritório', t: 'Tinta da impressora' }, { k: 'escritorio', g: 'Escritório', t: 'Canetas e material de escritório' },
  { k: 'agua_caixa', g: 'Estrutura', t: 'Água da caixa da ONG' }, { k: 'feira_sopa', g: 'Estrutura', t: 'Feira da sopa' },
  { k: 'gas', g: 'Estrutura', t: 'Gás' }, { k: 'energia', g: 'Estrutura', t: 'Energia' },
  { k: 'adicional', g: 'Demandas adicionais', t: 'Demanda adicional', max: 30 },
  { k: 'ideia', g: 'Ideias para a ONG evoluir', t: 'Ideia para evolução da ONG', max: 700 }
];
/* Considera "online" quem usou o app nos últimos X minutos. */
const ONLINE_MIN = 5;

/* ------------------------------------------------------------------ */
/* Instalação                                                          */
/* ------------------------------------------------------------------ */

function setup() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('SHEET_ID')) {
    Logger.log('Já instalado. Planilha: ' + SpreadsheetApp.openById(p.getProperty('SHEET_ID')).getUrl());
    return;
  }
  // Reaproveita a planilha e a pasta que já existem no Drive, se houver.
  const NOME_PLAN = 'Gestão do Dia — ONG Amigos de Maribondo';
  const NOME_PASTA = 'Ponto — fotos de chegada (ONG Amigos de Maribondo)';
  const achadas = DriveApp.getFilesByName(NOME_PLAN);
  if (achadas.hasNext()) {
    const plan = achadas.next();
    const pastas = DriveApp.getFoldersByName(NOME_PASTA);
    const pastaExist = pastas.hasNext() ? pastas.next() : DriveApp.createFolder(NOME_PASTA);
    p.setProperties({ SHEET_ID: plan.getId(), FOLDER_ID: pastaExist.getId() });
    Logger.log('Ligado à planilha que já existia: ' + plan.getUrl());
    Logger.log('Os PINs continuam os mesmos, na aba "Equipe".');
    return;
  }
  const ss = SpreadsheetApp.create(NOME_PLAN);
  Object.keys(HEAD).forEach((name, i) => {
    const sh = i === 0 ? ss.getSheets()[0].setName(name) : ss.insertSheet(name);
    sh.getRange(1, 1, 1000, HEAD[name].length).setNumberFormat('@');
    sh.getRange(1, 1, 1, HEAD[name].length).setValues([HEAD[name]]).setFontWeight('bold').setBackground('#E9EDF4');
    sh.setFrozenRows(1);
  });

  const equipe = [
    ['patricia', 'Patrícia', '#9333EA'], ['lucas', 'Lucas', '#2563EB'], ['victor', 'Victor', '#4F46E5'],
    ['kallyne', 'Kallyne', '#DB2777'], ['bruna', 'Bruna', '#EA580C'], ['piedade', 'Piedade', '#16A34A'],
    ['klaudinha', 'Klaudinha', '#DC2626'], ['freitas', 'Freitas', '#0D9488'], ['nivaldo', 'Nivaldo', '#B45309'],
    ['binha', 'Binha', '#4D7C0F'], ['gemea', 'Gêmea', '#0891B2']
  ].map(r => r.concat([String(1000 + Math.floor(Math.random() * 9000))]));
  ss.getSheetByName('Equipe').getRange(2, 1, equipe.length, 4).setValues(equipe);

  const D = '2026-11-09';
  const t = (id, hora, ordem, turno, titulo, pessoas, itens, metas, ativ) =>
    [D, id, hora, String(ordem), turno, titulo, pessoas.join(','), itens.join(' | '), (metas || []).join(' | '), ativ ? 'sim' : 'não'];
  const tarefas = [
    t('b01', '08h', 480, 'manha', 'Abrir a sede', ['lucas'], ['Tirar cópias: fichas + panfletos', 'Separar a arte nova impressa']),
    t('b02', '08h', 481, 'manha', 'Recepção', ['patricia'], ['Marcações, consultas, RG e matrículas', 'Até 12h']),
    t('b03', '10h', 600, 'manha', 'Busca ativa · Flor da Idade', ['lucas', 'victor'], ['Ligações e mensagens', 'Levar arte nova, panfleto e ficha'], ['50 contatos', '25 confirmações']),
    t('b04', '11h30', 690, 'manha', 'Lanche do Kids + Flor', ['patricia'], ['Fazer a lista e comprar', 'Guardar nota ou recibo'], ['Limite R$ 100']),
    t('b05', '14h', 840, 'tarde', 'Abrir + saúde', ['kallyne'], ['Psicologia: terça ou depois? Avisar todos', 'Relatório geral de saúde atualizado', 'Lista de exames por especialidade']),
    t('b06', '14h', 841, 'tarde', 'Busca ativa interna', ['patricia'], ['Nome, telefone e endereço', 'Frequência e necessidade de transporte', 'Subir tudo no sistema novo no fim']),
    t('b07', '14h', 842, 'tarde', 'Busca ativa nas casas', ['lucas', 'bruna'], ['Levar ficha + panfleto'], ['25 visitas', '15 confirmações']),
    t('b08', '14h', 843, 'tarde', 'Motorista', ['binha'], ['Disponível das 14h às 18h', 'Transporte dos idosos do Flor da Idade']),
    t('b09', '15h30', 930, 'ativ', 'Chegar 30 min antes', ['piedade'], ['Verificar os materiais da saúde']),
    t('b10', '16h', 960, 'ativ', 'Flor da Idade', ['klaudinha', 'piedade', 'freitas', 'nivaldo', 'gemea', 'patricia'], ['Direção da atividade e suporte', 'Lista de frequência: Patrícia', 'MKT Gêmea: gravar, editar e postar · acompanhar tudo'], [], true),
    t('b11', '17h', 1020, 'ativ', 'Kids', ['klaudinha', 'gemea', 'patricia'], ['Caixa de som carregada', 'Termos dos pais', 'Lista de frequência: Patrícia', 'MKT Gêmea: gravar, editar e postar'], [], true),
    t('b12', '18h', 1079, 'ativ', 'Copos e água', ['freitas'], ['Conferir antes das 18h']),
    t('b13', '18h', 1080, 'ativ', 'Dança', ['klaudinha', 'gemea', 'patricia'], ['Lista de frequência: Patrícia', 'MKT Gêmea: gravar, editar e postar'], [], true),
    t('b14', 'Fim', 1200, 'ativ', 'Fechar a ONG', ['klaudinha'], ['Conferir se as listas ficaram com a Patrícia'])
  ];
  ss.getSheetByName('Tarefas').getRange(2, 1, tarefas.length, HEAD.Tarefas.length).setValues(tarefas);

  const pasta = DriveApp.createFolder(NOME_PASTA);
  p.setProperties({ SHEET_ID: ss.getId(), FOLDER_ID: pasta.getId() });

  Logger.log('Pronto! Planilha: ' + ss.getUrl());
  Logger.log('Pasta das fotos: ' + pasta.getUrl());
  Logger.log('Os PINs de cada pessoa estão na aba "Equipe" da planilha.');
}

/* ------------------------------------------------------------------ */
/* App da Web                                                          */
/* ------------------------------------------------------------------ */

function doGet() {
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<div style="font-family:system-ui,sans-serif;max-width:420px;margin:15vh auto;padding:16px;text-align:center">'
    + '<h2>O app Gestão do Dia mudou de endereço</h2><p>Abra pelo link abaixo:</p>'
    + '<p><a href="' + APP_URL + '" target="_top" style="font-size:18px;font-weight:700">' + APP_URL + '</a></p></div>')
    .setTitle('Gestão do Dia')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ------------------------------------------------------------------ */
/* API para o site no GitHub Pages                                     */
/* ------------------------------------------------------------------ */

function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    try { if (!PropertiesService.getScriptProperties().getProperty('RECOMECO_V25')) recomeco_(); } catch (err) { Logger.log(err); }
    DEVICE_ = req.device ? String(req.device).slice(0, 64) : null;
    LOC_ = req.loc && isFinite(Number(req.loc.lat)) && isFinite(Number(req.loc.lng)) ? { lat: Number(req.loc.lat), lng: Number(req.loc.lng), acc: Number(req.loc.acc) || 0, ms: Number(req.loc.ms) || 0 } : null;
    const fns = { salvarCampanha: salvarCampanha, encerrarCampanha: encerrarCampanha, estouNaOng: estouNaOng, salvarFotoRef: salvarFotoRef, minhaFotoRef: minhaFotoRef, verFotoRef: verFotoRef, selfiesHoje: selfiesHoje, verSelfie: verSelfie, emitirCarteirinhaMembro: emitirCarteirinhaMembro, selfieLogin: selfieLogin, docsOng: docsOng, addDocOng: addDocOng, baixarDocOng: baixarDocOng, renomearDocOng: renomearDocOng, delDocOng: delDocOng, importarTelefones: importarTelefones, confirmarAviso: confirmarAviso, cobrarPonto: cobrarPonto, pedirSuporteGeral: pedirSuporteGeral, resolverSuporteGeral: resolverSuporteGeral, membros: membros, membro: membro, salvarMembro: salvarMembro,
      addDocMembro: addDocMembro, arquivoMembro: arquivoMembro, delDocMembro: delDocMembro, presencaMembro: presencaMembro, addSolicitacaoMembro: addSolicitacaoMembro,
      marcarSolicitacaoMembro: marcarSolicitacaoMembro, atendimentos: atendimentos, novoAtendimento: novoAtendimento, moverTarefa: moverTarefa, alertaEquipe: alertaEquipe, cobrarColaborador: cobrarColaborador, remanejarPessoa: remanejarPessoa, novoPinColaborador: novoPinColaborador, vozesHoje: vozesHoje, voz: voz, salvarConfig: salvarConfig, podcast: podcast, registrarEngajamento: registrarEngajamento, invalidarEngajamento: invalidarEngajamento,
      addGaleria: addGaleria, delGaleria: delGaleria, folha: folha, salvarFolha: salvarFolha, salvarSeloSemana: salvarSeloSemana, salvarMeuWhats: salvarMeuWhats, enviarDiagnostico: enviarDiagnostico, getData: getData, login: login, setStatus: setStatus, punch: punch, painel: painel, addTarefa: addTarefa, delTarefa: delTarefa, copiarDia: copiarDia,
      gerarRelatorio: gerarRelatorio, definirSede: definirSede, decidirPrazo: decidirPrazo, liberarAparelho: liberarAparelho,
      responderSuporte: responderSuporte, equipeCadastro: equipeCadastro, salvarColaborador: salvarColaborador,
      avaliarTarefa: avaliarTarefa, enviarFrequencia: enviarFrequencia, criarDemanda: criarDemanda, atenderDemanda: atenderDemanda,
      salvarVisita: salvarVisita, marcarVisita: marcarVisita, excluirVisita: excluirVisita, editarTarefa: editarTarefa, fecharDia: fecharDia,
      programas: programas, salvarParticipante: salvarParticipante, marcarPresenca: marcarPresenca,
      emitirCarteirinha: emitirCarteirinha, importarPresenca: importarPresenca, saude: saude, salvarSaude: salvarSaude, excluirSaude: excluirSaude,
      editais: editais, salvarEdital: salvarEdital, excluirEdital: excluirEdital,
      sequenciaTarefa: sequenciaTarefa, previaProgramacao: previaProgramacao, aplicarProgramacao: aplicarProgramacao,
      financeiro: financeiro, addLancamento: addLancamento, marcarLancamento: marcarLancamento, delLancamento: delLancamento, verComprovante: verComprovante,
      painelAoVivo: painelAoVivo, painelPublico: painelPublico, salvarMetasPainel: salvarMetasPainel, salvarOrganograma: salvarOrganograma, addPadrinho: addPadrinho, padrinhosLista: padrinhosLista,
      mkEquipeLista: mkEquipeLista, mkLogin: mkLogin, mkCarregar: mkCarregar, mkSalvar: mkSalvar, mkPatch: mkPatch, mkPulso: mkPulso, mkChat: mkChat, mkArquivo: mkArquivo, mkEquipeSalvar: mkEquipeSalvar, mkMeuPerfil: mkMeuPerfil,
      maCarregar: maCarregar, maSalvar: maSalvar, maFoto: maFoto, maArquivo: maArquivo, maRss: maRss,
      pontuacao: pontuacao, registrarIndireta: registrarIndireta, validarIdeia: validarIdeia };
    if (!fns[req.fn]) throw new Error('Função desconhecida.');
    out = { ok: true, data: fns[req.fn].apply(null, req.args || []) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* Planilha                                                            */
/* ------------------------------------------------------------------ */

/* Desempenho: abre a planilha uma vez por chamada e reaproveita leituras nas consultas (sem escrita no meio). */
let SS_ = null, RC_ = null;
const SHEETS_ = {};
function ss_() { return SS_ || (SS_ = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'))); }
function comLeituraRapida_(fn) { RC_ = {}; try { return fn(); } finally { RC_ = null; } }

function sheet_(name) {
  if (SHEETS_[name]) return SHEETS_[name];
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh && HEAD[name]) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1000, HEAD[name].length).setNumberFormat('@');
    sh.getRange(1, 1, 1, HEAD[name].length).setValues([HEAD[name]]).setFontWeight('bold').setBackground('#E9EDF4');
    sh.setFrozenRows(1);
  } else if (sh && HEAD[name]) {
    // acrescenta colunas novas no cabeçalho, se a planilha for de uma versão anterior
    const atual = sh.getRange(1, 1, 1, HEAD[name].length).getDisplayValues()[0];
    if (atual.join('|') !== HEAD[name].join('|')) sh.getRange(1, 1, 1, HEAD[name].length).setValues([HEAD[name]]).setFontWeight('bold').setBackground('#E9EDF4');
  }
  if (sh) SHEETS_[name] = sh;
  return sh;
}

function rows_(name) {
  let v = RC_ && RC_[name];
  if (!v) { v = sheet_(name).getDataRange().getDisplayValues(); if (RC_) RC_[name] = v; }
  const h = v[0];
  return v.slice(1).filter(r => r.join('') !== '').map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; });
}

function upsert_(name, chave, obj) {
  const sh = sheet_(name);
  if (RC_) delete RC_[name];
  const h = HEAD[name];
  const col = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getDisplayValues().map(r => r[0]);
  let row = col.indexOf(chave) + 1;
  if (row < 1) row = sh.getLastRow() + 1;
  const cur = row <= sh.getLastRow() ? sh.getRange(row, 1, 1, h.length).getDisplayValues()[0] : h.map(() => '');
  const next = h.map((k, i) => (k in obj ? String(obj[k] ?? '') : cur[i]));
  next[0] = chave;
  sh.getRange(row, 1, 1, h.length).setNumberFormat('@').setValues([next]);
  return next;
}

function hoje_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function agora_() { return Utilities.formatDate(new Date(), TZ, 'HH:mm'); }

function nomeDia_(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return DIAS_SEMANA[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
}

function checkPin_(pessoa, pin) {
  const p = rows_('Equipe').find(r => r.id === pessoa);
  if (!p || String(p.pin).trim() !== String(pin).trim()) throw new Error('PIN incorreto.');
  if (GESTORES.indexOf(pessoa) >= 0 || liberadoGeral_()) { marcarOnline_(pessoa); return p; }  // até sexta: só o PIN basta
  if (!DEVICE_) throw new Error('Abra o app pelo link ' + APP_URL);
  if (!p.aparelho) {
    // primeiro acesso: liga o PIN a este celular
    const sh = sheet_('Equipe');
    const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(r => r[0]);
    sh.getRange(ids.indexOf(pessoa) + 1, HEAD.Equipe.indexOf('aparelho') + 1).setNumberFormat('@').setValue(DEVICE_);
  } else if (p.aparelho !== DEVICE_) {
    tentativaOutroAparelho_(pessoa);
    throw new Error('Este PIN já está ligado ao celular de ' + p.nome + '. O PIN é pessoal. Se trocou de celular, peça à coordenação para liberar.');
  }
  marcarOnline_(pessoa);
  return p;
}

/* Guarda quando e de onde cada pessoa usou o app por último (com o PIN dela). */
function marcarOnline_(pessoa) {
  try {
    const pr = PropertiesService.getScriptProperties();
    const mapa = JSON.parse(pr.getProperty('ONLINE') || '{}');
    const ant = mapa[pessoa] || {};
    const novo = { ms: Date.now(), hora: agora_(), dia: hoje_() };
    const l = LOC_ && (Date.now() - LOC_.ms < 30 * 60 * 1000) ? LOC_ : null;
    if (l) { novo.lat = l.lat.toFixed(5); novo.lng = l.lng.toFixed(5); novo.acc = Math.round(l.acc); novo.dist = distSede_(l.lat, l.lng); novo.locHora = Utilities.formatDate(new Date(l.ms), TZ, 'HH:mm'); }
    else if (ant.lat) { novo.lat = ant.lat; novo.lng = ant.lng; novo.acc = ant.acc; novo.dist = ant.dist; novo.locHora = ant.locHora; }
    if (ant.ms && Date.now() - ant.ms < 20 * 1000 && !l) return; // evita gravar a cada segundo
    mapa[pessoa] = Object.assign({}, ant, novo);
    pr.setProperty('ONLINE', JSON.stringify(mapa));
    if (l && novo.dist != null && Date.now() - l.ms < 10 * 60 * 1000 && novo.dist > RAIO_SEDE + Math.min(l.acc || 0, 100)) saiuSemRegistrar_(pessoa, novo);
  } catch (e) { Logger.log(e); }
}

/* Pessoa com ponto aberto (entrada sem saída) aparece fora da ONG: avisa a coordenação uma vez por entrada. */
function saiuSemRegistrar_(pessoa, loc) {
  if (GESTORES.indexOf(pessoa) >= 0) return;
  const hoje = hoje_();
  const regs = registrosDia_(hoje)[pessoa] || [];
  const ult = regs[regs.length - 1];
  if (!ult || ult.tipo !== 'entrada') return;
  const pr = PropertiesService.getScriptProperties();
  const k = 'fora_' + pessoa + '_' + ult.ms;
  if (pr.getProperty(k)) return;
  pr.setProperty(k, '1');
  const nome = (rows_('Equipe').find(e => e.id === pessoa) || {}).nome || pessoa;
  const tx = '🚶 ' + nome + ' está a ' + fmtDist_(loc.dist) + ' da ONG sem ter registrado saída (entrou às ' + ult.hora + ').';
  evento_('alerta', pessoa, tx, 'gestao');
  avisarGestor_('Gestão do Dia: ' + nome + ' saiu da ONG sem registrar saída', tx + '\nOnde: ' + mapa_(loc.lat, loc.lng));
}

function tentativaOutroAparelho_(pessoa) {
  try {
    const pr = PropertiesService.getScriptProperties();
    const mapa = JSON.parse(pr.getProperty('ONLINE') || '{}');
    const ant = mapa[pessoa] || {};
    ant.bloqueio = agora_() + ' ' + hoje_().slice(8) + '/' + hoje_().slice(5, 7);
    if (LOC_) ant.bloqueioMapa = mapa_(LOC_.lat.toFixed(5), LOC_.lng.toFixed(5));
    mapa[pessoa] = ant;
    pr.setProperty('ONLINE', JSON.stringify(mapa));
  } catch (e) { Logger.log(e); }
}

function online_() {
  const mapa = JSON.parse(PropertiesService.getScriptProperties().getProperty('ONLINE') || '{}');
  const regs = registrosDia_(hoje_());
  return rows_('Equipe').map(e => {
    const o = mapa[e.id] || {};
    const rr = regs[e.id] || [], ult = rr[rr.length - 1];
    const ent = rr.find(r => r.tipo === 'entrada');
    const min = o.ms ? Math.round((Date.now() - o.ms) / 60000) : null;
    return { id: e.id, online: min != null && min <= ONLINE_MIN, minutos: min, hora: o.hora || '', dia: o.dia || '',
      dist: o.dist == null ? null : o.dist, mapa: o.lat ? mapa_(o.lat, o.lng) : '', locHora: o.locHora || '',
      ligado: GESTORES.indexOf(e.id) >= 0 ? null : !!e.aparelho, bloqueio: o.bloqueio || '', bloqueioMapa: o.bloqueioMapa || '',
      pontoNaOng: !!(ult && ult.tipo === 'entrada'), pontoDesde: ult && ult.tipo === 'entrada' ? ult.hora : '', primeiraEntrada: ent ? ent.hora : '',
      saiu: !!(ult && ult.tipo === 'saida'), saiuAs: ult && ult.tipo === 'saida' ? ult.hora : '' };
  });
}

/* Gera um PIN novo para a pessoa e libera o celular dela (resolve acesso travado). */
function novoPinColaborador(pessoa, pin, alvo, pinEscolhido) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode trocar PIN.');
  const sh = sheet_('Equipe'), v = sh.getDataRange().getDisplayValues();
  const i = v.findIndex((r, k) => k > 0 && r[0] === alvo);
  if (i < 1) throw new Error('Colaborador não encontrado.');
  const pins = v.slice(1).map(r => String(r[3]).trim());
  let novo = String(pinEscolhido || '').trim();
  if (novo) { if (!/^\d{4,6}$/.test(novo)) throw new Error('O PIN precisa ter de 4 a 6 números.'); if (pins.indexOf(novo) >= 0 && v[i][3] !== novo) throw new Error('Esse PIN já é de outra pessoa.'); }
  else do { novo = String(1000 + Math.floor(Math.random() * 9000)); } while (pins.indexOf(novo) >= 0);
  sh.getRange(i + 1, HEAD.Equipe.indexOf('pin') + 1).setNumberFormat('@').setValue(novo);
  sh.getRange(i + 1, HEAD.Equipe.indexOf('aparelho') + 1).setValue('');
  return { pin: novo, nome: v[i][1] };
}
/* Passa as atividades (de hoje em diante) de um cadastro para outro. Opções: horário de trabalho à tarde e
   levar para a tarde as atividades da manhã que são só dessa pessoa. Só o Victor usa. */
function remanejarPessoa(pessoa, pin, de, para, op) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode remanejar.');
  op = op || {};
  const eqIds = rows_('Equipe').map(e => e.id);
  if (!de || !para || de === para || eqIds.indexOf(de) < 0 || eqIds.indexOf(para) < 0) throw new Error('Escolha duas pessoas diferentes.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const hoje = hoje_(), sh = sheet_('Tarefas'), v = sh.getDataRange().getDisplayValues(), H = v[0];
    const c = k => H.indexOf(k);
    let movidas = 0, tarde = 0; const porDia = {}, manhaJunto = [];
    for (let i = 1; i < v.length; i++) {
      const r = v[i]; if (!r[c('dia')] || r[c('dia')] < hoje) continue;
      const ps = String(r[c('pessoas')] || '').split(',').map(x => x.trim()).filter(Boolean);
      if (ps.indexOf(de) < 0) continue;
      const novo = ps.map(x => x === de ? para : x).filter((x, k, a) => a.indexOf(x) === k);
      r[c('pessoas')] = novo.join(','); movidas++;
      if (op.atividadesTarde && novo.length > 1 && (hm_(r[c('hora')]) || 0) < 12 * 60) manhaJunto.push(r[c('titulo')] + ' (' + r[c('dia')].slice(8) + '/' + r[c('dia')].slice(5, 7) + ' ' + r[c('hora')] + ')');
      if (op.atividadesTarde && novo.length === 1) {
        const ini = hm_(r[c('hora')]);
        if (ini != null && ini < 12 * 60) {
          const fim = hm_(r[c('fim')]), dur = fim != null && fim > ini ? fim - ini : 60, d = r[c('dia')];
          const comeco = porDia[d] != null ? porDia[d] : 14 * 60;
          r[c('hora')] = hhmm_(comeco); r[c('fim')] = hhmm_(Math.min(comeco + dur, 23 * 60 + 59)); r[c('turno')] = 'tarde';
          porDia[d] = comeco + dur; tarde++;
        }
      }
      sh.getRange(i + 1, 1, 1, H.length).setNumberFormat('@').setValues([r.slice(0, H.length)]);
    }
    if (op.horarioTarde) {
      const hs = sheet_('Horarios'), hv = hs.getDataRange().getDisplayValues();
      for (let i = hv.length - 1; i >= 1; i--) if (hv[i][0] === para || hv[i][0] === de) hs.deleteRow(i + 1);
      hs.getRange(hs.getLastRow() + 1, 1, 1, HEAD.Horarios.length).setNumberFormat('@').setValues([HEAD.Horarios.map(k => ({ pessoa: para, dias: 'seg ter qua qui sex', inicio: '14:00', fim: '18:00', obs: 'tarde' }[k] || ''))]);
    }
    return { movidas: movidas, tarde: tarde, horario: !!op.horarioTarde, manhaJunto: manhaJunto };
  } finally { lock.releaseLock(); }
}
/* Coordenação cobra resposta de quem não confirmou a atividade ou concluiu sem foto (aviso no app). */
function cobrarColaborador(pessoa, pin, dia, bloco, tipo, alvo) {
  checkGestor_(pessoa, pin);
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Atividade não encontrada.');
  const ps = pessoasTarefa_(tar).filter(p => !alvo || p === alvo);
  const tx = tipo === 'semfoto'
    ? '📷 A coordenação pediu a foto de "' + tar.titulo + '". Abra Dia → Concluídas → 📷 Enviar foto.'
    : '❓ A coordenação quer saber: "' + tar.titulo + '" (' + tar.hora + ') não foi confirmada. O que aconteceu? Responda à coordenação.';
  ps.forEach(p => evento_('cobranca', p, tx, 'pessoa', bloco, p));
  return { ok: true, avisados: ps.length };
}
function liberarAparelho(pessoa, pin, alvo) {
  checkGestor_(pessoa, pin);
  const sh = sheet_('Equipe');
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues().map(r => r[0]);
  const i = ids.indexOf(alvo);
  if (i < 1) throw new Error('Pessoa não encontrada.');
  sh.getRange(i + 1, HEAD.Equipe.indexOf('aparelho') + 1).setValue('');
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Funções chamadas pela página                                        */
/* ------------------------------------------------------------------ */

function quemVe_(pessoa, pin) {
  if (!pessoa || !pin) return { id: null, gestor: false };
  try { checkPin_(pessoa, pin); return { id: pessoa, gestor: GESTORES.indexOf(pessoa) >= 0 }; }
  catch (e) { return { id: null, gestor: false, erro: e.message }; }
}

function getData(dia, pessoa, pin) { return comLeituraRapida_(() => getData0_(dia, pessoa, pin)); }
function getData0_(dia, pessoa, pin) {
  const viewer = quemVe_(pessoa, pin);
  if (!viewer.id) {   // sem login: só os nomes para a tela de entrada, nenhuma outra informação
    const hoje = hoje_();
    return { dia: hoje, nome: nomeDia_(hoje), hoje: hoje, agora: agora_(), dias: [{ data: hoje, nome: nomeDia_(hoje) }],
      equipe: rows_('Equipe').filter(e => e.id).map(e => ({ id: e.id, nome: e.nome, cor: e.cor })), tarefas: [], status: {}, ponto: {}, verTodos: false, eu: null,
      avisos: [], telefones: {}, demandas: [], catalogo: [], visitas: [], galeria: [], config: { playlist: [], msgs: [], contatos: {}, engTipos: ENG_TIPOS }, bloqueado: true, motivo: viewer.erro || '' };
  }
  verificarPendencias_(false);
  return getData_(dia, viewer);
}

function getData_(dia, viewer) {
  const tarefasAll = rows_('Tarefas');
  const hoje = hoje_();
  const pedido = /^\d{4}-\d{2}-\d{2}$/.test(dia || '') ? [dia] : [];
  const dias = Array.from(new Set(tarefasAll.map(t => t.dia).filter(Boolean).concat([hoje]).concat(pedido))).sort();
  if (!dia || dias.indexOf(dia) < 0) dia = dias.indexOf(hoje) >= 0 ? hoje : (dias.find(d => d > hoje) || dias[dias.length - 1] || hoje);

  const equipe = rows_('Equipe').map(r => ({ id: r.id, nome: r.nome, cor: r.cor }));
  const visivel = p => PRIVADOS.indexOf(p) < 0 || p === viewer.id || (viewer.gestor && p === 'teste');
  const tarefas = tarefasAll.filter(t => t.dia === dia && t.pessoas.split(',').map(s => s.trim()).filter(Boolean).some(visivel)).map(t => ({
    id: t.id, hora: t.hora, fim: fimTarefa_(t), ordem: Number(t.ordem) || 9999, turno: t.turno, titulo: t.titulo,
    pessoas: t.pessoas.split(',').map(s => s.trim()).filter(Boolean).filter(visivel),
    itens: t.itens.split('|').map(s => s.trim()).filter(Boolean),
    metas: t.metas.split('|').map(s => s.trim()).filter(Boolean),
    atividade: /^(sim|s|true|x|1)$/i.test(String(t.atividade).trim())
  }));
  const status = {};
  rows_('Status').filter(s => s.dia === dia).forEach(s => status[s.bloco] = {
    estado: s.estado || 'pendente', inicio: s.inicio, fim: s.fim, lista: s.lista === 'sim', foto: s.foto === 'sim', por: s.por,
    suporte: s.suporte === 'sim', suporteHora: s.suporte_hora, suportePor: s.suporte_por, suporteMsg: s.suporte_msg,
    suporteMapa: s.suporte_lat ? mapa_(s.suporte_lat, s.suporte_lng) : '',
    prazoPedido: s.prazo_pedido === 'sim', prazoOpcao: s.prazo_opcao, prazoPor: s.prazo_por, prazoExt: s.prazo_ext,
    suporteResp: s.suporte_resp, suporteRespHora: s.suporte_resp_hora, suporteCobrado: s.suporte_cobrado === 'sim',
    temFotoConclusao: !!s.foto_conclusao, fotoConclusao: viewer.gestor ? s.foto_conclusao : '',
    avaliacao: s.avaliacao, avaliacaoObs: s.avaliacao_obs, avaliacaoHora: s.avaliacao_hora,
    freq: !!s.freq_url, freqHora: s.freq_hora, freqPor: s.freq_por, freqUrl: viewer.gestor ? s.freq_url : ''
  });
  const ponto = {};
  const esp = esperados_(dia, tarefasAll);
  const regs = registrosDia_(dia);
  const agoraMin = mins_(agora_());
  equipe.forEach(e => {
    if (!(viewer.gestor || e.id === viewer.id)) return;
    ponto[e.id] = situacao_(regs[e.id] || [], esp[e.id], dia, hoje, agoraMin);
  });
  const agoraDT = hoje + ' ' + agora_();
  tarefas.forEach(t => {
    const st = status[t.id] || {};
    const prazo = st.prazoExt || (dia + ' ' + t.fim);
    t.prazo = prazo;
    t.vencida = st.estado !== 'concluida' && agoraDT > prazo;
    t.minha = viewer.id ? t.pessoas.indexOf(viewer.id) >= 0 : false;
    const ini = hm_(t.hora);
    t.atrasada = (!st.estado || st.estado === 'pendente') && ini != null && (dia < hoje || (dia === hoje && agoraMin >= ini + ATRASO_INICIO_MIN));
  });
  const avisos = viewer.id ? eventosDia_(hoje, viewer) : [];
  const telefones = {};
  if (viewer.gestor) rows_('Equipe').forEach(e => { const w = wa_(e.telefone); if (w) telefones[e.id] = w; });
  return { dia, nome: nomeDia_(dia), hoje, agora: agora_(), dias: dias.map(d => ({ data: d, nome: nomeDia_(d) })), equipe, tarefas, status, ponto, verTodos: viewer.gestor, eu: viewer.id, meuWhats: viewer.id ? wa_((rows_('Equipe').find(e => e.id === viewer.id) || {}).telefone) : '', locLivre: !!(viewer.id && dia === hoje && locLivrePrimeiro_(viewer.id)), avisos: avisos, telefones: telefones,
    config: configPublica_(), galeria: galeria_(), ontem: viewer.id ? ontem_(viewer.id) : '', dono: viewer.id === DONO,
    demandas: viewer.id ? demandasLista_() : [], catalogo: DEMANDAS, visitas: viewer.id ? visitasLista_() : [], freqPrazoMin: FREQ_PRAZO_MIN,
    suportes: suportesLista_(viewer), suporteCats: SUPORTE_CATS, engPublico: viewer.id ? engajamentoPublico_() : [],
    naOngLiberado: liberadoGeral_(), naOngLista: viewer.id ? confirmadosOng_() : [], campanha: viewer.id ? campanhaInfo_() : null,
    minhaRef: viewer.id ? ((rows_('Equipe').find(e => e.id === viewer.id) || {}).foto_ref || '') : '' };
}

function login(pessoa, pin) { checkPin_(pessoa, pin); return { ok: true, gestor: GESTORES.indexOf(pessoa) >= 0 }; }

function setStatus(pessoa, pin, dia, bloco, acao, texto, loc, fotoB64) {
  const quem = checkPin_(pessoa, pin);
  const gestor = GESTORES.indexOf(pessoa) >= 0, livreTeste = SEM_LOCAL.indexOf(pessoa) >= 0; // o usuário de teste pode testar a qualquer hora
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Tarefa não encontrada.');
  const pessoas = String(tar.pessoas || '').split(',').map(x => x.trim());
  if (pessoas.indexOf(pessoa) < 0 && !(gestor && (acao === 'resolvido' || acao === 'undo')))
    throw new Error('Só quem está nesta tarefa pode marcar. Cada um marca apenas as próprias tarefas.');
  loc = loc || {};
  let aviso = null, avisoPrazo = null;
  const hoje = hoje_(), hora = agora_(), agoraMin = mins_(hora);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const chave = dia + '__' + bloco;
    const cur = rows_('Status').find(s => s.chave === chave) || {};
    const prazo = cur.prazo_ext || (dia + ' ' + fimTarefa_(tar));
    const agoraDT = hoje + ' ' + hora;
    const o = { dia, bloco, por: pessoa };

    if (acao === 'start' || acao === 'finish') {
      if (acao === 'start' && cur.estado && cur.estado !== 'pendente') throw new Error('Esta tarefa já foi iniciada.');
      if (acao === 'finish' && cur.estado !== 'andamento') throw new Error('Marque Iniciado antes de Concluído.');
      if (acao === 'finish' && !fotoB64) throw new Error('Para concluir, tire a foto da tarefa feita.');
      // dentro do prazo
      if (agoraDT > prazo && !livreTeste) throw new Error('O prazo desta tarefa acabou (' + fmtDT_(prazo, hoje) + '). Use "Solicitar prazo adicional" ou "Preciso de suporte".');
      if (acao === 'start' && !gestor && !livreTeste) {
        const ini = hm_(tar.hora);
        if (dia === hoje && ini != null && agoraMin < ini - ANTECEDENCIA_INICIO) throw new Error('Ainda não é a hora. Esta tarefa começa às ' + hhmm_(ini) + '.');
        if (dia > hoje) throw new Error('Esta tarefa é de outro dia.');
      }
      // coordenação (GESTORES) não precisa estar na ONG, nem no expediente, nem com ponto aberto
      if (!gestor && !livreTeste) {
      // dentro do expediente da pessoa
      const esp = esperados_(hoje)[pessoa];
      if (esp && !esp.periodos.some(p => agoraMin >= p.a - ANTECEDENCIA_INICIO && agoraMin <= p.b + TOLERANCIA))
        throw new Error('Você está fora do seu expediente (' + esp.periodos.map(p => hhmm_(p.a) + '–' + hhmm_(p.b)).join(', ') + ').');
      // ponto aberto: precisa ter registrado entrada
      const regs = registrosDia_(hoje)[pessoa] || [];
      const ult = regs[regs.length - 1];
      if (!ult || ult.tipo !== 'entrada') throw new Error('Registre sua entrada no Ponto antes de marcar a tarefa.');
      // dentro da ONG, pelo celular da pessoa
      exigeNaOng_(pessoa, (acao === 'start' ? 'iniciar' : 'concluir') + ' a atividade');
      if (SEM_LOCAL.indexOf(pessoa) < 0 && !locLivrePrimeiro_(pessoa)) dentroDaOng_(loc, PRECISAO_MAX_TAREFA, 0);
      }
      if (acao === 'start') { o.estado = 'andamento'; o.inicio = hora; }
      else {
        o.estado = 'concluida'; o.fim = hora; o.prazo_pedido = ''; o.avaliacao = ''; o.avaliacao_obs = ''; o.avaliacao_hora = '';
        o.foto_conclusao = fotoB64 ? salvarFoto_('PASTA_TAREFAS', 'Tarefas concluídas (ONG Amigos de Maribondo)', fotoB64,
          dia + ' ' + hora.replace(':', 'h') + ' ' + tar.titulo.replace(/[\\/:*?"<>|]/g, '') + ' (' + quem.nome + ').jpg') : '';
      }
      evento_('tarefa', pessoa, (acao === 'start' ? '▶️ ' + quem.nome + ' iniciou "' : '✅ ' + quem.nome + ' concluiu "') + tar.titulo + '" às ' + hora + '.', 'todos', bloco);
    }
    else if (acao === 'fotoConclusao') {   // atividade concluída sem foto: a pessoa envia a foto depois
      if (cur.estado !== 'concluida') throw new Error('Esta atividade ainda não foi concluída.');
      if (!fotoB64) throw new Error('Escolha a foto da atividade.');
      o.foto_conclusao = salvarFoto_('PASTA_TAREFAS', 'Tarefas concluídas (ONG Amigos de Maribondo)', fotoB64,
        dia + ' ' + hora.replace(':', 'h') + ' ' + tar.titulo.replace(/[\\/:*?"<>|]/g, '') + ' (' + quem.nome + ', foto depois).jpg');
      evento_('tarefa', pessoa, '📷 ' + quem.nome + ' enviou a foto de "' + tar.titulo + '".', 'gestao', bloco);
    }
    else if (acao === 'undo') {
      if (cur.estado === 'concluida') { o.estado = 'andamento'; o.fim = ''; } else { o.estado = 'pendente'; o.inicio = ''; }
    }
    else if (acao === 'lista') { if (!gestor) exigeNaOng_(pessoa, 'marcar a lista'); o.lista = cur.lista === 'sim' ? 'não' : 'sim'; }
    else if (acao === 'foto') { if (!gestor) exigeNaOng_(pessoa, 'marcar a foto'); o.foto = cur.foto === 'sim' ? 'não' : 'sim'; }
    else if (acao === 'suporte') {
      const msg = String(texto || '').trim().slice(0, 30);
      if (msg.length < 3) throw new Error('Escreva o que você precisa para resolver.');
      const lat = Number(loc.lat), lng = Number(loc.lng);
      if (loc.lat == null || !isFinite(lat) || !isFinite(lng)) throw new Error('Ative a localização para pedir suporte. Ela mostra onde você está.');
      o.suporte = 'sim'; o.suporte_hora = hora; o.suporte_por = pessoa; o.suporte_msg = msg;
      o.suporte_lat = lat.toFixed(6); o.suporte_lng = lng.toFixed(6);
      const d = distSede_(lat, lng);
      aviso = { msg: msg, hora: hora, mapa: mapa_(o.suporte_lat, o.suporte_lng), dist: d };
      o.suporte_resp = ''; o.suporte_resp_hora = ''; o.suporte_cobrado = '';
      evento_('suporte', pessoa, '🆘 ' + quem.nome + ' pediu suporte em "' + tar.titulo + '": ' + msg, 'todos', bloco);
    }
    else if (acao === 'resolvido') {
      o.suporte = ''; o.suporte_hora = ''; o.suporte_por = ''; o.suporte_msg = ''; o.suporte_lat = ''; o.suporte_lng = ''; o.suporte_resp = ''; o.suporte_resp_hora = ''; o.suporte_cobrado = '';
      evento_('suporte', pessoa, '🤝 Suporte de "' + tar.titulo + '" resolvido (' + quem.nome + ').', 'todos', bloco);
    }
    else if (acao === 'prazo') {
      if (cur.estado === 'concluida') throw new Error('Esta tarefa já foi concluída.');
      if (texto !== 'proximo' && texto !== 'adicional') throw new Error('Escolha: próximo turno ou turno adicional.');
      if (cur.prazo_pedido === 'sim') throw new Error('Já existe um pedido de prazo aguardando a coordenação.');
      o.prazo_pedido = 'sim'; o.prazo_opcao = texto; o.prazo_por = pessoa;
      evento_('prazo', pessoa, '⏱ ' + quem.nome + ' solicitou prazo adicional em "' + tar.titulo + '" (' + (texto === 'proximo' ? 'próximo turno' : 'turno adicional') + ').', 'todos', bloco);
      avisoPrazo = { opcao: texto, prazo: prazo };
    }
    else throw new Error('Ação desconhecida.');
    upsert_('Status', chave, o);
  } finally { lock.releaseLock(); }
  if (aviso) avisarSuporte_(quem.nome, dia, bloco, aviso);
  if (avisoPrazo) {
    try {
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '⏱ Prazo adicional: ' + tar.titulo + ' (' + quem.nome + ')',
        quem.nome + ' pediu prazo adicional em "' + tar.titulo + '" (prazo atual ' + fmtDT_(avisoPrazo.prazo, hoje) + ').\n\nOpção pedida: '
        + (avisoPrazo.opcao === 'proximo' ? 'concluir no próximo turno' : 'turno adicional (+' + (TURNO_ADICIONAL_MIN / 60) + 'h)')
        + '\n\nAprove ou recuse na aba Gestão do app: ' + APP_URL);
    } catch (e) { Logger.log(e); }
  }
  return getData(dia, pessoa, pin);
}

/* A coordenação aprova ou recusa o pedido de prazo. */
function decidirPrazo(pessoa, pin, dia, bloco, aprovar) {
  checkGestor_(pessoa, pin);
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Tarefa não encontrada.');
  const chave = dia + '__' + bloco;
  const cur = rows_('Status').find(s => s.chave === chave) || {};
  if (cur.prazo_pedido !== 'sim') throw new Error('Não há pedido de prazo nesta tarefa.');
  const o = { dia, bloco, prazo_pedido: '' };
  if (aprovar) {
    const prazo = cur.prazo_ext || (dia + ' ' + fimTarefa_(tar));
    o.prazo_ext = cur.prazo_opcao === 'proximo' ? proximoTurno_(cur.prazo_por, prazo) : somaMin_(prazo, TURNO_ADICIONAL_MIN);
  } else {
    o.prazo_opcao = '';
  }
  upsert_('Status', chave, o);
  const nomeP = (rows_('Equipe').find(e => e.id === cur.prazo_por) || {}).nome || cur.prazo_por;
  evento_('prazo', cur.prazo_por, aprovar
    ? '👍 Coordenação aprovou o prazo de "' + tar.titulo + '" (' + nomeP + ') até ' + fmtDT_(o.prazo_ext, hoje_()) + '.'
    : '✋ Coordenação recusou o prazo adicional de "' + tar.titulo + '" (' + nomeP + '). Execute a tarefa ou peça suporte.', 'todos', bloco, cur.prazo_por);
  return { ok: true, prazo: o.prazo_ext || '' };
}

/* ---------- auxiliares de prazo e localização ---------- */

function fimTarefa_(t) {
  const f = hm_(t.fim);
  if (f != null) return hhmm_(f);
  const i = hm_(t.hora);
  return i == null ? '23:59' : hhmm_(Math.min(i + 60, 23 * 60 + 59));
}
function somaMin_(dt, min) {
  const d = dt.slice(0, 10), m = Math.min(mins_(dt.slice(11)) + min, 23 * 60 + 59);
  return d + ' ' + hhmm_(m);
}
/* Fim do 1º turno da pessoa que começa depois do prazo atual (procura até 7 dias). */
function proximoTurno_(pessoa, prazo) {
  let d = prazo.slice(0, 10), depois = mins_(prazo.slice(11));
  const tarefas = rows_('Tarefas'), hor = rows_('Horarios');
  for (let i = 0; i < 8; i++) {
    const e = esperados_(d, tarefas, hor)[pessoa];
    const p = e ? e.periodos.find(x => x.a >= depois) : null;
    if (p) return d + ' ' + hhmm_(p.b);
    d = isoAdd_(d, 1); depois = 0;
  }
  return somaMin_(prazo, TURNO_ADICIONAL_MIN);
}
function fmtDT_(dt, hoje) { return dt.slice(0, 10) === hoje ? dt.slice(11) : dt.slice(8, 10) + '/' + dt.slice(5, 7) + ' ' + dt.slice(11); }
function mapa_(lat, lng) { return 'https://maps.google.com/?q=' + lat + ',' + lng; }

/* Exige localização do celular dentro da sede (sem folga de precisão). */
function dentroDaOng_(loc, precisaoMax, folga) {
  const lat = Number(loc.lat), lng = Number(loc.lng), acc = Number(loc.acc) || 0;
  if (loc.lat == null || !isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) throw new Error('Ative a localização do celular para continuar.');
  const dist = distSede_(lat, lng);
  if (dist == null) throw new Error('A localização da sede ainda não foi gravada. Avise a coordenação.');
  if (acc > precisaoMax) throw new Error('O sinal de localização está fraco (' + fmtDist_(Math.round(acc)) + '). Vá para perto de uma janela ou da porta e tente de novo.');
  if (dist > RAIO_SEDE + (folga || 0)) throw new Error('Você está a ' + fmtDist_(dist) + ' da ONG. Iniciado e Concluído só valem dentro da ONG.');
  return dist;
}

/* Manda o pedido de suporte por e-mail para a coordenação (dono da planilha). */
function avisarSuporte_(nome, dia, bloco, aviso) {
  try {
    const t = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco) || {};
    const titulo = t.titulo || 'Tarefa';
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
      '🆘 Suporte: ' + titulo + ' (' + nome + ')',
      nome + ' pediu suporte às ' + aviso.hora + ' em "' + titulo + '"' + (t.hora ? ' (' + t.hora + ')' : '') + ':\n\n' + aviso.msg
      + '\n\nOnde está agora: ' + aviso.mapa + (aviso.dist != null ? ' (' + fmtDist_(aviso.dist) + ' da ONG)' : '')
      + '\n\nQuando resolver, marque "Suporte resolvido" no app.');
  } catch (e) { Logger.log('Aviso de suporte não enviado: ' + e); }
}

function punch(pessoa, pin, fotoBase64, desfazer, extra) {
  const p = checkPin_(pessoa, pin);
  extra = extra || {};
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  const dia = hoje_();
  let msg = '', turnoOk = '';
  try {
    const regs = registrosDia_(dia)[pessoa] || [];
    const ultimo = regs[regs.length - 1];
    if (desfazer) {
      if (!ultimo || Date.now() - ultimo.ms > 5 * 60 * 1000) throw new Error('Só dá para desfazer até 5 minutos depois.');
      sheet_('Registros').deleteRow(ultimo.row);
      msg = (ultimo.tipo === 'entrada' ? 'Entrada' : 'Saída') + ' das ' + ultimo.hora + ' desfeita.';
    } else {
      if (ultimo && Date.now() - ultimo.ms < 60 * 1000) throw new Error('Você acabou de registrar. Espere 1 minuto para registrar de novo.');
      exigeNaOng_(pessoa, 'bater o ponto');
      const tipo = ultimo && ultimo.tipo === 'entrada' ? 'saida' : 'entrada';
      const hora = agora_();
      const agoraMin = mins_(hora);
      let foto = '', motivo = '', obs = String(extra.obs || '').trim().slice(0, 200);
      if (tipo === 'saida') {
        const esp = esperados_(dia)[pessoa];
        motivo = tipoSaida_(esp, agoraMin, extra.motivo);
        if ((motivo === 'externa' || motivo === 'emergencia') && obs.length < 3) throw new Error('Escreva o motivo da saída.');
      }
      // 1) foto obrigatória na entrada e na saída
      const selfie = !fotoBase64 && extra.selfie ? selfieParaPonto_(pessoa, extra.selfie) : null;
      if (!fotoBase64 && !selfie) throw new Error('O ponto precisa de foto.');
      // 2) localização obrigatória e dentro da ONG
      const lat = Number(extra.lat), lng = Number(extra.lng), acc = Number(extra.acc) || 0;
      const temLoc = extra.lat != null && isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0);
      const ehGestor = GESTORES.indexOf(pessoa) >= 0 || SEM_LOCAL.indexOf(pessoa) >= 0 || locLivrePrimeiro_(pessoa);
      if (!temLoc && !ehGestor) throw new Error('Ative a localização do celular para registrar o ponto.');
      const dist = temLoc ? distSede_(lat, lng) : null;
      if (dist == null && !ehGestor) throw new Error('A localização da sede ainda não foi gravada. Avise a coordenação.');
      if (!ehGestor && acc > 300 && dist > RAIO_SEDE) throw new Error('O sinal de localização está fraco (' + fmtDist_(Math.round(acc)) + '). Vá para perto de uma janela ou da porta e tente de novo.');
      if (!ehGestor && dist > RAIO_SEDE + Math.min(acc, 100)) throw new Error('Você está a ' + fmtDist_(dist) + ' da ONG. O ponto só vale com a foto tirada na ONG.');
      const pasta = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOLDER_ID'));
      const nomeArq = dia + ' ' + hora.replace(':', 'h') + ' ' + p.nome + ' (' + tipo + ').jpg';
      if (selfie) { foto = selfie.url; upsert_('Selfies', selfie.id, { usada: tipo + ' ' + hora }); }
      else foto = pasta.createFile(Utilities.newBlob(Utilities.base64Decode(fotoBase64), 'image/jpeg', nomeArq)).getUrl();
      const sh = sheet_('Registros');
      sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Registros.length).setNumberFormat('@').setValues([[
        dia, pessoa, tipo, hora, String(Date.now()), foto, motivo, obs,
        temLoc ? lat.toFixed(6) : '', temLoc ? lng.toFixed(6) : '', temLoc && extra.acc ? String(Math.round(extra.acc)) : '',
        dist == null ? '' : String(dist)]]);
      turnoOk = tipo === 'saida' ? (motivo === 'fim' ? 'dia' : motivo === 'intervalo' ? 'turno' : '') : '';
      msg = (tipo === 'entrada' ? 'Entrada' : 'Saída' + (motivo ? ' (' + MOTIVOS[motivo].toLowerCase() + ')' : '')) + ' registrada às ' + hora + (dist != null && dist <= RAIO_SEDE + Math.min(acc, 100) ? ', na ONG.' : (GESTORES.indexOf(pessoa) >= 0 ? ' (coordenação, fora da ONG).' : ', na ONG.'));
      if (tipo === 'saida' && motivo === 'fim') {
        const st = {}; rows_('Status').filter(x => x.dia === dia).forEach(x => st[x.bloco] = x);
        const abertas = rows_('Tarefas').filter(t => t.dia === dia && String(t.pessoas || '').split(',').map(x => x.trim()).indexOf(pessoa) >= 0
          && (st[t.id] || {}).estado !== 'concluida').map(t => t.titulo);
        const tx = '🔴 Colaborador(a) ' + p.nome + ' saiu do expediente às ' + hora
          + (abertas.length ? ' com ' + abertas.length + ' atividade(s) sem concluir: ' + abertas.join(', ') + '.' : ', com todas as atividades concluídas.');
        evento_('saida_final', pessoa, tx, 'gestao');
        if (abertas.length) avisarGestor_('Gestão do Dia: ' + p.nome + ' saiu com atividades sem concluir', tx);
      }
      evento_('ponto', pessoa, (tipo === 'entrada' ? '🟢 ' + p.nome + ' entrou às ' : '🔴 ' + p.nome + ' saiu às ') + hora
        + (motivo && motivo !== 'fim' ? ' · ' + MOTIVOS[motivo].toLowerCase() + (obs ? ': ' + obs : '') : '') + '.', 'gestao');
    }
  } finally { lock.releaseLock(); }
  const data = getData(dia, pessoa, pin);
  data.msg = msg; data.turnoOk = turnoOk;
  return data;
}

/* Decide o tipo da saída: fim do dia, intervalo entre turnos, ou exige motivo. */
function tipoSaida_(esp, agoraMin, pedido) {
  if (pedido === 'externa' || pedido === 'emergencia') return pedido;
  if (!esp || agoraMin >= esp.fimMin - TOLERANCIA) return 'fim';
  const p = esp.periodos;
  for (let i = 0; i < p.length - 1; i++) if (agoraMin >= p[i].b - TOLERANCIA && agoraMin <= p[i + 1].a) return 'intervalo';
  const atual = p.find(x => agoraMin < x.b) || p[p.length - 1];
  throw new Error('Seu horário agora vai até ' + hhmm_(atual.b) + '. Para sair antes, escolha Atividade externa ou Saída emergencial e escreva o motivo.');
}

function hhmm_(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function fmtDist_(m) { return m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : m + ' m'; }

function distSede_(lat, lng) {
  const pr = PropertiesService.getScriptProperties();
  const sl = Number(pr.getProperty('SEDE_LAT')), sg = Number(pr.getProperty('SEDE_LNG'));
  if (!pr.getProperty('SEDE_LAT') || !isFinite(sl) || !isFinite(sg)) return null;
  const R = 6371000, rad = x => x * Math.PI / 180;
  const a = Math.sin(rad(lat - sl) / 2) ** 2 + Math.cos(rad(sl)) * Math.cos(rad(lat)) * Math.sin(rad(lng - sg) / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function definirSede(pessoa, pin, lat, lng) {
  checkGestor_(pessoa, pin);
  if (!isFinite(Number(lat)) || !isFinite(Number(lng))) throw new Error('Não foi possível ler a localização.');
  PropertiesService.getScriptProperties().setProperties({ SEDE_LAT: String(lat), SEDE_LNG: String(lng) });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Ponto: o horário previsto vem das tarefas da Gestão do Dia          */
/* ------------------------------------------------------------------ */

function hm_(txt) { const m = String(txt || '').match(/(\d{1,2})\s*[h:]?\s*(\d{2})?/); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null; }

/* Horário previsto de cada pessoa no dia.
   1) Se a pessoa tem linhas na aba Horarios, vale o horário fixo (dia sem linha = folga; "livre" = sem horário).
   2) Se não tem nenhuma linha, vale a 1ª tarefa do dia até o fim do turno (12h manhã, 18h tarde ou 1h após a última atividade). */
function esperados_(dia, tarefasAll, horAll) {
  const out = {}, temHorario = {}, livre = {};
  const wd = DOW[diaSemana_(dia)];
  (horAll || rows_('Horarios')).forEach(h => {
    const id = String(h.pessoa || '').trim().toLowerCase(); if (!id) return;
    temHorario[id] = true;
    if (/livre/i.test(h.inicio)) { livre[id] = true; return; }
    const dias = String(h.dias || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z]+/).filter(Boolean);
    if (dias.indexOf(wd) < 0 && dias.indexOf('todos') < 0) return;
    const a = hm_(h.inicio), b = hm_(h.fim);
    if (a == null || b == null || b <= a) return;
    (out[id] = out[id] || { periodos: [], fonte: 'horario' }).periodos.push({ a: a, b: b });
  });
  const tarefas = (tarefasAll || rows_('Tarefas')).filter(t => t.dia === dia);
  const primeiraTarefa = {};
  const porTarefa = {};
  tarefas.forEach(t => {
    const o = hm_(t.hora);
    if (o == null || o >= 24 * 60) return;
    const manha = t.turno === 'manha' && o < 12 * 60;
    String(t.pessoas || '').split(',').map(x => x.trim()).filter(Boolean).forEach(id => {
      if (!primeiraTarefa[id] || o < primeiraTarefa[id].o) primeiraTarefa[id] = { o: o, titulo: t.titulo };
      if (temHorario[id]) return;
      const e = porTarefa[id] = porTarefa[id] || { min: 9999, minTarde: 9999, fimMin: 0, manha: false, tarde: false };
      e.min = Math.min(e.min, o);
      e.fimMin = Math.max(e.fimMin, manha ? 12 * 60 : 18 * 60, o + 60);
      if (manha) e.manha = true; else { e.tarde = true; e.minTarde = Math.min(e.minTarde, o); }
    });
  });
  Object.keys(porTarefa).forEach(id => {
    const e = porTarefa[id];
    out[id] = { fonte: 'tarefa', periodos: e.manha && e.tarde ? [{ a: e.min, b: 12 * 60 }, { a: e.minTarde, b: e.fimMin }] : [{ a: e.min, b: e.fimMin }] };
  });
  Object.keys(out).forEach(id => {
    const e = out[id];
    const p = e.periodos.sort((x, y) => x.a - y.a).reduce((acc, x) => {
      const u = acc[acc.length - 1];
      if (u && x.a <= u.b) u.b = Math.max(u.b, x.b); else acc.push({ a: x.a, b: x.b });
      return acc;
    }, []);
    e.periodos = p;
    e.min = p[0].a; e.fimMin = p[p.length - 1].b;
    e.chegadaHora = hhmm_(e.min); e.fimHora = hhmm_(e.fimMin);
    e.tarefa = primeiraTarefa[id] ? primeiraTarefa[id].titulo : (e.fonte === 'horario' ? 'horário fixo' : '');
  });
  return out;
}

/* Entradas e saídas de um dia, por pessoa, em ordem. */
function registrosDia_(dia) {
  const v = sheet_('Registros').getDataRange().getDisplayValues();
  const out = {};
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (r[0] !== dia) continue;
    (out[r[1]] = out[r[1]] || []).push(reg_(r, i + 1));
  }
  Object.keys(out).forEach(k => out[k].sort((a, b) => a.ms - b.ms));
  return out;
}

function reg_(r, row) {
  return { tipo: r[2], hora: r[3], ms: Number(r[4]) || 0, foto: r[5], motivo: r[6] || '', obs: r[7] || '',
    temLoc: !!r[8], dist: r[11] === '' || r[11] == null ? null : Number(r[11]), row: row };
}

function registrosPeriodo_(de, ate) {
  const v = sheet_('Registros').getDataRange().getDisplayValues();
  const out = {};
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (!(r[0] >= de && r[0] <= ate)) continue;
    const k = r[0] + '__' + r[1];
    (out[k] = out[k] || []).push(reg_(r, i + 1));
  }
  Object.keys(out).forEach(k => out[k].sort((a, b) => a.ms - b.ms));
  return out;
}

/* Situação de uma pessoa num dia. */
function situacao_(regs, esp, dia, hoje, agoraMin) {
  const ents = regs.filter(r => r.tipo === 'entrada');
  const ultimo = regs[regs.length - 1];
  const dentro = !!ultimo && ultimo.tipo === 'entrada';
  let minutos = 0, aberto = null;
  regs.forEach(r => {
    if (r.tipo === 'entrada') aberto = mins_(r.hora);
    else if (aberto != null) { minutos += Math.max(0, mins_(r.hora) - aberto); aberto = null; }
  });
  if (aberto != null && dia === hoje) minutos += Math.max(0, agoraMin - aberto);

  const primeira = ents[0] ? ents[0].hora : '';
  let atraso = 0, atrasoVolta = 0, naoVoltou = null;
  const turnosFaltados = [];
  if (esp && primeira) { const d = mins_(primeira) - esp.min; if (d > TOLERANCIA) atraso = d; }
  // volta de cada intervalo entre turnos
  if (esp && esp.periodos.length > 1 && regs.length) {
    for (let i = 1; i < esp.periodos.length; i++) {
      const ini = esp.periodos[i - 1].b - TOLERANCIA, volta = esp.periodos[i].a;
      const sai = regs.find(r => r.tipo === 'saida' && mins_(r.hora) >= ini && mins_(r.hora) <= volta + 60);
      if (!sai) continue;
      const ent = regs.find(r => r.tipo === 'entrada' && r.ms > sai.ms);
      if (ent) { const d = mins_(ent.hora) - volta; if (d > TOLERANCIA) atrasoVolta += d; }
      else if (dia === hoje && agoraMin > volta + TOLERANCIA && agoraMin < esp.fimMin) naoVoltou = volta;
      else if (dia < hoje || agoraMin >= esp.fimMin) turnosFaltados.push(hhmm_(volta));
    }
  }
  let saidaAntes = 0;
  const ultSaida = [...regs].reverse().find(r => r.tipo === 'saida');
  if (esp && ultSaida && !dentro && ultSaida.motivo === 'fim') { const d = esp.fimMin - mins_(ultSaida.hora); if (d > TOLERANCIA) saidaAntes = d; }
  const externas = regs.filter(r => r.tipo === 'saida' && r.motivo === 'externa').length;
  const emergencias = regs.filter(r => r.tipo === 'saida' && r.motivo === 'emergencia').length;
  const foraSede = regs.filter(r => r.tipo === 'entrada' && r.dist != null && r.dist > RAIO_SEDE).length;

  let estado, faltaSaidaDe = '';
  if (dentro && dia < hoje) estado = 'sem_saida';
  else if (dentro) {
    // passou do fim do turno e não bateu a saída → "falta bater a saída" (vermelho)
    // um turno terminou depois da última entrada e a saída não foi batida
    const per = esp ? esp.periodos : [], entMin = mins_(ultimo.hora);
    const fimPassado = per.filter(p => p.b > entMin && agoraMin > p.b + TOLERANCIA)[0];
    if (fimPassado) { estado = 'falta_saida'; faltaSaidaDe = hhmm_(fimPassado.b); }
    else estado = 'dentro';
  }
  else if (naoVoltou != null) estado = 'nao_voltou';
  else if (regs.length) {
    const m = ultimo.motivo === 'almoco' ? 'intervalo' : ultimo.motivo;
    estado = (dia === hoje && (m === 'externa' || m === 'emergencia' || m === 'intervalo')) ? 'fora_' + m : 'saiu';
  }
  else if (!esp) estado = 'sem_tarefa';
  else if (dia < hoje) estado = 'faltou';
  else if (dia === hoje && agoraMin > esp.min + TOLERANCIA) estado = 'nao_chegou';
  else estado = 'aguardando';

  let tipo = null;
  try { tipo = tipoSaida_(esp, agoraMin, null); } catch (e) { tipo = null; }
  const prox = esp ? esp.periodos.find(x => x.a > agoraMin) : null;

  return {
    registros: regs.map(r => ({ tipo: r.tipo, hora: r.hora, foto: !!r.foto, motivo: r.motivo === 'almoco' ? 'intervalo' : r.motivo, obs: r.obs, dist: r.dist, temLoc: r.temLoc })),
    esperado: esp ? { periodos: esp.periodos.map(x => ({ ini: hhmm_(x.a), fim: hhmm_(x.b) })), chegada: esp.chegadaHora, saida: esp.fimHora, tarefa: esp.tarefa, fonte: esp.fonte } : null,
    faltaSaidaDe: faltaSaidaDe, podeSairSemMotivo: tipo !== null, saidaEhIntervalo: tipo === 'intervalo', volta: tipo === 'intervalo' && prox ? hhmm_(prox.a) : '',
    estado: estado, dentro: dentro && dia === hoje, primeira: primeira, atraso: atraso, atrasoVolta: atrasoVolta, saidaAntes: saidaAntes,
    naoVoltou: naoVoltou == null ? '' : hhmm_(naoVoltou), turnosFaltados: turnosFaltados,
    externas: externas, emergencias: emergencias, foraSede: foraSede, minutos: minutos,
    semFoto: ents.filter(r => !r.foto).length, raio: RAIO_SEDE,
    podeDesfazer: !!ultimo && dia === hoje && (Date.now() - (ultimo.ms || 0) < 5 * 60 * 1000)
  };
}

/* ================================================================== */
/* GESTÃO (só para quem está em GESTORES)                              */
/* ================================================================== */

function checkGestor_(pessoa, pin) {
  const p = checkPin_(pessoa, pin);
  if (GESTORES.indexOf(pessoa) < 0) throw new Error('Só a coordenação pode fazer isso.');
  return p;
}

function mins_(t) { if (!t) return null; const a = String(t).split(':'); return Number(a[0]) * 60 + Number(a[1] || 0); }
function isoAdd_(iso, n) { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d + n, 12)); return dt.toISOString().slice(0, 10); }
function diaSemana_(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); }

/* Resumo por pessoa num intervalo de datas [de, ate]. */
function resumo_(de, ate) {
  const hoje = hoje_(), agoraMin = mins_(agora_());
  const equipe = rows_('Equipe');
  const tarefas = rows_('Tarefas');
  const regs = registrosPeriodo_(de, ate);
  const dias = [];
  for (let d = de < INICIO_GERAL ? INICIO_GERAL : de; d <= ate && d <= hoje; d = isoAdd_(d, 1)) dias.push(d);
  const horarios = rows_('Horarios');
  const espPorDia = {}; dias.forEach(d => espPorDia[d] = esperados_(d, tarefas, horarios));
  const fmt = d => d.slice(8) + '/' + d.slice(5, 7);

  return equipe.map(e => {
    const r = { id: e.id, nome: e.nome, cor: e.cor, minPrevistos: 0, presencas: 0, faltas: 0, atrasos: 0, minAtraso: 0, minutos: 0, semFoto: 0, semSaida: 0,
      saidasAntes: 0, externas: 0, emergencias: 0, foraSede: 0, faltasDias: [], atrasosDias: [], ocorrencias: [] };
    dias.forEach(d => {
      if (d > hoje) return;
      const s = situacao_(regs[d + '__' + e.id] || [], espPorDia[d][e.id], d, hoje, agoraMin);
      if (s.registros.length) r.presencas++;
      r.minutos += s.minutos; r.semFoto += s.semFoto;
      const ep = espPorDia[d][e.id];
      if (ep) r.minPrevistos += ep.periodos.reduce((a, p) => a + (p.b - p.a), 0);
      const at = s.atraso + s.atrasoVolta;
      if (at) { r.atrasos++; r.minAtraso += at; r.atrasosDias.push(fmt(d) + ' (' + at + ' min)'); }
      if (s.estado === 'sem_saida') { r.semSaida++; r.ocorrencias.push(fmt(d) + ' sem saída'); }
      if (s.saidaAntes) { r.saidasAntes++; r.ocorrencias.push(fmt(d) + ' saiu ' + s.saidaAntes + ' min antes'); }
      s.turnosFaltados.forEach(h => r.ocorrencias.push(fmt(d) + ' não voltou para o turno das ' + h));
      r.externas += s.externas; r.emergencias += s.emergencias; r.foraSede += s.foraSede;
      s.registros.forEach(x => {
        if (x.motivo === 'externa' || x.motivo === 'emergencia') r.ocorrencias.push(fmt(d) + ' ' + x.hora + ' ' + MOTIVOS[x.motivo].toLowerCase() + (x.obs ? ': ' + x.obs : ''));
        if (x.tipo === 'entrada' && x.dist != null && x.dist > RAIO_SEDE) r.ocorrencias.push(fmt(d) + ' ' + x.hora + ' entrada a ' + fmtDist_(x.dist) + ' da sede');
      });
      if (s.estado === 'faltou' || (s.estado === 'nao_chegou' && agoraMin >= 18 * 60)) { r.faltas++; r.faltasDias.push(fmt(d)); }
    });
    return r;
  });
}

/* Hoje: quem está na ONG, quem saiu com motivo, quem não chegou/voltou e tarefas pedindo suporte. */
function agoraNaOng_() {
  const hoje = hoje_(), agoraMin = mins_(agora_());
  const tarefas = rows_('Tarefas');
  const esp = esperados_(hoje, tarefas);
  const regs = registrosDia_(hoje);
  const faltando = [], dentro = [], fora = [];
  rows_('Equipe').forEach(e => {
    const rr = regs[e.id] || [];
    const s = situacao_(rr, esp[e.id], hoje, hoje, agoraMin);
    const ult = rr[rr.length - 1];
    if (PRIVADOS.indexOf(e.id) >= 0 && !s.dentro) return;
    if (s.dentro) dentro.push({ id: e.id, nome: e.nome, desde: ult.hora, dist: ult.dist, saida: esp[e.id] ? esp[e.id].fimHora : '', faltaSaida: s.estado === 'falta_saida' ? s.faltaSaidaDe : '' });
    else if (s.estado === 'nao_voltou') faltando.push({ id: e.id, nome: e.nome, esperado: s.naoVoltou, tarefa: 'não voltou do intervalo', minEsperado: mins_(s.naoVoltou), chave: e.id + '@' + s.naoVoltou });
    else if (s.estado.indexOf('fora_') === 0) fora.push({ id: e.id, nome: e.nome, desde: ult.hora, motivo: MOTIVOS[ult.motivo], obs: ult.obs });
    else if (s.estado === 'nao_chegou') faltando.push({ id: e.id, nome: e.nome, esperado: esp[e.id].chegadaHora, tarefa: esp[e.id].tarefa, minEsperado: esp[e.id].min, chave: e.id + '@' + esp[e.id].chegadaHora });
  });
  const titulos = {}; tarefas.filter(t => t.dia === hoje).forEach(t => titulos[t.id] = { titulo: t.titulo, hora: t.hora });
  const suporte = rows_('Status').filter(s => s.dia === hoje && s.suporte === 'sim' && titulos[s.bloco])
    .map(s => ({ dia: s.dia, bloco: s.bloco, resp: s.suporte_resp || '', respHora: s.suporte_resp_hora || '', cobrado: s.suporte_cobrado === 'sim',
      titulo: titulos[s.bloco].titulo, hora: titulos[s.bloco].hora, desde: s.suporte_hora, por: s.suporte_por, msg: s.suporte_msg,
      mapa: s.suporte_lat ? mapa_(s.suporte_lat, s.suporte_lng) : '', dist: s.suporte_lat ? distSede_(Number(s.suporte_lat), Number(s.suporte_lng)) : null }));
  const tarefasPorChave = {}; tarefas.forEach(t => tarefasPorChave[t.dia + '__' + t.id] = t);
  const prazos = rows_('Status').filter(s => s.prazo_pedido === 'sim' && s.dia >= INICIO_GERAL && tarefasPorChave[s.chave]).map(s => {
    const t = tarefasPorChave[s.chave];
    return { dia: s.dia, bloco: s.bloco, titulo: t.titulo, hora: t.hora, fim: fimTarefa_(t), por: s.prazo_por, opcao: s.prazo_opcao, prazo: fmtDT_(s.prazo_ext || (s.dia + ' ' + fimTarefa_(t)), hoje) };
  });
  const aparelhos = rows_('Equipe').filter(e => GESTORES.indexOf(e.id) < 0).map(e => ({ id: e.id, ligado: !!e.aparelho }));
  const pr = PropertiesService.getScriptProperties();
  return { faltando: faltando, dentro: dentro, fora: fora, suporte: suporte, prazos: prazos, aparelhos: aparelhos, sedeDefinida: !!pr.getProperty('SEDE_LAT'), raio: RAIO_SEDE };
}

function painel(pessoa, pin, dataRef) {
  checkGestor_(pessoa, pin);
  const ref = dataRef || hoje_();
  const dow = diaSemana_(ref);
  const seg = isoAdd_(ref, dow === 0 ? -6 : 1 - dow);
  const sab = isoAdd_(seg, 5);
  return comLeituraRapida_(() => ({ de: seg, ate: sab, hoje: hoje_(), agora: agora_(), pessoas: resumo_(seg, sab), agoraOng: agoraNaOng_(), online: online_(), sheetUrl: ss_().getUrl(),
    fechamento: rows_('Fechamento').find(f => f.dia === hoje_()) || null, opcoesDia: OPCOES_DIA }));
}

/* ------------------------------------------------------------------ */
/* Relatório final do dia (coordenação)                                */
/* ------------------------------------------------------------------ */

const OPCOES_DIA = {
  seguir: 'Dia de atividades executadas · seguir',
  ajustes: 'Dia de necessidade de ajustes',
  urgencias: 'Dia de reavaliação de urgências'
};

function fecharDia(pessoa, pin, opcao, obs) {
  checkGestor_(pessoa, pin);
  if (!OPCOES_DIA[opcao]) throw new Error('Escolha uma das opções.');
  obs = String(obs || '').trim().slice(0, 300);
  if (opcao !== 'seguir' && obs.length < 3) throw new Error('Escreva o que precisa de ajuste ou qual é a urgência.');
  const dia = hoje_(), hora = agora_();
  const nome = (rows_('Equipe').find(e => e.id === pessoa) || {}).nome || pessoa;
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    sheet_('Fechamento');
    upsert_('Fechamento', dia, { dia: dia, hora: hora, por: pessoa, opcao: opcao, obs: obs });
    // conclui a tarefa "Relatório final" desta pessoa hoje, se existir
    rows_('Tarefas').filter(t => t.dia === dia && /relat[oó]rio final/i.test(t.titulo)
      && String(t.pessoas || '').split(',').map(x => x.trim()).indexOf(pessoa) >= 0).forEach(t => {
      upsert_('Status', dia + '__' + t.id, { dia: dia, bloco: t.id, estado: 'concluida', inicio: hora, fim: hora, por: pessoa });
    });
  } finally { lock.releaseLock(); }
  const tx = '📋 Relatório final de ' + dia.slice(8) + '/' + dia.slice(5, 7) + ' (' + nome + ', ' + hora + '): ' + OPCOES_DIA[opcao] + (obs ? '. ' + obs : '.');
  evento_('fechamento', pessoa, tx, 'gestao');
  avisarGestor_('Gestão do Dia: ' + OPCOES_DIA[opcao], tx);
  return painel(pessoa, pin, '');
}

/* ------------------------------------------------------------------ */
/* Programas: turmas, cadastro e presença dia a dia                    */
/* ------------------------------------------------------------------ */

const PROGRAMAS = [
  { k: 'kids', t: 'Kids' },
  { k: 'flor', t: 'Flor da Idade' },
  { k: 'danca', t: 'Dança e Funcional' },
  { k: 'sopa', t: 'Cadastro da Sopa' }
];
const progOk_ = k => PROGRAMAS.some(p => p.k === k);

function programas(pessoa, pin, prog, dia) {
  checkPin_(pessoa, pin);
  if (!progOk_(prog)) prog = PROGRAMAS[0].k;
  const hoje = hoje_();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia || '') || dia > hoje) dia = hoje;
  const pres = rows_('Presencas').filter(x => x.programa === prog);
  const marcas = {}, cont = {};
  pres.forEach(x => {
    if (x.dia === dia && x.presente) marcas[x.participante] = x.presente;
    if (!cont[x.participante]) cont[x.participante] = { veio: 0, faltou: 0 };
    if (x.presente === 'sim') cont[x.participante].veio++;
    if (x.presente === 'nao') cont[x.participante].faltou++;
  });
  const participantes = rows_('Participantes').filter(x => x.programa === prog).map(x => ({
    id: x.id, nome: x.nome, telefone: x.telefone, endereco: x.endereco, sus: x.sus, responsavel: x.responsavel,
    ativo: x.ativo !== 'não', veio: (cont[x.id] || {}).veio || 0, faltou: (cont[x.id] || {}).faltou || 0
  })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const totais = {};
  PROGRAMAS.forEach(p => totais[p.k] = 0);
  rows_('Participantes').forEach(x => { if (x.ativo !== 'não' && totais[x.programa] != null) totais[x.programa]++; });
  return { programas: PROGRAMAS, totais: totais, prog: prog, dia: dia, hoje: hoje, participantes: participantes, marcas: marcas,
    gestor: GESTORES.indexOf(pessoa) >= 0 };
}

function salvarParticipante(pessoa, pin, p) {
  checkPin_(pessoa, pin);
  p = p || {};
  if (!progOk_(p.programa)) throw new Error('Escolha o programa.');
  const nome = String(p.nome || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  if (nome.length < 2) throw new Error('O nome é obrigatório.');
  const limpo = s => String(s || '').trim().slice(0, 120);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    sheet_('Participantes');
    const todos = rows_('Participantes');
    let id = String(p.id || '');
    const atual = id ? todos.find(x => x.id === id) : null;
    if (id && !atual) throw new Error('Cadastro não encontrado.');
    if (!id) {
      const igual = todos.find(x => x.programa === p.programa && x.nome.toLowerCase() === nome.toLowerCase() && x.ativo !== 'não');
      if (igual) throw new Error(nome + ' já está cadastrado(a) neste programa.');
      id = 'p' + Date.now().toString(36);
    }
    const obj = { id: id, programa: p.programa, nome: nome, telefone: limpo(p.telefone), endereco: limpo(p.endereco),
      sus: limpo(p.sus), responsavel: limpo(p.responsavel) };
    if (!atual) { obj.ativo = 'sim'; obj.criado_em = hoje_() + ' ' + agora_(); obj.criado_por = pessoa; }
    else if (p.ativo === false || p.ativo === true) {
      if (GESTORES.indexOf(pessoa) < 0 && (p.ativo ? 'sim' : 'não') !== (atual.ativo || 'sim')) throw new Error('Só a coordenação pode ativar ou desativar um cadastro.');
      obj.ativo = p.ativo ? 'sim' : 'não';
    }
    upsert_('Participantes', id, obj);
  } finally { lock.releaseLock(); }
  return programas(pessoa, pin, p.programa, p.dia);
}

function marcarPresenca(pessoa, pin, prog, dia, pid, valor) {
  checkPin_(pessoa, pin);
  if (!progOk_(prog)) throw new Error('Programa inválido.');
  const hoje = hoje_();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia || '') || dia > hoje) throw new Error('Data inválida.');
  if (dia !== hoje && GESTORES.indexOf(pessoa) < 0) throw new Error('A presença só pode ser marcada no dia. Para corrigir outro dia, fale com a coordenação.');
  if (['sim', 'nao', ''].indexOf(valor) < 0) throw new Error('Opção inválida.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    sheet_('Presencas');
    if (!rows_('Participantes').some(x => x.id === pid && x.programa === prog)) throw new Error('Cadastro não encontrado.');
    upsert_('Presencas', dia + '__' + prog + '__' + pid, { dia: dia, programa: prog, participante: pid, presente: valor, por: pessoa, hora: agora_() });
  } finally { lock.releaseLock(); }
  return programas(pessoa, pin, prog, dia);
}

/* ------------------------------------------------------------------ */
/* Saúde (relatório semanal) e Editais                                 */
/* ------------------------------------------------------------------ */

/* Quem vê e preenche cada aba (use o "id" da aba Equipe). A coordenação sempre tem acesso. */
const SAUDE_ACESSO = ['kallyne', 'piedade'];
const EDITAIS_ACESSO = ['bruna'];
const SITUACOES_SAUDE = ['Agendado', 'Realizado', 'Atrasado', 'Cancelado'];
const SITUACOES_EDITAL = ['A analisar', 'Em preparação', 'Enviado', 'Aprovado', 'Não aprovado'];

function checkAcesso_(pessoa, pin, lista, nomeAba) {
  const p = checkPin_(pessoa, pin);
  if (GESTORES.indexOf(pessoa) < 0 && lista.indexOf(pessoa) < 0) throw new Error('A aba ' + nomeAba + ' é só para quem a coordenação liberou.');
  return p;
}
const dataOk_ = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
const limpa_ = (s, n) => String(s == null ? '' : s).trim().slice(0, n || 200);

function saude(pessoa, pin, ref) {
  checkAcesso_(pessoa, pin, SAUDE_ACESSO, 'Saúde');
  const hoje = hoje_();
  if (!dataOk_(ref)) ref = hoje;
  const dow = diaSemana_(ref), de = isoAdd_(ref, dow === 0 ? -6 : 1 - dow), ate = isoAdd_(de, 6);
  const todos = rows_('SaudeRegistros').map(x => {
    const sit = x.situacao === 'Agendado' && x.data && x.data < hoje ? 'Atrasado' : (x.situacao || 'Agendado');
    return { id: x.id, nome: x.nome, telefone: x.telefone, endereco: x.endereco, especialidade: x.especialidade, data: x.data,
      situacao: sit, situacaoGravada: x.situacao, obs: x.obs };
  });
  const semana = todos.filter(x => x.data >= de && x.data <= ate).sort((a, b) => (a.data + a.nome).localeCompare(b.data + b.nome));
  const porSit = {}; SITUACOES_SAUDE.forEach(s => porSit[s] = 0);
  const porEsp = {};
  semana.forEach(x => {
    porSit[x.situacao] = (porSit[x.situacao] || 0) + 1;
    const k = x.especialidade || 'Sem especialidade';
    if (!porEsp[k]) { porEsp[k] = { total: 0 }; SITUACOES_SAUDE.forEach(s => porEsp[k][s] = 0); }
    porEsp[k].total++; porEsp[k][x.situacao]++;
  });
  const atrasados = todos.filter(x => x.situacao === 'Atrasado').sort((a, b) => a.data.localeCompare(b.data));
  const especialidades = Array.from(new Set(todos.map(x => x.especialidade).filter(Boolean))).sort();
  return { hoje: hoje, de: de, ate: ate, semana: semana, porSituacao: porSit, porEspecialidade: porEsp, atrasados: atrasados,
    situacoes: SITUACOES_SAUDE, especialidades: especialidades, total: todos.length };
}

function salvarSaude(pessoa, pin, r) {
  checkAcesso_(pessoa, pin, SAUDE_ACESSO, 'Saúde');
  r = r || {};
  const nome = limpa_(r.nome, 80);
  if (nome.length < 2) throw new Error('O nome é obrigatório.');
  if (limpa_(r.especialidade).length < 2) throw new Error('Informe a especialidade ou o exame.');
  if (!dataOk_(r.data)) throw new Error('Informe a data.');
  const sit = SITUACOES_SAUDE.indexOf(r.situacao) >= 0 ? r.situacao : 'Agendado';
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    sheet_('SaudeRegistros');
    let id = String(r.id || '');
    if (id && !rows_('SaudeRegistros').some(x => x.id === id)) throw new Error('Registro não encontrado.');
    const obj = { nome: nome, telefone: limpa_(r.telefone, 30), endereco: limpa_(r.endereco, 150), especialidade: limpa_(r.especialidade, 80),
      data: r.data, situacao: sit, obs: limpa_(r.obs, 300), atualizado_em: hoje_() + ' ' + agora_() };
    if (!id) { id = 's' + Date.now().toString(36); obj.criado_em = obj.atualizado_em; obj.por = pessoa; }
    upsert_('SaudeRegistros', id, obj);
  } finally { lock.releaseLock(); }
  return saude(pessoa, pin, r.ref || r.data);
}

function excluirSaude(pessoa, pin, id, ref) {
  checkGestor_(pessoa, pin);
  apagarLinha_('SaudeRegistros', id);
  return saude(pessoa, pin, ref);
}

function apagarLinha_(nome, id) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet_(nome);
    const col = sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), 1).getDisplayValues().map(r => r[0]);
    const i = col.indexOf(id);
    if (i < 1) throw new Error('Registro não encontrado.');
    sh.deleteRow(i + 1);
  } finally { lock.releaseLock(); }
}

function editais(pessoa, pin) {
  checkAcesso_(pessoa, pin, EDITAIS_ACESSO, 'Editais');
  const hoje = hoje_();
  const lista = rows_('EditaisRegistros').map(x => ({ id: x.id, nome: x.nome, numero: x.numero, link: x.link, prazo: x.prazo,
    situacao: x.situacao || 'A analisar', obs: x.obs, planoUrl: x.plano_url, planoNome: x.plano_nome, atualizado: x.atualizado_em }))
    .sort((a, b) => (a.prazo || '9999') .localeCompare(b.prazo || '9999'));
  return { hoje: hoje, lista: lista, situacoes: SITUACOES_EDITAL, gestor: GESTORES.indexOf(pessoa) >= 0 };
}

function salvarEdital(pessoa, pin, e, pdfB64, pdfNome) {
  checkAcesso_(pessoa, pin, EDITAIS_ACESSO, 'Editais');
  e = e || {};
  const nome = limpa_(e.nome, 150);
  if (nome.length < 3) throw new Error('O nome do edital é obrigatório.');
  let link = limpa_(e.link, 500);
  if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
  if (e.prazo && !dataOk_(e.prazo)) throw new Error('Prazo inválido.');
  const obj = { nome: nome, numero: limpa_(e.numero, 60), link: link, prazo: e.prazo || '',
    situacao: SITUACOES_EDITAL.indexOf(e.situacao) >= 0 ? e.situacao : 'A analisar', obs: limpa_(e.obs, 500), atualizado_em: hoje_() + ' ' + agora_() };
  if (pdfB64) {
    const bytes = Utilities.base64Decode(pdfB64);
    if (bytes.length > 15 * 1024 * 1024) throw new Error('O PDF passa de 15 MB.');
    const pr = PropertiesService.getScriptProperties();
    let pasta = null;
    try { pasta = pr.getProperty('EDITAIS_FOLDER') ? DriveApp.getFolderById(pr.getProperty('EDITAIS_FOLDER')) : null; } catch (err) { pasta = null; }
    if (!pasta) { pasta = DriveApp.createFolder('Editais — planos de ação (ONG Amigos de Maribondo)'); pr.setProperty('EDITAIS_FOLDER', pasta.getId()); }
    const nomeArq = (limpa_(pdfNome, 100) || 'plano-de-acao.pdf').replace(/[\\/:*?"<>|]/g, '-');
    const arq = pasta.createFile(Utilities.newBlob(bytes, 'application/pdf', nomeArq));
    try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { Logger.log(err); }
    obj.plano_url = arq.getUrl(); obj.plano_nome = nomeArq;
  }
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    sheet_('EditaisRegistros');
    let id = String(e.id || '');
    if (id && !rows_('EditaisRegistros').some(x => x.id === id)) throw new Error('Edital não encontrado.');
    if (!id) { id = 'e' + Date.now().toString(36); obj.criado_em = obj.atualizado_em; obj.por = pessoa; }
    upsert_('EditaisRegistros', id, obj);
  } finally { lock.releaseLock(); }
  return editais(pessoa, pin);
}

function excluirEdital(pessoa, pin, id) {
  checkGestor_(pessoa, pin);
  apagarLinha_('EditaisRegistros', id);
  return editais(pessoa, pin);
}

/* Importa a lista de presença de uma vez: quem está na lista = veio; os outros ativos = faltou.
   Nomes novos podem ser cadastrados na hora. A foto da lista vira PDF no Drive. */
function importarPresenca(pessoa, pin, prog, dia, presentes, novos, fotoB64) {
  checkPin_(pessoa, pin);
  if (!progOk_(prog)) throw new Error('Programa inválido.');
  const hoje = hoje_();
  if (!dataOk_(dia) || dia > hoje) throw new Error('Data inválida.');
  if (dia !== hoje && GESTORES.indexOf(pessoa) < 0) throw new Error('A presença só pode ser importada no dia. Para outro dia, fale com a coordenação.');
  presentes = (presentes || []).map(String);
  novos = (novos || []).map(n => limpa_(n, 80).replace(/\s+/g, ' ')).filter(n => n.length >= 2);
  let pdfUrl = '';
  if (fotoB64) {
    const pr = PropertiesService.getScriptProperties();
    let pasta = null;
    try { pasta = pr.getProperty('FREQPROG_FOLDER') ? DriveApp.getFolderById(pr.getProperty('FREQPROG_FOLDER')) : null; } catch (err) { pasta = null; }
    if (!pasta) { pasta = DriveApp.createFolder('Frequência dos programas — listas em PDF (ONG Amigos de Maribondo)'); pr.setProperty('FREQPROG_FOLDER', pasta.getId()); }
    const nomeProg = (PROGRAMAS.find(x => x.k === prog) || {}).t || prog;
    const img = Utilities.newBlob(Utilities.base64Decode(fotoB64), 'image/jpeg', 'lista.jpg');
    const pdf = img.getAs(MimeType.PDF).setName(dia + ' ' + nomeProg + ' — lista de presença.pdf');
    pdfUrl = pasta.createFile(pdf).getUrl();
  }
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  let vieram = 0, faltaram = 0;
  try {
    const shP = sheet_('Participantes');
    const ja = rows_('Participantes').filter(x => x.programa === prog);
    const novosIds = [];
    const linhasNovas = [];
    novos.forEach((nome, i) => {
      const igual = ja.find(x => x.nome.toLowerCase() === nome.toLowerCase() && x.ativo !== 'não');
      if (igual) { novosIds.push(igual.id); return; }
      const id = 'p' + Date.now().toString(36) + i;
      novosIds.push(id);
      linhasNovas.push(HEAD.Participantes.map(k => ({ id: id, programa: prog, nome: nome, ativo: 'sim', criado_em: hoje + ' ' + agora_(), criado_por: pessoa }[k] || '')));
    });
    if (linhasNovas.length) shP.getRange(shP.getLastRow() + 1, 1, linhasNovas.length, HEAD.Participantes.length).setNumberFormat('@').setValues(linhasNovas);
    const vieramIds = new Set(presentes.concat(novosIds));
    const ativos = ja.filter(x => x.ativo !== 'não').map(x => x.id).concat(novosIds.filter(id => !ja.some(x => x.id === id)));
    const sh = sheet_('Presencas');
    const v = sh.getDataRange().getDisplayValues();
    const linha = {}; for (let i = 1; i < v.length; i++) linha[v[i][0]] = i + 1;
    const hora = agora_(), add = [];
    ativos.forEach(pid => {
      const val = vieramIds.has(pid) ? 'sim' : 'nao';
      if (val === 'sim') vieram++; else faltaram++;
      const row = [dia + '__' + prog + '__' + pid, dia, prog, pid, val, pessoa, hora];
      if (linha[row[0]]) sh.getRange(linha[row[0]], 1, 1, row.length).setNumberFormat('@').setValues([row]);
      else add.push(row);
    });
    if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, add[0].length).setNumberFormat('@').setValues(add);
    const shI = sheet_('ImportacoesFrequencia');
    shI.getRange(shI.getLastRow() + 1, 1, 1, HEAD.ImportacoesFrequencia.length).setNumberFormat('@')
      .setValues([[dia, hora, prog, pessoa, String(vieram), String(faltaram), String(linhasNovas.length), pdfUrl]]);
  } finally { lock.releaseLock(); }
  const r = programas(pessoa, pin, prog, dia);
  r.importacao = { vieram: vieram, faltaram: faltaram, pdfUrl: pdfUrl };
  return r;
}

/* ------------------------------------------------------------------ */
/* Meu Assessor (app pessoal do Victor): planilha e pasta só dele      */
/* ------------------------------------------------------------------ */
const MA_DONO = 'victor';
/* Senha própria do Meu Assessor (diferente do PIN da ONG; nenhum gestor vê). */
const MA_SENHA = '13931393';
const MA_COLECOES = ['dias', 'acoes', 'objetivos', 'refs', 'contatos', 'viagens', 'notas', 'semanas', 'financeiro',
  'projetos', 'galeria', 'mapas', 'perfis', 'posts', 'listas', 'msgs', 'saude', 'config', 'livros', 'icones', 'time'];
function maCheck_(pessoa, pin) {
  if (pessoa !== MA_DONO || String(pin || '').trim() !== MA_SENHA) {
    Utilities.sleep(800);
    throw new Error('PIN incorreto.');
  }
}
function maPlanilha_() {
  const pr = PropertiesService.getScriptProperties();
  let ss = null;
  try { ss = pr.getProperty('MA_SHEET_ID') ? SpreadsheetApp.openById(pr.getProperty('MA_SHEET_ID')) : null; } catch (e) { ss = null; }
  if (!ss) {
    ss = SpreadsheetApp.create('Meu Assessor — Victor (dados pessoais)');
    const sh = ss.getSheets()[0].setName('Dados');
    sh.getRange(1, 1, 1, 4).setValues([['colecao', 'id', 'json', 'atualizado']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    pr.setProperty('MA_SHEET_ID', ss.getId());
  }
  return ss.getSheetByName('Dados');
}
function maCarregar(pessoa, pin) {
  maCheck_(pessoa, pin);
  const sh = maPlanilha_();
  const v = sh.getDataRange().getValues();
  const out = {}; MA_COLECOES.forEach(c => out[c] = {});
  const desde = isoAdd_(hoje_(), -60);
  for (let i = 1; i < v.length; i++) {
    const col = String(v[i][0]), id = String(v[i][1]);
    if (!out[col] || !id) continue;
    if (col === 'dias' && id < desde) continue;
    try { out[col][id] = JSON.parse(v[i][2]); } catch (e) {}
  }
  return out;
}
function maSalvar(pessoa, pin, col, id, obj) {
  maCheck_(pessoa, pin);
  if (MA_COLECOES.indexOf(col) < 0) throw new Error('Coleção inválida.');
  id = String(id || '').slice(0, 80);
  if (!id) throw new Error('Registro sem id.');
  const json = obj == null ? null : JSON.stringify(obj);
  if (json && json.length > 45000) throw new Error('Registro grande demais.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const sh = maPlanilha_();
    const n = Math.max(sh.getLastRow() - 1, 0);
    const chaves = n ? sh.getRange(2, 1, n, 2).getValues() : [];
    let row = -1;
    for (let i = 0; i < chaves.length; i++) if (chaves[i][0] === col && String(chaves[i][1]) === id) { row = i + 2; break; }
    if (json == null) { if (row > 0) sh.deleteRow(row); }
    else {
      const linha = [[col, id, json, hoje_() + ' ' + agora_()]];
      if (row > 0) sh.getRange(row, 1, 1, 4).setNumberFormat('@').setValues(linha);
      else sh.getRange(sh.getLastRow() + 1, 1, 1, 4).setNumberFormat('@').setValues(linha);
    }
  } finally { lock.releaseLock(); }
  return { ok: true };
}
function maFoto(pessoa, pin, b64) {
  maCheck_(pessoa, pin);
  if (!b64) throw new Error('Foto vazia.');
  const pr = PropertiesService.getScriptProperties();
  let pasta = null;
  try { pasta = pr.getProperty('MA_FOLDER') ? DriveApp.getFolderById(pr.getProperty('MA_FOLDER')) : null; } catch (e) { pasta = null; }
  if (!pasta) { pasta = DriveApp.createFolder('Meu Assessor — fotos (Victor)'); pr.setProperty('MA_FOLDER', pasta.getId()); }
  const arq = pasta.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', hoje_() + ' ' + agora_().replace(':', 'h') + '.jpg'));
  try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  return { id: arq.getId(), url: 'https://drive.google.com/thumbnail?id=' + arq.getId() + '&sz=w1000' };
}

/* ------------------------------------------------------------------ */
/* Sistema de pontos semanal (selos)                                   */
/* ------------------------------------------------------------------ */
const PTS = {
  RESPONSABILIDADE: 59,   // dia com todas as atividades concluídas no prazo
  COMPROMISSO: 59,        // dia com todos os pontos batidos no horário
  INTEGRACAO: 39,         // pedido feito pelo app (no máximo 1 por dia)
  ENG_CURTIDA: 2, ENG_REPOST: 4, ENG_STATUS: 3, // engajamento no Instagram (com print)
  IDEIA_ENVIO: 7,         // ideia enviada na aba Demandas
  IDEIA_VALIDADA: 27,     // ideia validada pela coordenação
  SUPORTE: 3,             // pedido de suporte feito pelo app
  ADVERTENCIA: -13,       // atividade não feita no prazo, sem pedir prazo
  NAO_FEITA_COM_PRAZO: -5,// atividade não feita, mas com prazo solicitado
  ATRASO_30MIN: -5,       // a cada 30 min de atraso no ponto (por turno)
  INDIRETA: -5,           // pedido feito fora do app (lançado pela coordenação)
  FALHAS_PERMITIDAS: 128, // tolerância da semana: 1 falha de ponto + 1 falha de atividade: (59+5) + (59+5)
  INICIO: '2026-11-10',   // pontuação zerada: conta a partir de terça 10/11, 08h
  EXCLUIR: ['victor', 'teste'], // fora da pontuação
  ATIV_MIN: 2, ATIV_MAX: 4, ATIV_IDEAL: '3 a 4'
};
function semanaDe_(ref) { const d = dataOk_(ref) ? ref : hoje_(); const w = diaSemana_(d); const de = isoAdd_(d, w === 0 ? -6 : 1 - w); return { de: de, ate: isoAdd_(de, 6) }; }
function calcularPontos_(de, ate) {
  const hoje = hoje_(), agoraMin = mins_(agora_()), agoraDT = hoje + ' ' + agora_();
  const equipe = rows_('Equipe').filter(e => e.id && PTS.EXCLUIR.indexOf(e.id) < 0), tarefas = rows_('Tarefas'), horarios = rows_('Horarios');
  if (de < PTS.INICIO) de = PTS.INICIO;
  const status = {}; rows_('Status').forEach(s => status[s.chave] = s);
  const regs = registrosPeriodo_(de, ate);
  const dem = rows_('Demandas').filter(d => d.dia >= de && d.dia <= ate);
  const ind = rows_('Indiretas').filter(d => d.dia >= de && d.dia <= ate);
  const out = {};
  equipe.forEach(e => out[e.id] = { id: e.id, nome: e.nome, cor: e.cor, pts: 0, max: 0, selos: { responsabilidade: 0, compromisso: 0, integracao: 0, criatividade: 0, validadas: 0, suporte: 0, engajamento: 0 }, engPts: 0,
    neg: { advertencias: 0, naoFeitasComPrazo: 0, atrasos: 0, minAtraso: 0, indiretas: 0, faltas: 0 } });
  for (let d = de; d <= ate; d = isoAdd_(d, 1)) {
    const tDia = tarefas.filter(t => t.dia === d);
    const esp = esperados_(d, tarefas, horarios);
    equipe.forEach(e => {
      const P = out[e.id];
      // atividades do dia
      const minhas = tDia.filter(t => String(t.pessoas || '').split(',').map(x => x.trim()).indexOf(e.id) >= 0);
      if (minhas.length) {
        P.max += PTS.RESPONSABILIDADE;
        let todasNoPrazo = true, pendenteHoje = false;
        minhas.forEach(t => {
          const s = status[d + '__' + t.id] || {};
          const prazo = s.prazo_ext || (d + ' ' + fimTarefa_(t));
          const concluidaNoPrazo = s.estado === 'concluida' && (d + ' ' + (s.fim || '23:59')) <= prazo;
          const venceu = agoraDT > prazo;
          if (s.suporte_por === e.id && s.suporte_hora) P.selos.suporte++;
          if (concluidaNoPrazo) return;
          todasNoPrazo = false;
          if (!venceu) { pendenteHoje = true; return; }
          // com 1 só atividade no dia não há tolerância: desconta como advertência na hora
          if (minhas.length > 1 && (s.prazo_pedido === 'sim' || s.prazo_opcao || s.prazo_ext)) P.neg.naoFeitasComPrazo++; else P.neg.advertencias++;
        });
        if (todasNoPrazo && !pendenteHoje) P.selos.responsabilidade++;
      }
      // ponto do dia
      const ep = esp[e.id];
      if (ep) {
        P.max += PTS.COMPROMISSO;
        if (d > hoje) return;
        const s = situacao_(regs[d + '__' + e.id] || [], ep, d, hoje, agoraMin);
        const turnos = [s.atraso, s.atrasoVolta].filter(x => x > 0);
        turnos.forEach(m => { P.neg.atrasos++; P.neg.minAtraso += m; P.pts += PTS.ATRASO_30MIN * Math.ceil(m / 30); });
        if (s.estado === 'faltou') P.neg.faltas++;
        const diaFechado = d < hoje || agoraMin >= ep.fimMin;
        if (diaFechado && s.registros.length && !turnos.length && s.estado !== 'sem_saida' && !s.turnosFaltados.length) P.selos.compromisso++;
      }
    });
  }
  // pedidos pelo app (1 por dia), ideias e suportes
  const diasComPedido = {};
  dem.forEach(x => {
    const P = out[x.pessoa]; if (!P) return;
    if (x.item === 'ideia') { P.selos.criatividade++; if (x.estado === 'validada') P.selos.validadas++; return; }
    const k = x.pessoa + x.dia; if (diasComPedido[k]) return; diasComPedido[k] = 1; P.selos.integracao++;
  });
  ind.forEach(x => { const P = out[x.pessoa]; if (P) P.neg.indiretas++; });
  rows_('Engajamento').filter(x => x.dia >= de && x.dia <= ate && x.estado !== 'invalido').forEach(x => { const P = out[x.pessoa]; if (P) { P.selos.engajamento++; P.engPts += Number(x.pontos) || 0; } });
  Object.keys(out).forEach(id => {
    const P = out[id], s = P.selos, n = P.neg;
    P.pts += s.responsabilidade * PTS.RESPONSABILIDADE + s.compromisso * PTS.COMPROMISSO + s.integracao * PTS.INTEGRACAO
      + s.criatividade * PTS.IDEIA_ENVIO + s.validadas * PTS.IDEIA_VALIDADA + s.suporte * PTS.SUPORTE
      + P.engPts + n.advertencias * PTS.ADVERTENCIA + n.naoFeitasComPrazo * PTS.NAO_FEITA_COM_PRAZO + n.indiretas * PTS.INDIRETA;
    P.meta = P.max ? Math.max(PTS.RESPONSABILIDADE, P.max - PTS.FALHAS_PERMITIDAS) : 0;
    P.pct = P.meta ? Math.max(0, Math.min(100, Math.round(100 * P.pts / P.meta))) : 0;
    P.falta = Math.max(0, P.meta - P.pts);
  });
  return out;
}
function pontuacao(pessoa, pin, ref) {
  const viewer = quemVe_(pessoa, pin);
  const w = semanaDe_(ref);
  if (!viewer.id) return { de: w.de, ate: w.ate, equipe: { pct: 0, checks: 0, selos: {} }, regras: PTS };
  return comLeituraRapida_(() => {
    const P = calcularPontos_(w.de, w.ate), L = Object.keys(P).map(k => P[k]).filter(p => p.meta > 0 || p.pts !== 0);
    const meta = L.reduce((a, p) => a + p.meta, 0), pts = L.reduce((a, p) => a + Math.max(0, p.pts), 0);
    const checks = L.reduce((a, p) => a + p.selos.responsabilidade + p.selos.compromisso + p.selos.integracao + p.selos.criatividade + p.selos.validadas, 0);
    const equipe = { meta: meta, pts: pts, pct: meta ? Math.min(100, Math.round(100 * pts / meta)) : 0, checks: checks, colaboradores: L.length };
    const selosEq = {}; ['responsabilidade', 'compromisso', 'integracao', 'criatividade', 'validadas', 'suporte', 'engajamento'].forEach(k => selosEq[k] = L.reduce((a, p) => a + p.selos[k], 0));
    equipe.selos = selosEq;
    const r = { de: w.de, ate: w.ate, equipe: { pct: equipe.pct, checks: checks, selos: selosEq }, regras: PTS };
    if (viewer.id) r.meuEng = engajamentoDe_(viewer.id);
    if (viewer.id && P[viewer.id]) { const eu = P[viewer.id]; r.eu = { pts: eu.pts, meta: eu.meta, pct: eu.pct, falta: eu.falta, selos: eu.selos, neg: eu.neg }; }
    if (viewer.gestor) { r.equipe = equipe; r.pessoas = L.sort((a, b) => b.pct - a.pct || b.pts - a.pts);
      r.ideias = rows_('Demandas').filter(x => x.item === 'ideia').map(x => ({ id: x.id, dia: x.dia, pessoa: x.pessoa, texto: x.detalhe, estado: x.estado })).slice(-30).reverse();
      r.indiretas = rows_('Indiretas').filter(x => x.dia >= w.de && x.dia <= w.ate).map(x => ({ id: x.id, dia: x.dia, pessoa: x.pessoa, obs: x.obs }));
      r.demandas = resumoDemandas_(w.de, w.ate); r.engajamento = engajamentoDe_(''); }
    return r;
  });
}
function registrarIndireta(pessoa, pin, alvo, obs) {
  checkGestor_(pessoa, pin);
  if (!rows_('Equipe').some(e => e.id === alvo)) throw new Error('Escolha o colaborador.');
  const sh = sheet_('Indiretas');
  sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Indiretas.length).setNumberFormat('@')
    .setValues([['i' + Date.now().toString(36), hoje_(), alvo, limpa_(obs, 200), pessoa, hoje_() + ' ' + agora_()]]);
  return pontuacao(pessoa, pin, '');
}
function validarIdeia(pessoa, pin, id) {
  checkGestor_(pessoa, pin);
  const sh = sheet_('Demandas'), v = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < v.length; i++) if (v[i][0] === id) {
    sh.getRange(i + 1, HEAD.Demandas.indexOf('estado') + 1).setValue('validada');
    sh.getRange(i + 1, HEAD.Demandas.indexOf('atendida_por') + 1).setValue(pessoa);
    sh.getRange(i + 1, HEAD.Demandas.indexOf('atendida_hora') + 1).setValue(agora_());
    evento_('ideia', pessoa, '💡 Ideia de ' + nomeDe_(v[i][4]) + ' validada pela coordenação (+' + PTS.IDEIA_VALIDADA + ' pts).', 'todos');
    return pontuacao(pessoa, pin, '');
  }
  throw new Error('Ideia não encontrada.');
}

/* Carteirinha do programa: cada emissão recebe um número novo, em sequência. */
function emitirCarteirinha(pessoa, pin, prog, pid) {
  checkPin_(pessoa, pin);
  if (!progOk_(prog)) throw new Error('Programa inválido.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const p = rows_('Participantes').find(x => x.id === pid && x.programa === prog);
    if (!p) throw new Error('Cadastro não encontrado.');
    if (p.ativo === 'não') throw new Error('Este cadastro está inativo.');
    const sh = sheet_('Carteirinhas');
    const pr = PropertiesService.getScriptProperties();
    const seq = Math.max(Number(pr.getProperty('CART_SEQ') || 0), sh.getLastRow() - 1) + 1;
    pr.setProperty('CART_SEQ', String(seq));
    const numero = String(seq).padStart(5, '0');
    const dia = hoje_(), hora = agora_();
    sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Carteirinhas.length).setNumberFormat('@')
      .setValues([[numero, dia, hora, prog, pid, p.nome, p.telefone, p.endereco, p.sus, pessoa]]);
    const via = rows_('Carteirinhas').filter(x => x.participante === pid).length;
    return { numero: numero, dia: dia, via: via, programa: (PROGRAMAS.find(x => x.k === prog) || {}).t || prog,
      nome: p.nome, telefone: p.telefone, endereco: p.endereco, sus: p.sus, responsavel: p.responsavel };
  } finally { lock.releaseLock(); }
}

function addTarefa(pessoa, pin, t) {
  checkGestor_(pessoa, pin);
  if (!t || !t.dia || !/^\d{4}-\d{2}-\d{2}$/.test(t.dia)) throw new Error('Escolha a data.');
  if (!t.titulo) throw new Error('Escreva o nome da tarefa.');
  const m = String(t.hora || '').match(/(\d{1,2})\D?(\d{2})?/);
  const ordem = m ? Number(m[1]) * 60 + Number(m[2] || 0) : 1439;
  const id = 't' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  if (hm_(t.hora) == null) throw new Error('Informe o horário de início.');
  if (hm_(t.fim) == null || hm_(t.fim) <= hm_(t.hora)) throw new Error('Informe o horário de fim (prazo), depois do início.');
  const row = [t.dia, id, t.hora || '', String(ordem), t.turno || 'manha', t.titulo, (t.pessoas || []).join(','), (t.itens || []).join(' | '), (t.metas || []).join(' | '), t.atividade ? 'sim' : 'não', hhmm_(hm_(t.fim))];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const sh = ss_().getSheetByName('Tarefas'); sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]); }
  finally { lock.releaseLock(); }
  return getData(t.dia, pessoa, pin);
}

function delTarefa(pessoa, pin, dia, id) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode excluir atividades.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = ss_().getSheetByName('Tarefas');
    const v = sh.getDataRange().getDisplayValues();
    for (let i = v.length - 1; i >= 1; i--) if (v[i][0] === dia && v[i][1] === id) { sh.deleteRow(i + 1); break; }
  } finally { lock.releaseLock(); }
  return getData(dia, pessoa, pin);
}

/* Só o Victor: muda a data e o horário (novo prazo) de uma atividade. Se havia pedido de prazo, conta como aprovado. */
function moverTarefa(pessoa, pin, dia, id, novoDia, hora, fim) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode mudar a data ou o prazo.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(novoDia || ''))) throw new Error('Escolha a nova data.');
  const a = hm_(hora), b = hm_(fim);
  if (a == null || b == null || b <= a) throw new Error('Confira o horário: o fim precisa ser depois do início.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let tituloT = '', pessoasT = '', novoId = id, pedido = false;
  try {
    const sh = sheet_('Tarefas'), v = sh.getDataRange().getDisplayValues(), H = v[0], c = k => H.indexOf(k);
    const i = v.findIndex((r, k) => k > 0 && r[0] === dia && r[1] === id);
    if (i < 1) throw new Error('Atividade não encontrada.');
    if (novoDia !== dia && v.some((r, k) => k > 0 && r[0] === novoDia && r[1] === id)) novoId = id + '_' + Date.now().toString(36).slice(-4);
    const r = v[i].slice(); tituloT = r[c('titulo')]; pessoasT = r[c('pessoas')];
    r[c('dia')] = novoDia; r[c('id')] = novoId; r[c('hora')] = hhmm_(a); r[c('fim')] = hhmm_(b); r[c('ordem')] = String(a);
    r[c('turno')] = a < 12 * 60 ? 'manha' : 'tarde';
    sh.getRange(i + 1, 1, 1, H.length).setNumberFormat('@').setValues([r]);
    // o status (iniciada, pedido de prazo…) acompanha a atividade; o pedido de prazo fica resolvido
    const st = sheet_('Status'), sv = st.getDataRange().getDisplayValues(), j = sv.findIndex((x, k) => k > 0 && x[0] === dia + '__' + id);
    if (j > 0) {
      const sc = k => HEAD.Status.indexOf(k); const row = sv[j].slice(); pedido = row[sc('prazo_pedido')] === 'sim';
      row[sc('chave')] = novoDia + '__' + novoId; row[sc('dia')] = novoDia; row[sc('bloco')] = novoId;
      row[sc('prazo_pedido')] = ''; row[sc('prazo_opcao')] = ''; row[sc('prazo_ext')] = '';
      st.getRange(j + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    }
  } finally { lock.releaseLock(); }
  const quando = novoDia.slice(8) + '/' + novoDia.slice(5, 7) + ' das ' + hhmm_(a) + ' às ' + hhmm_(b);
  evento_('alteracao', pessoasT, (pedido ? '👍 Coordenação aprovou o novo prazo: "' : '📅 Coordenação mudou a data de "') + tituloT + '" para ' + quando + '.', 'todos', novoId);
  return { ok: true, dia: novoDia, id: novoId, quando: quando, aprovado: pedido };
}
/* 🔔 Alerta geral para a equipe (aparece nos avisos de todos). */
function alertaEquipe(pessoa, pin, texto) {
  checkGestor_(pessoa, pin);
  const tx = limpa_(texto, 300) || '🔔 Atenção, equipe! Confiram as atividades de hoje no app: iniciar, concluir com foto e bater o ponto. Bora! 💙';
  evento_('alerta', '', tx, 'todos', '');
  return { ok: true };
}
function copiarDia(pessoa, pin, de, para) {
  checkGestor_(pessoa, pin);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(para || '')) throw new Error('Escolha a data de destino.');
  const todas = rows_('Tarefas');
  if (todas.some(t => t.dia === para)) throw new Error('O dia de destino já tem tarefas. Apague antes ou escolha outra data.');
  const orig = todas.filter(t => t.dia === de);
  if (!orig.length) throw new Error('O dia de origem não tem tarefas.');
  const rows = orig.map(t => [para, t.id, t.hora, t.ordem, t.turno, t.titulo, t.pessoas, t.itens, t.metas, t.atividade, t.fim || fimTarefa_(t)]);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const sh = ss_().getSheetByName('Tarefas'); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setNumberFormat('@').setValues(rows); }
  finally { lock.releaseLock(); }
  return getData(para, pessoa, pin);
}

/* ------------------------------------------------------------------ */
/* Relatório do mês                                                    */
/* ------------------------------------------------------------------ */

function relatorioMes_(mes) {
  const [y, m] = mes.split('-').map(Number);
  const de = mes + '-01';
  const ate = isoAdd_(Utilities.formatDate(new Date(Date.UTC(y, m, 1, 12)), 'UTC', 'yyyy-MM-dd'), -1);
  const ss = ss_();
  const nome = 'Relatório ' + mes;
  let sh = ss.getSheetByName(nome);
  if (sh) sh.clear(); else sh = ss.insertSheet(nome);

  const pessoas = resumo_(de, ate);
  const hh = m => Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0');
  const linhas = [['Relatório mensal — ' + mes.slice(5) + '/' + mes.slice(0, 4), '', '', '', '', '', '', ''],
    ['Gerado em ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm') + ' · horário previsto = aba Horarios (ou 1ª tarefa) · tolerância ' + TOLERANCIA + ' min', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['Pessoa', 'Dias presentes', 'Faltas', 'Atrasos (min)', 'Saídas antes', 'Externas / Emergências', 'Horas feitas / previstas', 'Ocorrências']];
  pessoas.forEach(p => linhas.push([p.nome, p.presencas, p.faltas + (p.faltasDias.length ? ' (' + p.faltasDias.join(', ') + ')' : ''),
    p.atrasos + ' (' + p.minAtraso + ' min)', p.saidasAntes, p.externas + ' / ' + p.emergencias, hh(p.minutos) + ' / ' + hh(p.minPrevistos),
    p.ocorrencias.concat(p.semFoto ? [p.semFoto + ' entrada(s) sem foto'] : []).join(' · ')]));
  sh.getRange(1, 1, linhas.length, 8).setValues(linhas);
  sh.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  sh.getRange(4, 1, 1, 8).setFontWeight('bold').setBackground('#E9EDF4');

  const tarefas = rows_('Tarefas').filter(t => t.dia >= de && t.dia <= ate);
  const status = {}; rows_('Status').forEach(s => status[s.chave] = s);
  const ativ = tarefas.filter(t => /^(sim|s|true|x|1)$/i.test(String(t.atividade).trim()));
  let r = linhas.length + 2;
  const tot = tarefas.length, concl = tarefas.filter(t => (status[t.dia + '__' + t.id] || {}).estado === 'concluida').length;
  const ativOk = ativ.filter(t => { const s = status[t.dia + '__' + t.id] || {}; return s.lista === 'sim' && s.foto === 'sim'; }).length;
  sh.getRange(r, 1, 3, 2).setValues([
    ['Tarefas concluídas', concl + ' de ' + tot + (tot ? ' (' + Math.round(100 * concl / tot) + '%)' : '')],
    ['Atividades com lista + foto', ativOk + ' de ' + ativ.length + (ativ.length ? ' (' + Math.round(100 * ativOk / ativ.length) + '%)' : '')],
    ['', '']]);
  sh.getRange(r, 1, 2, 1).setFontWeight('bold');
  r += 3;
  const at = [['Atividades do mês', 'Data', 'Início', 'Fim', 'Frequência', 'Foto todos juntos', 'Situação', 'Prazo / avaliação']];
  ativ.sort((a, b) => (a.dia + a.ordem).localeCompare(b.dia + b.ordem)).forEach(t => {
    const s = status[t.dia + '__' + t.id] || {};
    at.push([t.titulo, t.dia.slice(8) + '/' + t.dia.slice(5, 7), s.inicio || '', s.fim || '', s.freq_url ? 'enviada ' + s.freq_hora + (mins_(s.freq_hora) > mins_(fimTarefa_(t)) + FREQ_PRAZO_MIN ? ' (atrasada)' : '') : 'não enviada', s.foto === 'sim' ? 'sim' : 'não', s.estado === 'concluida' ? 'Concluído' : s.estado === 'andamento' ? 'Iniciado' : 'Não marcado',
      (s.prazo_ext ? 'estendido até ' + s.prazo_ext.slice(8, 10) + '/' + s.prazo_ext.slice(5, 7) + ' ' + s.prazo_ext.slice(11) : 'até ' + fimTarefa_(t))
      + (s.estado === 'concluida' && s.fim && (t.dia + ' ' + s.fim) > (s.prazo_ext || (t.dia + ' ' + fimTarefa_(t))) ? ' · fora do prazo' : '')
      + (s.avaliacao ? ' · ' + { aprovada: 'aprovada', aprimorar: 'aprimorar', refazer: 'refazer' }[s.avaliacao] : '')]);
  });
  sh.getRange(r, 1, at.length, 8).setValues(at);
  sh.getRange(r, 1, 1, 8).setFontWeight('bold').setBackground('#E9EDF4');
  sh.autoResizeColumns(1, 8);
  return ss.getUrl() + '#gid=' + sh.getSheetId();
}

function gerarRelatorio(pessoa, pin, mes) {
  checkGestor_(pessoa, pin);
  if (!/^\d{4}-\d{2}$/.test(mes || '')) throw new Error('Escolha o mês.');
  return { url: relatorioMes_(mes) };
}

/* ------------------------------------------------------------------ */
/* Automações (rode "instalarAutomacoes" uma vez)                      */
/* ------------------------------------------------------------------ */

function instalarAutomacoes() {
  const nomes = ['alertaAtrasos', 'relatorioAutomatico', 'relatorioSemanal'];
  ScriptApp.getProjectTriggers().forEach(t => { if (nomes.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('alertaAtrasos').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('relatorioAutomatico').timeBased().onMonthDay(5).atHour(7).inTimezone(TZ).create();
  ScriptApp.newTrigger('relatorioSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SATURDAY).atHour(10).nearMinute(0).inTimezone(TZ).create();
  PropertiesService.getScriptProperties().setProperty('AUTO_V24', '1');
  try { UrlFetchApp.fetch('https://anchor.fm/s/e9728c8/podcast/rss', { muteHttpExceptions: true }); } catch (e) { Logger.log(e); }
  recomeco_();
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'gerarNarracoes') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('gerarNarracoes').timeBased().everyDays(1).atHour(6).inTimezone(TZ).create();
  try { const r = gerarNarracoes(); Logger.log('Narrações: ' + JSON.stringify(r)); } catch (e) { Logger.log('Narrações: ' + e.message); }
  Logger.log('Automações ligadas: aviso de quem não chegou ou não voltou (confere a cada 15 min), relatório do mês todo dia 5 às 7h e diagnóstico da semana todo sábado às 10h.');
  Logger.log('Os avisos vão para: ' + Session.getEffectiveUser().getEmail());
}

/* Avisa por e-mail quem passou ALERTA_APOS minutos do horário previsto sem registrar entrada.
   Cada pessoa é avisada uma vez por dia. */
function alertaAtrasos() {
  verificarPendencias_(true);
  const agoraMin = mins_(agora_());
  if (agoraMin < 4 * 60 + 30 || agoraMin > 20 * 60) return;
  const hoje = hoje_();
  const props = PropertiesService.getScriptProperties();
  const chave = 'alertados_' + hoje;
  const ja = (props.getProperty(chave) || '').split(',').filter(Boolean);
  const lista = agoraNaOng_().faltando.filter(p => agoraMin >= p.minEsperado + ALERTA_APOS && ja.indexOf(p.chave) < 0);
  if (!lista.length) return;
  const corpo = 'Ainda não registraram a entrada (' + Utilities.formatDate(new Date(), TZ, 'dd/MM HH:mm') + '):\n\n'
    + lista.map(p => '• ' + p.nome + ' — previsto ' + p.esperado + ' (' + p.tarefa + ')').join('\n')
    + '\n\nO horário previsto vem da aba Horarios (ou da 1ª tarefa, para quem não tem horário fixo).\nPlanilha: ' + ss_().getUrl();
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Gestão do Dia: ' + lista.map(p => p.nome).join(', ') + ' sem entrada', corpo);
  props.setProperty(chave, ja.concat(lista.map(p => p.chave)).join(','));
}

/* Liga o diagnóstico de sábado sozinho, na primeira vez que o app for aberto depois da atualização. */
function garantirAutomacoes_() {
  try {
    const pr = PropertiesService.getScriptProperties();
    if (pr.getProperty('AUTO_V24')) return;
    if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'relatorioSemanal'))
      ScriptApp.newTrigger('relatorioSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SATURDAY).atHour(10).nearMinute(0).inTimezone(TZ).create();
    pr.setProperty('AUTO_V24', '1');
  } catch (e) { Logger.log(e); }
}

/* Diagnóstico da semana: metas, falhas e % de cada um. Vai por e-mail todo sábado às 10h
   e fica salvo na aba Diagnostico. Cobre de segunda até sexta (dias fechados). */
function diagnosticoSemana_(ref) {
  const w = semanaDe_(ref || hoje_());
  const ate = isoAdd_(w.de, 4) < hoje_() ? isoAdd_(w.de, 4) : hoje_();
  return comLeituraRapida_(() => {
    const P = calcularPontos_(w.de, ate);
    const L = Object.keys(P).map(k => P[k]).filter(p => p.meta > 0 || p.pts !== 0).sort((a, b) => b.pct - a.pct || b.pts - a.pts);
    const meta = L.reduce((a, p) => a + p.meta, 0), pts = L.reduce((a, p) => a + Math.max(0, p.pts), 0);
    return { de: w.de, ate: ate, pessoas: L, equipe: { meta: meta, pts: pts, pct: meta ? Math.min(100, Math.round(100 * pts / meta)) : 0,
      batida: L.filter(p => p.pts >= p.meta).length, total: L.length }, demandas: resumoDemandas_(w.de, ate) };
  });
}
function diagnosticoHtml_(D) {
  const br = iso => iso.slice(8) + '/' + iso.slice(5, 7);
  const cor = p => p >= 100 ? '#16a34a' : p >= 70 ? '#2459B8' : p >= 50 ? '#d97706' : '#dc2626';
  const bar = (p, c) => '<div style="background:#e5e9f2;border-radius:6px;height:12px;width:100%"><div style="background:' + c + ';height:12px;border-radius:6px;width:' + Math.max(2, Math.min(100, p)) + '%"></div></div>';
  const falhas = n => [n.advertencias ? '⚠️ ' + n.advertencias + ' advertência(s)' : '', n.naoFeitasComPrazo ? '⏱ ' + n.naoFeitasComPrazo + ' não feita(s) c/ prazo' : '',
    n.atrasos ? '🐢 ' + n.atrasos + ' atraso(s) (' + n.minAtraso + ' min)' : '', n.faltas ? '🚫 ' + n.faltas + ' falta(s)' : '', n.indiretas ? '📵 ' + n.indiretas + ' fora do app' : ''].filter(Boolean).join(' · ') || '✅ Sem falhas';
  const dm = D.demandas;
  let h = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#141826">'
    + '<div style="background:#2459B8;color:#fff;border-radius:14px;padding:18px 20px"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Amigos de Maribondo · Diagnóstico da semana</div>'
    + '<div style="font-size:22px;font-weight:bold;margin-top:4px">' + br(D.de) + ' a ' + br(D.ate) + '</div>'
    + '<div style="font-size:40px;font-weight:bold;margin-top:8px">' + D.equipe.pct + '%</div><div>da meta da equipe · ' + D.equipe.pts + ' / ' + D.equipe.meta + ' pts · ' + D.equipe.batida + ' de ' + D.equipe.total + ' bateram a meta</div></div>'
    + '<table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:14px">';
  D.pessoas.forEach(p => {
    h += '<tr><td style="padding:10px 6px;border-bottom:1px solid #e5e9f2;width:34%"><b>' + p.nome + '</b><br><span style="color:#5b6275;font-size:12px">' + p.pts + ' / ' + p.meta + ' pts</span></td>'
      + '<td style="padding:10px 6px;border-bottom:1px solid #e5e9f2">' + bar(p.pct, cor(p.pct)) + '<div style="font-size:12px;color:#5b6275;margin-top:4px">' + falhas(p.neg) + '</div></td>'
      + '<td style="padding:10px 6px;border-bottom:1px solid #e5e9f2;text-align:right;font-weight:bold;color:' + cor(p.pct) + ';font-size:18px">' + p.pct + '%' + (p.pts >= p.meta ? '<br><span style="font-size:11px">🏆 meta</span>' : '') + '</td></tr>';
  });
  h += '</table>'
    + '<div style="margin-top:14px;background:#f4f5f8;border-radius:12px;padding:14px"><b>📦 Demandas (prazo de ' + dm.prazoH + 'h)</b><br>'
    + dm.total + ' pedidos · ✅ ' + dm.noPrazo + ' no prazo · ⏳ ' + dm.foraPrazo + ' fora do prazo · ❌ ' + dm.naoRespondidas + ' não respondidas · ' + dm.abertas + ' abertas<br>'
    + '<div style="margin-top:6px">' + bar(dm.pct, cor(dm.pct)) + '</div><span style="font-size:12px;color:#5b6275">' + dm.pct + '% respondidas no prazo</span></div>'
    + '<p style="font-size:12px;color:#5b6275;margin-top:14px">Verde: meta batida · Azul: 70% ou mais · Laranja: 50–69% · Vermelho: abaixo de 50%. Veja o quadro completo em Gestão → Diagnóstico da semana.</p></div>';
  return h;
}
function relatorioSemanal() {
  const D = diagnosticoSemana_(hoje_());
  const sh = sheet_('Diagnostico');
  D.pessoas.forEach(p => sh.appendRow([D.de, D.ate, p.nome, p.pts, p.meta, p.pct + '%', p.neg.advertencias, p.neg.naoFeitasComPrazo, p.neg.atrasos, p.neg.faltas, p.neg.indiretas, Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm')]));
  const txt = 'Diagnóstico da semana ' + D.de + ' a ' + D.ate + '\nEquipe: ' + D.equipe.pct + '% da meta\n\n' + D.pessoas.map(p => p.nome + ': ' + p.pct + '% (' + p.pts + '/' + p.meta + ')').join('\n') + '\n\nApp: ' + APP_URL;
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: '📊 Diagnóstico da semana: equipe em ' + D.equipe.pct + '% da meta', body: txt, htmlBody: diagnosticoHtml_(D) });
}

function enviarDiagnostico(pessoa, pin) { checkGestor_(pessoa, pin); relatorioSemanal(); return { ok: true, email: Session.getEffectiveUser().getEmail() }; }

function relatorioAutomatico() {
  const d = new Date();
  const mesPassado = Utilities.formatDate(new Date(d.getFullYear(), d.getMonth() - 1, 15), TZ, 'yyyy-MM');
  const url = relatorioMes_(mesPassado);
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Gestão do Dia: relatório de ' + mesPassado.slice(5) + '/' + mesPassado.slice(0, 4), 'O relatório do mês está pronto:\n' + url);
}

/* ------------------------------------------------------------------ */
/* Equipe nova e horários da semana (rode "atualizarEquipeEHorarios"   */
/* uma vez). Depois, ajuste direto na aba Horarios da planilha.        */
/* ------------------------------------------------------------------ */

function atualizarEquipeEHorarios() {
  const novos = [
    ['klarice', 'Klarice', '#C026D3', '6174'],
    ['jaqueline', 'Jaqueline', '#475569', '3826']
  ];
  const eq = sheet_('Equipe');
  const ids = rows_('Equipe').map(r => r.id);
  novos.forEach(n => {
    if (ids.indexOf(n[0]) >= 0) return;
    eq.getRange(eq.getLastRow() + 1, 1, 1, 4).setNumberFormat('@').setValues([n]);
    Logger.log('Adicionada: ' + n[1] + ' · PIN ' + n[3]);
  });

  const H = [
    // pessoa, dias, início, fim, observação
    ['patricia', 'seg ter qua qui sex', '08:00', '12:00', ''],
    ['patricia', 'seg ter qua qui sex', '14:00', '18:00', ''],
    ['lucas', 'seg ter qua qui sex', '08:00', '12:00', ''],
    ['lucas', 'seg ter qua qui sex', '14:00', '18:00', ''],
    ['victor', 'todos', 'livre', '', 'coordenação: sem horário fixo'],
    ['kallyne', 'ter qua qui sex', '08:00', '12:00', 'segunda não vem de manhã'],
    ['kallyne', 'seg ter qua qui sex', '14:00', '18:00', ''],
    ['bruna', 'seg ter qua qui sex', '14:00', '18:00', 'só à tarde'],
    ['piedade', 'seg', '15:30', '17:00', ''],
    ['piedade', 'ter', '08:00', '12:00', ''],
    ['piedade', 'ter', '14:00', '18:00', ''],
    ['piedade', 'qua', '05:00', '07:30', 'Flor da Idade'],
    ['klaudinha', 'seg', '15:45', '19:00', ''],
    ['klaudinha', 'ter qua sex', '18:00', '19:00', ''],
    ['klaudinha', 'qui', '17:00', '19:00', ''],
    ['freitas', 'seg ter qua qui sex', '09:00', '11:00', ''],
    ['freitas', 'seg ter qua qui sex', '15:00', '18:00', ''],
    ['freitas', 'qua', '05:00', '07:00', 'Flor da Idade'],
    ['nivaldo', 'seg ter qui', '08:00', '11:00', ''],
    ['nivaldo', 'seg ter qui', '15:00', '17:00', 'Flor da Idade e Kids'],
    ['nivaldo', 'qua', '05:00', '07:30', 'Flor da Idade'],
    ['nivaldo', 'qua', '09:00', '12:00', 'começa depois do Flor'],
    ['nivaldo', 'qua', '14:00', '18:00', ''],
    ['binha', 'seg', '09:00', '11:00', ''],
    ['binha', 'seg', '15:00', '17:30', ''],
    ['binha', 'ter', '14:00', '17:00', ''],
    ['binha', 'qua', '05:00', '07:30', 'Flor da Idade'],
    ['binha', 'qua', '14:00', '16:00', ''],
    ['gemea', 'seg', '16:00', '19:00', ''],
    ['gemea', 'ter', '14:00', '19:00', ''],
    ['gemea', 'qua', '05:00', '07:30', 'Flor da Idade'],
    ['gemea', 'sab', '06:30', '09:30', ''],
    ['klarice', 'qua qui', '14:00', '19:00', ''],
    ['klarice', 'sex', '17:00', '19:00', ''],
    ['klarice', 'sab', '06:30', '09:30', ''],
    ['jaqueline', 'ter', '08:00', '12:00', 'psicologia'],
    ['jaqueline', 'ter', '14:00', '18:00', 'psicologia']
  ];
  const sh = sheet_('Horarios');
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.Horarios.length).setValues(
    Array.from({ length: sh.getLastRow() - 1 }, () => HEAD.Horarios.map(() => '')));
  sh.getRange(2, 1, H.length, 5).setNumberFormat('@').setValues(H);
  Logger.log('Horários gravados: ' + H.length + ' linhas na aba Horarios.');

  // horário de fim (prazo) das tarefas de segunda 09/11
  const FIM = { b01: '08:30', b02: '12:00', b03: '12:00', b04: '12:00', b05: '18:00', b06: '18:00', b07: '16:00', b08: '18:00',
    b09: '16:00', b10: '17:00', b11: '18:00', b12: '18:15', b13: '19:00', b14: '19:15' };
  const tsh = sheet_('Tarefas');
  const tv = tsh.getDataRange().getDisplayValues();
  const colFim = HEAD.Tarefas.indexOf('fim') + 1;
  for (let i = 1; i < tv.length; i++) if (tv[i][0] === '2026-11-09' && FIM[tv[i][1]] && !tv[i][colFim - 1]) tsh.getRange(i + 1, colFim).setNumberFormat('@').setValue(FIM[tv[i][1]]);
  Logger.log('Horário de fim das tarefas de 09/11 gravado.');
}

/* ================================================================== */
/* Histórico do dia, pendências automáticas e resposta do suporte      */
/* ================================================================== */

/* publico: 'todos' (toda a equipe vê), 'gestao' (só coordenação), 'pessoa' (só a pessoa "alvo" e a coordenação). */
function evento_(tipo, pessoa, texto, publico, bloco, alvo) {
  if (RC_) delete RC_['Eventos'];
  try {
    const sh = sheet_('Eventos');
    sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Eventos.length).setNumberFormat('@')
      .setValues([[hoje_(), agora_(), String(Date.now()), tipo, pessoa || '', bloco || '', texto, publico || 'todos', alvo || '']]);
  } catch (e) { Logger.log(e); }
}

const AVISO_CONFIRMA = ['alteracao', 'alerta', 'cobranca', 'resposta', 'semfoto', 'suporte', 'prazo'];
function eventosDia_(dia, viewer) {
  const vistos = {};
  rows_('AvisoVistos').filter(v => v.dia === dia).forEach(v => { (vistos[v.ms] = vistos[v.ms] || []).push(v.pessoa); });
  const equipe = rows_('Equipe').map(e => e.id).filter(id => id && GESTORES.indexOf(id) < 0 && PRIVADOS.indexOf(id) < 0);
  return rows_('Eventos')
    .filter(e => e.dia === dia && (viewer.gestor || e.publico === 'todos' || (e.alvo && e.alvo === viewer.id)))
    .map(e => {
      let esperados = [];
      if (AVISO_CONFIRMA.indexOf(e.tipo) >= 0 && e.publico !== 'gestao' && e.publico !== 'gestor') {
        esperados = e.tipo === 'alerta' ? equipe : (e.alvo ? [e.alvo] : String(e.pessoa || '').split(',').map(x => x.trim()));
        esperados = esperados.filter(id => id && GESTORES.indexOf(id) < 0 && PRIVADOS.indexOf(id) < 0);
      }
      return { hora: e.hora, ms: Number(e.ms) || 0, tipo: e.tipo, pessoa: e.pessoa, bloco: e.bloco, texto: e.texto, publico: e.publico, alvo: e.alvo,
        esperados: esperados, vistos: vistos[e.ms] || [] };
    })
    .sort((a, b) => b.ms - a.ms);
}
function confirmarAviso(pessoa, pin, ms) {
  checkPin_(pessoa, pin);
  const ev = rows_('Eventos').find(e => e.ms === String(ms));
  if (!ev) throw new Error('Aviso não encontrado.');
  upsert_('AvisoVistos', String(ms) + '|' + pessoa, { ms: String(ms), dia: ev.dia, pessoa: pessoa, hora: agora_() });
  return { ok: true, ms: String(ms), pessoa: pessoa };
}
function cobrarPonto(pessoa, pin, alvo, estado) {
  checkGestor_(pessoa, pin);
  const p = rows_('Equipe').find(e => e.id === alvo);
  if (!p) throw new Error('Colaborador não encontrado.');
  const tx = estado === 'falta_saida' || estado === 'sem_saida' ? '⏱ A coordenação lembra: falta bater a SAÍDA no ponto. Abra Ponto e registre agora.'
    : estado === 'nao_voltou' ? '⏱ A coordenação lembra: registre a VOLTA do intervalo no ponto.'
    : '⏱ A coordenação lembra: seu ponto de ENTRADA ainda não foi batido hoje. Abra Ponto e registre, ou avise o que aconteceu.';
  evento_('cobranca', alvo, tx, 'pessoa', '', alvo);
  return { ok: true };
}

function avisarGestor_(assunto, corpo) {
  try { MailApp.sendEmail(Session.getEffectiveUser().getEmail(), assunto, corpo + '\n\nApp: ' + APP_URL); } catch (e) { Logger.log(e); }
}

/* Número no formato do WhatsApp (55 + DDD + número). */
function wa_(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return d.length >= 12 ? d : '';
}

/* Confere atrasos de início, prazos vencidos e suporte sem resposta. Roda pelo alerta automático e ao abrir o app. */
function verificarPendencias_(forcar) {
  try {
    const pr = PropertiesService.getScriptProperties();
    if (!forcar && Date.now() - Number(pr.getProperty('VERIF_MS') || 0) < 2 * 60 * 1000) return;
    garantirAutomacoes_();
    pr.setProperty('VERIF_MS', String(Date.now()));
    const hoje = hoje_(), hora = agora_(), agoraMin = mins_(hora), agoraDT = hoje + ' ' + hora;
    const chave = 'pend_' + hoje;
    const feitos = (pr.getProperty(chave) || '').split(',').filter(Boolean);
    const novos = [], paraGestor = [];
    const equipe = {}; rows_('Equipe').forEach(e => equipe[e.id] = e);
    const nomes = ids => ids.map(i => (equipe[i] || {}).nome || i).join(', ');
    const status = {}; rows_('Status').forEach(x => status[x.chave] = x);
    rows_('Tarefas').filter(t => t.dia === hoje).forEach(t => {
      const st = status[t.dia + '__' + t.id] || {};
      const pessoas = String(t.pessoas || '').split(',').map(x => x.trim()).filter(Boolean);
      const ini = hm_(t.hora);
      const k1 = 'ini:' + t.id;
      if ((!st.estado || st.estado === 'pendente') && ini != null && agoraMin >= ini + ATRASO_INICIO_MIN && feitos.indexOf(k1) < 0) {
        const tx = '⚠️ "' + t.titulo + '" está atrasada: não foi iniciada até ' + hhmm_(ini + ATRASO_INICIO_MIN) + ' (' + nomes(pessoas) + ').';
        evento_('atraso', pessoas.join(','), tx, 'todos', t.id); novos.push(k1); paraGestor.push(tx);
      }
      const prazo = st.prazo_ext || (t.dia + ' ' + fimTarefa_(t));
      const k2 = 'prazo:' + t.id + ':' + prazo.replace(/\D/g, '');
      if (st.estado !== 'concluida' && agoraDT > prazo && feitos.indexOf(k2) < 0) {
        const tx = '⛔ Prazo de "' + t.titulo + '" acabou às ' + fmtDT_(prazo, hoje) + ' sem conclusão (' + nomes(pessoas) + '). Só suporte ou prazo adicional.';
        evento_('vencida', pessoas.join(','), tx, 'todos', t.id); novos.push(k2); paraGestor.push(tx);
      }
      const ehAtiv = /^(sim|s|true|x|1)$/i.test(String(t.atividade).trim());
      const kf = 'freq:' + t.id;
      if (ehAtiv && !st.freq_url && agoraMin > mins_(fimTarefa_(t)) + FREQ_PRAZO_MIN && feitos.indexOf(kf) < 0) {
        const tx = '📋 A frequência de "' + t.titulo + '" não foi enviada até ' + hhmm_(mins_(fimTarefa_(t)) + FREQ_PRAZO_MIN) + ' (' + nomes(pessoas) + ').';
        evento_('frequencia', pessoas.join(','), tx, 'todos', t.id); novos.push(kf); paraGestor.push(tx);
      }
      const ksf = 'semfoto:' + t.dia + '__' + t.id;
      if (st.estado === 'concluida' && !st.foto_conclusao && feitos.indexOf(ksf) < 0) {
        const tx = '📷 "' + t.titulo + '" foi concluída sem foto (' + nomes(pessoas) + '). Peça a foto pelo app.';
        evento_('semfoto', pessoas.join(','), tx, 'todos', t.id); novos.push(ksf); paraGestor.push(tx);
      }
      if (st.suporte === 'sim' && !st.suporte_resp && st.suporte_hora && st.suporte_cobrado !== 'sim' && agoraMin >= mins_(st.suporte_hora) + SUPORTE_RESPOSTA_MIN) {
        const nome = (equipe[st.suporte_por] || {}).nome || st.suporte_por;
        evento_('cobranca', st.suporte_por, '⏰ ' + nome + ', o suporte de "' + t.titulo + '" não foi respondido em 2h: execute a tarefa ou solicite prazo.', 'pessoa', t.id, st.suporte_por);
        upsert_('Status', t.dia + '__' + t.id, { dia: t.dia, bloco: t.id, suporte_cobrado: 'sim' });
        paraGestor.push('⏰ Suporte de ' + nome + ' em "' + t.titulo + '" está sem resposta há 2h. ' + nome + ' recebeu: "execute a tarefa ou solicite prazo".');
      }
    });
    const agoraMs = Date.now();
    rows_('Demandas').forEach(dm => {
      if (dm.item === 'ideia' || dm.estado === 'atendida' || dm.estado === 'validada' || dm.dia < INICIO_GERAL) return;
      const kd = 'dem5h:' + dm.id;
      if (situacaoDemanda_(dm, agoraMs).sit !== 'nao_respondida' || feitos.indexOf(kd) >= 0) return;
      const def = DEMANDAS.find(x => x.k === dm.item) || { t: dm.item };
      const tx = '📦 Demanda sem resposta há mais de ' + DEMANDA_PRAZO_H + 'h: ' + def.t + (dm.detalhe ? ' — ' + dm.detalhe : '') + ' (pedido de ' + ((equipe[dm.pessoa] || {}).nome || dm.pessoa) + ', ' + dm.hora + '). Foi para "Não respondidas".';
      evento_('demanda', dm.pessoa, tx, 'gestao'); novos.push(kd); paraGestor.push(tx);
    });
    const espH = esperados_(hoje);
    const regsH = registrosDia_(hoje);
    Object.keys(espH).forEach(id => {
      const rr = regsH[id] || [], ult = rr[rr.length - 1];
      const k3 = 'semsaida:' + id;
      if (ult && ult.tipo === 'entrada' && agoraMin >= espH[id].fimMin + 30 && feitos.indexOf(k3) < 0) {
        const nome = (equipe[id] || {}).nome || id;
        const tx = '⚠️ ' + nome + ' não registrou a saída final (expediente até ' + espH[id].fimHora + ', entrada às ' + ult.hora + ').';
        evento_('alerta', id, tx, 'gestao'); novos.push(k3); paraGestor.push(tx);
      }
    });
    if (novos.length) pr.setProperty(chave, feitos.concat(novos).join(','));
    if (paraGestor.length) avisarGestor_('Gestão do Dia: ' + paraGestor.length + ' alerta(s) de tarefa', paraGestor.join('\n\n'));
  } catch (e) { Logger.log(e); }
}

function responderSuporte(pessoa, pin, dia, bloco, texto) {
  checkGestor_(pessoa, pin);
  const msg = String(texto || '').trim().slice(0, 100);
  if (msg.length < 2) throw new Error('Escreva a resposta.');
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Tarefa não encontrada.');
  const chave = dia + '__' + bloco;
  const cur = rows_('Status').find(x => x.chave === chave) || {};
  if (cur.suporte !== 'sim') throw new Error('Este pedido de suporte já foi encerrado.');
  upsert_('Status', chave, { dia: dia, bloco: bloco, suporte_resp: msg, suporte_resp_hora: agora_() });
  const nome = (rows_('Equipe').find(e => e.id === cur.suporte_por) || {}).nome || cur.suporte_por;
  evento_('resposta', cur.suporte_por, '💬 Coordenação respondeu ' + nome + ' em "' + tar.titulo + '": ' + msg, 'todos', bloco, cur.suporte_por);
  return getData(dia, pessoa, pin);
}

/* ------------------------------------------------------------------ */
/* Cadastro de colaborador (só coordenação)                            */
/* ------------------------------------------------------------------ */

function cargaSemanal_(hs) {
  let m = 0;
  hs.forEach(h => {
    if (/livre/i.test(h.inicio)) return;
    const a = hm_(h.inicio), b = hm_(h.fim);
    if (a == null || b == null || b <= a) return;
    const dias = String(h.dias || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z]+/).filter(Boolean);
    const n = dias.indexOf('todos') >= 0 ? 5 : dias.filter(d => DOW.indexOf(d) >= 0).length;
    m += (b - a) * n;
  });
  return m;
}

function equipeCadastro(pessoa, pin) {
  checkGestor_(pessoa, pin);
  const hor = rows_('Horarios');
  return rows_('Equipe').map(e => {
    const hs = hor.filter(h => h.pessoa === e.id).map(h => ({ dias: h.dias, inicio: h.inicio, fim: h.fim }));
    return { id: e.id, nome: e.nome, cor: e.cor, pin: e.pin, telefone: e.telefone || '', aparelho: !!e.aparelho,
      livre: hs.some(h => /livre/i.test(h.inicio)), horarios: hs.filter(h => !/livre/i.test(h.inicio)), cargaMin: cargaSemanal_(hs),
      gestor: GESTORES.indexOf(e.id) >= 0, fotoRef: !!e.foto_ref };
  });
}

function salvarColaborador(pessoa, pin, c) {
  checkGestor_(pessoa, pin);
  c = c || {};
  const nome = String(c.nome || '').trim();
  if (nome.length < 2) throw new Error('Escreva o nome.');
  const tel = String(c.telefone || '').trim();
  if (tel && !wa_(tel)) throw new Error('WhatsApp inválido. Use DDD + número, ex.: 82 99999-9999.');
  const hs = (c.horarios || []).map(h => ({ dias: String(h.dias || '').trim().toLowerCase(), inicio: String(h.inicio || '').trim(), fim: String(h.fim || '').trim() }))
    .filter(h => h.dias || h.inicio || h.fim);
  hs.forEach(h => {
    if (!h.dias) throw new Error('Escolha os dias de cada horário.');
    if (hm_(h.inicio) == null || hm_(h.fim) == null || hm_(h.fim) <= hm_(h.inicio)) throw new Error('Confira os horários: o fim precisa ser depois do início.');
  });
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let id = c.id, novoPin = null;
  try {
    const eq = sheet_('Equipe');
    const v = eq.getDataRange().getDisplayValues();
    const col = k => HEAD.Equipe.indexOf(k) + 1;
    if (!id) {
      const base = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '').slice(0, 12) || 'pessoa';
      const ids = v.slice(1).map(r => r[0]);
      id = base; let n = 2; while (ids.indexOf(id) >= 0) id = base + n++;
      const pins = v.slice(1).map(r => r[3]);
      do { novoPin = String(1000 + Math.floor(Math.random() * 9000)); } while (pins.indexOf(novoPin) >= 0);
      const cores = ['#0EA5E9', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#EC4899'];
      const usadas = v.slice(1).map(r => r[2]);
      const cor = cores.find(x => usadas.indexOf(x) < 0) || cores[ids.length % cores.length];
      const row = HEAD.Equipe.map(k => ({ id: id, nome: nome, cor: cor, pin: novoPin, aparelho: '', telefone: tel }[k] || ''));
      eq.getRange(eq.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    } else {
      const i = v.findIndex((r, k) => k > 0 && r[0] === id);
      if (i < 1) throw new Error('Pessoa não encontrada.');
      eq.getRange(i + 1, col('nome')).setValue(nome);
      eq.getRange(i + 1, col('telefone')).setNumberFormat('@').setValue(tel);
    }
    // horários: substitui as linhas desta pessoa
    const hsh = sheet_('Horarios');
    const hv = hsh.getDataRange().getDisplayValues().slice(1).filter(r => r.join('') !== '' && r[0] !== id);
    if (c.livre) hv.push([id, 'todos', 'livre', '', 'sem horário fixo']);
    else hs.forEach(h => hv.push([id, h.dias, hhmm_(hm_(h.inicio)), hhmm_(hm_(h.fim)), '']));
    const total = Math.max(hsh.getLastRow() - 1, 0);
    if (total) hsh.getRange(2, 1, total, HEAD.Horarios.length).setValues(Array.from({ length: total }, () => HEAD.Horarios.map(() => '')));
    if (hv.length) hsh.getRange(2, 1, hv.length, HEAD.Horarios.length).setNumberFormat('@').setValues(hv.map(r => HEAD.Horarios.map((_, j) => r[j] || '')));
  } finally { lock.releaseLock(); }
  evento_('cadastro', id, '🗂 Cadastro de ' + nome + (novoPin ? ' criado.' : ' atualizado.'), 'gestao');
  return { ok: true, id: id, pin: novoPin, lista: equipeCadastro(pessoa, pin) };
}

/* ================================================================== */
/* Fotos, avaliação, frequência, demandas e visitas                    */
/* ================================================================== */

function pasta_(prop, nome) {
  const pr = PropertiesService.getScriptProperties();
  const id = pr.getProperty(prop);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  const it = DriveApp.getFoldersByName(nome);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(nome);
  pr.setProperty(prop, f.getId());
  return f;
}
function salvarFoto_(prop, nomePasta, b64, nomeArq) {
  return pasta_(prop, nomePasta).createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', nomeArq)).getUrl();
}
function pessoasTarefa_(t) { return String(t.pessoas || '').split(',').map(x => x.trim()).filter(Boolean); }
function salvarMeuWhats(pessoa, pin, tel) {
  checkPin_(pessoa, pin);
  const t = String(tel || '').trim();
  if (!wa_(t)) throw new Error('WhatsApp inválido. Use DDD + número, ex.: 82 99999-9999.');
  const eq = sheet_('Equipe'), v = eq.getDataRange().getDisplayValues();
  const i = v.findIndex((r, k) => k > 0 && r[0] === pessoa);
  if (i < 1) throw new Error('Colaborador não encontrado.');
  eq.getRange(i + 1, HEAD.Equipe.indexOf('telefone') + 1).setNumberFormat('@').setValue(t);
  return getData('', pessoa, pin);
}
function cfg_(chave, padrao) {
  const r = rows_('Config').find(x => x.chave === chave);
  if (!r || r.valor === '') return padrao;
  try { return JSON.parse(r.valor); } catch (e) { return r.valor; }
}
function cfgSet_(chave, valor, por) {
  upsert_('Config', chave, { valor: JSON.stringify(valor), atualizado: hoje_() + ' ' + agora_(), por: por || '' });
}
function configPublica_() {
  const pl = cfg_('playlist', PODCAST_PADRAO); (pl || []).forEach(p => { if (/Guri Galamba/.test(p.t || '')) { p.t = p.t.replace('Guri', 'Guto'); p.link = String(p.link || '').replace('Guri', 'Guto'); } });
  return { insta: cfg_('insta', 'https://www.instagram.com/amigosdemaribondoal/'), post: cfg_('post', ''), postTexto: cfg_('postTexto', ''), story: cfg_('story', ''),
    playlist: pl, msgs: cfg_('msgs', MSG_PADRAO), doacao: cfg_('doacao', MSG_DOACAO), contatos: cfg_('contatos', {}),
    engTipos: ENG_TIPOS, selosEvol: SELOS_EVOL };
}
function salvarConfig(pessoa, pin, chave, valor) {
  checkGestor_(pessoa, pin);
  if (['insta', 'post', 'postTexto', 'story', 'playlist', 'msgs', 'doacao', 'contatos'].indexOf(chave) < 0) throw new Error('Configuração desconhecida.');
  cfgSet_(chave, valor, pessoa);
  return configPublica_();
}

/* ---------- podcast: busca o episódio no feed (áudio toca dentro do app) ---------- */
function podcast(pessoa, pin, idx) {
  checkPin_(pessoa, pin);
  const pl = cfg_('playlist', PODCAST_PADRAO), it = pl[Number(idx) || 0];
  if (!it) throw new Error('Podcast não encontrado.');
  if (it.audio) return { titulo: it.t, audio: it.audio, link: it.link || '' };
  if (!it.rss) return { titulo: it.t, audio: '', link: it.link || '' };
  const cache = CacheService.getScriptCache(), ck = 'pod_' + hoje_() + '_' + idx;
  const c = cache.get(ck); if (c) return JSON.parse(c);
  let out = { titulo: it.t, audio: '', link: it.link || '' };
  try {
    const xml = UrlFetchApp.fetch(it.rss, { muteHttpExceptions: true, followRedirects: true }).getContentText();
    const items = xml.split(/<item[\s>]/).slice(1).map(x => ({
      titulo: ((x.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '').trim(),
      audio: ((x.match(/<enclosure[^>]*url="([^"]+)"/) || [])[1] || '').replace(/&amp;/g, '&') })).filter(x => x.audio);
    const re = it.busca ? new RegExp(it.busca, 'i') : null;
    const achados = re ? items.filter(x => re.test(x.titulo)) : [];
    const lista = achados.length ? achados : items;
    // um episódio diferente por dia
    const n = Math.floor(Date.now() / 86400000);
    const ep = lista.length ? lista[n % Math.min(lista.length, 10)] : null;
    if (ep) out = { titulo: ep.titulo, audio: ep.audio, link: it.link || '', programa: it.t };
  } catch (e) { Logger.log(e); }
  cache.put(ck, JSON.stringify(out), 6 * 3600);
  return out;
}

/* ---------- engajamento no Instagram (a pessoa sobe o print) ---------- */
function registrarEngajamento(pessoa, pin, tipo, fotoB64, post) {
  checkPin_(pessoa, pin);
  const def = ENG_TIPOS[tipo]; if (!def) throw new Error('Escolha: curtida + comentário, repost ou status.');
  if (!fotoB64 || String(fotoB64).length < 2000) throw new Error('Só vale com foto: suba o print do engajamento.');
  const f = pasta_('ENG_FOLDER', 'Engajamento — prints (ONG Amigos de Maribondo)').createFile(Utilities.newBlob(Utilities.base64Decode(fotoB64), 'image/jpeg', hoje_() + '_' + pessoa + '_' + tipo + '.jpg'));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  const url = f.getUrl(), thumb = 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w600';
  const sh = sheet_('Engajamento');
  sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Engajamento.length).setNumberFormat('@')
    .setValues([['g' + Date.now().toString(36), hoje_(), agora_(), pessoa, tipo, String(def.p), url, String(post || cfg_('post', '')).slice(0, 300), 'ok', hoje_() + ' ' + agora_(), thumb]]);
  evento_('engajamento_pub', pessoa, '📣 ' + nomeDe_(pessoa) + ' engajou: ' + def.t + ' ✅', 'todos');
  evento_('engajamento', pessoa, '📣 ' + nomeDe_(pessoa) + ' registrou engajamento: ' + def.t + ' (+' + def.p + ' pts).', 'gestao');
  return { ok: true, pts: def.p, lista: engajamentoDe_(pessoa) };
}
/* lista pública da semana: só registros válidos e com foto */
function engajamentoPublico_() {
  const w = semanaDe_(hoje_());
  return rows_('Engajamento').filter(x => x.dia >= w.de && x.dia <= w.ate && x.estado !== 'invalido' && (x.thumb || x.print))
    .sort((a, b) => (b.dia + b.hora).localeCompare(a.dia + a.hora)).slice(0, 60)
    .map(x => ({ id: x.id, dia: x.dia, hora: x.hora, pessoa: x.pessoa, tipo: (ENG_TIPOS[x.tipo] || { t: x.tipo }).t,
      foto: x.thumb || ((String(x.print).match(/[-\w]{25,}/) || [])[0] ? 'https://drive.google.com/thumbnail?id=' + String(x.print).match(/[-\w]{25,}/)[0] + '&sz=w600' : '') }));
}
function engajamentoDe_(pessoa) {
  const w = semanaDe_(hoje_());
  return rows_('Engajamento').filter(x => (!pessoa || x.pessoa === pessoa) && x.dia >= w.de && x.dia <= w.ate)
    .map(x => ({ id: x.id, dia: x.dia, hora: x.hora, pessoa: x.pessoa, tipo: x.tipo, pontos: Number(x.pontos) || 0, print: x.print, estado: x.estado }));
}
function invalidarEngajamento(pessoa, pin, id) {
  checkGestor_(pessoa, pin);
  upsert_('Engajamento', id, { estado: 'invalido' });
  return pontuacao(pessoa, pin, '');
}

/* ---------- galeria (3 fotos por semana) ---------- */
function galeria_() { return rows_('Galeria').filter(x => x.url).map(x => ({ id: x.id, url: x.url, legenda: x.legenda })); }
function addGaleria(pessoa, pin, fotoB64, legenda) {
  checkGestor_(pessoa, pin);
  if (!fotoB64) throw new Error('Escolha a foto.');
  const f = pasta_('GAL_FOLDER', 'Galeria do app (ONG Amigos de Maribondo)').createFile(Utilities.newBlob(Utilities.base64Decode(fotoB64), 'image/jpeg', 'galeria_' + Date.now() + '.jpg'));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  const url = 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w1200';
  const sh = sheet_('Galeria');
  sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Galeria.length).setNumberFormat('@').setValues([['f' + Date.now().toString(36), url, limpa_(legenda, 80), hoje_(), pessoa]]);
  return galeria_();
}
function delGaleria(pessoa, pin, id) {
  checkGestor_(pessoa, pin);
  const sh = sheet_('Galeria'), v = sh.getDataRange().getDisplayValues();
  for (let i = v.length - 1; i >= 1; i--) if (v[i][0] === id) sh.deleteRow(i + 1);
  return galeria_();
}

/* ---------- folha de pagamento interna + selo semanal de evolução (só o dono) ---------- */
function checkDono_(pessoa, pin) { checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só a coordenação geral acessa a folha.'); }
function folha(pessoa, pin) {
  checkDono_(pessoa, pin);
  const mes = hoje_().slice(0, 7), w = semanaDe_(hoje_());
  const equipe = rows_('Equipe').filter(e => e.id && PRIVADOS.indexOf(e.id) < 0).map(e => ({ id: e.id, nome: e.nome }));
  const fol = {}; rows_('Folha').forEach(x => fol[x.pessoa] = { funcao: x.funcao, valor: x.valor, data: x.data_pagamento, adicoes: x.adicoes, obs: x.obs, atualizado: x.atualizado });
  const selos = rows_('SelosSemana').filter(x => x.criado.slice(0, 7) === mes);
  const porPessoa = {};
  selos.forEach(x => { const p = porPessoa[x.pessoa] = porPessoa[x.pessoa] || { mes: { ritmo: 0, evoluir: 0, conversar: 0, urgente: 0 }, semana: '' };
    p.mes[x.selo] = (p.mes[x.selo] || 0) + 1; if (x.semana === w.de) p.semana = x.selo; });
  return { semana: w.de, equipe: equipe, folha: fol, selos: porPessoa, tipos: SELOS_EVOL };
}
function salvarFolha(pessoa, pin, alvo, dados) {
  checkDono_(pessoa, pin);
  if (!rows_('Equipe').some(e => e.id === alvo)) throw new Error('Colaborador não encontrado.');
  const d = dados || {};
  upsert_('Folha', alvo, { pessoa: alvo, funcao: limpa_(d.funcao, 60), valor: limpa_(d.valor, 20), data_pagamento: limpa_(d.data, 20), adicoes: limpa_(d.adicoes, 200), obs: limpa_(d.obs, 200), atualizado: hoje_() + ' ' + agora_() });
  return folha(pessoa, pin);
}
function salvarSeloSemana(pessoa, pin, alvo, selo) {
  checkDono_(pessoa, pin);
  if (!SELOS_EVOL[selo]) throw new Error('Selo desconhecido.');
  const w = semanaDe_(hoje_()), id = w.de + '_' + alvo;
  upsert_('SelosSemana', id, { semana: w.de, pessoa: alvo, selo: selo, por: pessoa, criado: hoje_() + ' ' + agora_() });
  const r = folha(pessoa, pin), m = (r.selos[alvo] || {}).mes || {};
  const motivo = m.urgente >= 2 ? m.urgente + ' selos "Resolver urgente conduta"' : m.conversar >= 3 ? m.conversar + ' selos "Conversar pessoalmente"' : m.evoluir >= 4 ? m.evoluir + ' selos "Precisa evoluir"' : '';
  if (motivo) {
    const tx = '📅 Marcar reunião com ' + nomeDe_(alvo) + ': ' + motivo + ' neste mês.';
    evento_('reuniao', alvo, tx, 'gestao');
    avisarGestor_('Reunião necessária: ' + nomeDe_(alvo), tx);
    r.alerta = tx;
  }
  return r;
}

/* ---------- como foi o dia anterior (para a narração da abertura) ---------- */
function ontem_(id) {
  if (!id || PTS.EXCLUIR.indexOf(id) >= 0) return '';
  const hoje = hoje_(), ck = 'ontem_' + id + '_' + hoje, cache = CacheService.getScriptCache();
  const c = cache.get(ck); if (c != null) return c;
  let r = '';
  try {
    // último dia de trabalho antes de hoje (até 4 dias atrás)
    for (let k = 1; k <= 4 && !r; k++) {
      const d = isoAdd_(hoje, -k); if (d < INICIO_GERAL) break;
      const P = calcularPontos_(d, d)[id]; if (!P || !P.max) continue;
      const n = P.neg; r = (n.advertencias || n.naoFeitasComPrazo || n.atrasos || n.faltas || n.indiretas) ? 'melhorar' : 'bom';
    }
  } catch (e) { Logger.log(e); }
  cache.put(ck, r, 6 * 3600);
  return r;
}

/* ---------- recomeço: tudo vale a partir de terça 10/11 (roda uma vez sozinho) ---------- */
function recomeco_() {
  const pr = PropertiesService.getScriptProperties();
  if (pr.getProperty('RECOMECO_V25')) return;
  const lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) return;
  try {
    if (pr.getProperty('RECOMECO_V25')) return;
    const ss = ss_();
    // 1) agenda: só segunda 09/11 e terça 10/11 continuam; o resto vai para a aba Arquivo_Tarefas
    const tar = sheet_('Tarefas'), v = tar.getDataRange().getDisplayValues();
    const manter = ['2026-11-09', '2026-11-10'], mover = [];
    for (let i = v.length - 1; i >= 1; i--) if (v[i][0] && manter.indexOf(v[i][0]) < 0) { mover.unshift(v[i]); tar.deleteRow(i + 1); }
    if (mover.length) {
      let arq = ss.getSheetByName('Arquivo_Tarefas');
      if (!arq) { arq = ss.insertSheet('Arquivo_Tarefas'); arq.getRange(1, 1, 1, HEAD.Tarefas.length).setValues([HEAD.Tarefas]).setFontWeight('bold'); }
      arq.getRange(arq.getLastRow() + 1, 1, mover.length, mover[0].length).setNumberFormat('@').setValues(mover);
    }
    // 2) usuário de teste
    const eq = sheet_('Equipe'), ev = eq.getDataRange().getDisplayValues();
    if (!ev.some((r, k) => k > 0 && r[0] === 'teste')) {
      const row = HEAD.Equipe.map(k => ({ id: 'teste', nome: 'Teste App', cor: '#64748B', pin: '2580', aparelho: '', telefone: '' }[k] || ''));
      eq.getRange(eq.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    }
    // 3) atividades esporádicas do teste na terça
    const t2 = sheet_('Tarefas'), tv = t2.getDataRange().getDisplayValues();
    const novas = [['2026-11-10', 'teste1', '10:00', '901', 'manha', '🧪 Atividade de teste 1', 'teste', 'Abrir o app|Iniciar e concluir', '', '', '11:00'],
                   ['2026-11-10', 'teste2', '15:00', '902', 'tarde', '🧪 Atividade de teste 2', 'teste', 'Testar suporte e prazo', '', '', '16:00']];
    novas.forEach(n => { if (!tv.some(r => r[0] === n[0] && r[1] === n[1])) t2.getRange(t2.getLastRow() + 1, 1, 1, HEAD.Tarefas.length).setNumberFormat('@').setValues([HEAD.Tarefas.map((k, i) => n[i] || '')]); });
    // 4) pendências zeradas: alertas antigos já enviados não voltam
    pr.getKeys().filter(k => /^(pend_|alertados_)/.test(k) && k.indexOf(hoje_()) < 0).forEach(k => pr.deleteProperty(k));
    pr.setProperty('RECOMECO_V25', hoje_() + ' ' + agora_());
    garantirAutomacoes_();
  } finally { lock.releaseLock(); }
}

/* ================== Narrações com voz natural (Speko · voz Pedro) ================== */
// chave do Speko fica nas Propriedades do Script (Configurações do projeto → Propriedades do script → SPEKO_KEY), nunca no código
function spekoKey_() { return PropertiesService.getScriptProperties().getProperty('SPEKO_KEY') || ''; }
const SPEKO_URL = 'https://router.speko.dev/v1/tts/speech';   // endpoint oficial de voz do Speko (o antigo devolvia a página do site)
const VOZ_TAXA = 24000, VOZ_VERSAO = 32;
const VOZ_ID = 'ulzsiMeCbfKyTPCNhCD5';   // Pedro (brasileiro, ElevenLabs v3: voz masculina natural, alegre)
const VOZ_MODELO = 'eleven_v3';
// [warmly], [excited], [laughs]... são marcações de interpretação: a voz não fala, só muda o tom conforme a mensagem.
// a0..a4 = alertas por período: manhã, perto do almoço, tarde, fim do dia, noite.
const NARRA = {
  m: ['[warmly] E aí, bom dia! Ó... ontem não saiu do jeito que a gente queria, né? Faz parte. [encouraging] Hoje você pode mais. Bora fazer o seu melhor!',
      '[warmly] Bom dia! Ontem ficou pra trás, viu? Ninguém acerta tudo sempre. [encouraging] Hoje é dia de mostrar do que você é capaz!',
      '[calm] Ei... respira. Ontem teve tropeço, mas recomeçar também é vitória. [excited] Hoje é virada de jogo, bora!',
      '[warmly] Bom dia! A gente sabe que você pode mais, e confia em você. [encouraging] Hoje é com tudo, viu?',
      '[warmly] Ó, novo dia, nova chance. O que passou, passou. [excited] Bora fazer o melhor de hoje!'],
  b: ['[excited] E aí, bom dia! Ó... ontem foi massa demais, viu? [laughs] Hoje é pra fazer melhor ainda. Bora pra cima!',
      '[excited] Eita! Ontem você bateu a meta, hein? Que orgulho! [laughs] Hoje é repetir a dose. Bora!',
      '[laughs] Olha, ontem foi show de bola! [excited] Segura esse ritmo, que hoje vai ser melhor ainda!',
      '[excited] Ó o ritmo! Ontem foi meta batida... hoje a gente vai mais longe ainda. Pra cima!',
      '[excited] É isso aí! Ontem foi demais, viu? Bora fazer história de novo hoje!'],
  g: ['[cheerful] Bom dia! Reescrevendo histórias... hoje é um novo começo. Bora fazer o nosso melhor!',
      '[excited] Bom dia, equipe Amigos de Maribondo! Reescrevendo histórias, um novo começo. Pra cima!',
      '[warmly] Ó, cada dia é um novo começo, viu? [excited] Bora reescrever histórias juntos!'],
  a: ['[cheerful] Ó, manhã rendendo, hein? Mais um bloco bem feito. Continua firme!',
      '[cheerful] Já tá chegando a hora do almoço! Confere aí: as atividades da manhã tão concluídas? Bora!',
      '[excited] Boa tarde! Energia de volta? Cada atividade concluída reescreve uma história. Pra cima!',
      '[excited] Reta final! Falta pouco pra fechar o dia com chave de ouro. Bora concluir tudo!',
      '[warmly] Ei, só passando pra lembrar: você tá fazendo diferença aqui. Bora seguir!'],
  l: ['[cheerful] E aí, {n}! A gente confia demais no teu trabalho, viu? Arrasa hoje!',
      '[excited] Opa, {n}! Bora começar? [laughs] Pra cima!']
};
const semTags_ = t => String(t || '').replace(/\[[^\]]*\]\s*/g, '').trim();
function primeiroNome_(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
function narraTextos_() {
  const t = {};
  ['m', 'b', 'g', 'a'].forEach(g => NARRA[g].forEach((x, i) => t[g + i] = x));
  NARRA.l.forEach((x, i) => {
    t['l' + i + '_'] = x.replace(/, \{n\}!/, '!');
    rows_('Equipe').filter(e => e.id && e.nome).forEach(e => t['l' + i + '_' + e.id] = x.replace('{n}', primeiroNome_(e.nome)));
  });
  return t;
}
function sintetiza_(texto) {
  const body = JSON.stringify({ input: texto, audio: { encoding: 'pcm_s16le', sample_rate_hz: VOZ_TAXA, channels: 1 },
    routing: { mode: 'explicit', provider: 'elevenlabs', model: VOZ_MODELO }, voice: VOZ_ID, language: 'pt-BR' });
  const r = UrlFetchApp.fetch(SPEKO_URL, { method: 'post', contentType: 'application/json', payload: body, muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + spekoKey_(), 'Idempotency-Key': Utilities.getUuid() } });
  const code = r.getResponseCode(), hd = r.getHeaders(), tipo = String(hd['Content-Type'] || hd['content-type'] || '');
  if (code >= 300) throw new Error('Speko ' + code + ': ' + r.getContentText().slice(0, 300));
  if (/json|html|text/i.test(tipo)) throw new Error('A resposta não é áudio (' + tipo + '): ' + r.getContentText().slice(0, 200));
  return Utilities.newBlob(r.getBlob().getBytes(), 'audio/pcm_s16le;rate=' + VOZ_TAXA, 'voz');
}
/* Gera (uma vez) as narrações que faltam e guarda no Drive. Rode "gerarNarracoes" no editor; depois roda sozinha todo dia às 6h para pessoas novas. */
function gerarNarracoes() {
  const ini = Date.now(), textos = narraTextos_(), vozes = cfg_('vozes', {}) || {};
  const pasta = pasta_('VOZ_FOLDER', 'Narrações do app (ONG Amigos de Maribondo)');
  let feitas = 0, erros = [];
  Object.keys(textos).forEach(k => {
    if (Date.now() - ini > 5 * 60 * 1000) return;
    if (vozes[k] && vozes[k].t === textos[k] && vozes[k].v === VOZ_VERSAO) return;
    try {
      const blob = sintetiza_(textos[k]); const w = wavDe_(blob.getBytes(), blob.getContentType());
      if (!w) throw new Error('áudio inválido');
      const f = pasta.createFile(Utilities.newBlob(w.bytes, w.mime, k + (/mpeg/.test(w.mime) ? '.mp3' : '.wav')));
      vozes[k] = { id: f.getId(), t: textos[k], mime: w.mime, v: VOZ_VERSAO }; feitas++;
    } catch (e) { erros.push(k + ': ' + e.message); }
  });
  cfgSet_('vozes', vozes, 'sistema');
  Logger.log('Narrações novas: ' + feitas + ' · total: ' + Object.keys(vozes).length + (erros.length ? '\nErros:\n' + erros.slice(0, 5).join('\n') : ''));
  return { feitas: feitas, total: Object.keys(vozes).length, erros: erros.slice(0, 5) };
}
/* A API devolve áudio cru (PCM 16 bits). O iPhone só toca se tiver cabeçalho WAV: este trecho põe o cabeçalho. */
/* Reconhece o formato que a API mandou e transforma num WAV que todo celular toca, sem chiado. */
function wavDe_(bytes, mime) { return normalizaAudio_(bytes, mime).w; }  // null quando não é áudio
function normalizaAudio_(b, mime, prof) {
  prof = prof || 0;
  const u = i => b[i] & 255, n = b.length;
  let head = ''; for (let i = 0; i < Math.min(80, n); i++) head += String.fromCharCode(u(i));
  if (/^\s*</.test(head)) return { w: null, fmt: 'html (não é áudio)' };
  if (head.slice(0, 4) === 'RIFF') return { w: { bytes: b, mime: 'audio/wav' }, fmt: 'wav' };
  if (head.slice(0, 3) === 'ID3' || (u(0) === 255 && (u(1) & 224) === 224)) return { w: { bytes: b, mime: 'audio/mpeg' }, fmt: 'mp3' };
  if (head.slice(0, 4) === 'OggS') return { w: { bytes: b, mime: 'audio/ogg' }, fmt: 'ogg' };
  if (prof < 2 && /^\s*\{/.test(head)) {            // veio JSON
    try { const j = JSON.parse(Utilities.newBlob(b).getDataAsString());
      const acha = o => { if (!o || typeof o !== 'object') return null; for (const k in o) { const v = o[k]; if (typeof v === 'string' && v.length > 200 && /^[A-Za-z0-9+/=]+$/.test(v.slice(0, 200))) return v; const w = acha(v); if (w) return w; } return null; };
      const v = acha(j); if (v) return normalizaAudio_(Utilities.base64Decode(v), mime, prof + 1);
    } catch (e) { }
  }
  if (prof < 2 && /^"?[A-Za-z0-9+/]{60,}/.test(head)) { // veio o áudio escrito em texto (base64)
    try { const t = Utilities.newBlob(b).getDataAsString().replace(/[\s"]/g, ''); return normalizaAudio_(Utilities.base64Decode(t), mime, prof + 1); } catch (e) { }
  }
  // áudio cru: testa os formatos possíveis e fica com o que soa como voz (mais "liso")
  const rateTipo = Number((String(mime || '').match(/rate=(\d+)/) || [])[1]) || 0;
  const MU = x => { x = ~x & 255; const s = x & 128, e = (x >> 4) & 7, m = x & 15; let v = ((m << 3) + 132) << e; v -= 132; return s ? -v : v; };
  const cand = {
    s16le: { n: Math.floor(n / 2), get: i => { const v = u(2 * i) | (u(2 * i + 1) << 8); return v > 32767 ? v - 65536 : v; } },
    s16be: { n: Math.floor(n / 2), get: i => { const v = (u(2 * i) << 8) | u(2 * i + 1); return v > 32767 ? v - 65536 : v; } },
    f32le: { n: Math.floor(n / 4), get: i => { const x = (u(4 * i)) | (u(4 * i + 1) << 8) | (u(4 * i + 2) << 16) | (u(4 * i + 3) << 24); const sg = x >>> 31 ? -1 : 1, ex = (x >>> 23) & 255, fr = x & 0x7fffff; if (ex === 255) return 0; const f = ex === 0 ? sg * fr * Math.pow(2, -149) : sg * (1 + fr / 8388608) * Math.pow(2, ex - 127); return Math.max(-32768, Math.min(32767, Math.round(f * 32767))); } },
    mulaw: { n: n, get: i => MU(u(i)) },
    u8: { n: n, get: i => (u(i) - 128) << 8 }
  };
  let best = 's16le', melhor = 1e9;
  if (/pcm_s16le|L16/i.test(String(mime || ''))) melhor = 0; else Object.keys(cand).forEach(k => { const c = cand[k], N = Math.min(c.n, 24000), ini = Math.min(Math.floor(c.n / 4), 4000); let d = 0, a = 0, p = c.get(ini);
    for (let i = ini + 1; i < ini + N && i < c.n; i++) { const x = c.get(i); d += Math.abs(x - p); a += Math.abs(x); p = x; }
    const sc = a > 1000 ? d / a : 9; if (sc < melhor) { melhor = sc; best = k; } });
  const c = cand[best], rate = rateTipo || (best === 'mulaw' ? 8000 : 24000), pcm = [];
  for (let i = 0; i < c.n; i++) { const v = c.get(i) & 65535; pcm.push(v & 255, v >> 8); }
  const h = [], s4 = t => { for (let i = 0; i < 4; i++) h.push(t.charCodeAt(i)); }, u32 = v => h.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255), u16 = v => h.push(v & 255, (v >> 8) & 255);
  s4('RIFF'); u32(36 + pcm.length); s4('WAVE'); s4('fmt '); u32(16); u16(1); u16(1); u32(rate); u32(rate * 2); u16(2); u16(16); s4('data'); u32(pcm.length);
  return { w: { bytes: h.concat(pcm).map(x => x > 127 ? x - 256 : x), mime: 'audio/wav' }, fmt: best + '@' + rate + ' (liso ' + melhor.toFixed(2) + ')' };
}
/* Rode no editor se a voz ainda chiar: mostra no registro o formato que chegou. */
function diagnosticoVoz() {
  try { const bl = sintetiza_('[excited] Teste de voz! Bora!'); const by = bl.getBytes(), na = normalizaAudio_(by, bl.getContentType());
    Logger.log('Speko OK · ' + by.length + ' bytes · lido como: ' + na.fmt + ' · ' + (by.length / 2 / VOZ_TAXA).toFixed(1) + ' s de voz');
  } catch (e) { Logger.log('Speko ERRO: ' + e.message); }
  const vozes = cfg_('vozes', {}) || {}, ks = Object.keys(vozes);
  Logger.log('Narrações gravadas na versão nova: ' + ks.filter(k => vozes[k].v === VOZ_VERSAO).length + ' de ' + ks.length);
}
function vozB64_(k) {
  const vozes = cfg_('vozes', {}) || {}, v = vozes[k];
  if (!v || !v.id || v.v !== VOZ_VERSAO) return null;
  const c = CacheService.getScriptCache(), ck = 'voz3_' + v.id, n = Number(c.get(ck + '_n') || 0);
  if (n) { const parts = c.getAll(Array.from({ length: n }, (x, i) => ck + '_' + i)); const all = Array.from({ length: n }, (x, i) => parts[ck + '_' + i]);
    if (all.every(Boolean)) return { k: k, b64: all.join(''), mime: c.get(ck + '_m') || 'audio/wav', fmt: c.get(ck + '_f') || '', versao: 31 }; }
  const na = normalizaAudio_(DriveApp.getFileById(v.id).getBlob().getBytes(), v.mime), w = na.w;
  if (!w) return null;
  const b64 = Utilities.base64Encode(w.bytes), obj = {}; const TAM = 90000, qtd = Math.ceil(b64.length / TAM);
  for (let i = 0; i < qtd; i++) obj[ck + '_' + i] = b64.slice(i * TAM, (i + 1) * TAM);
  obj[ck + '_n'] = String(qtd); obj[ck + '_m'] = w.mime; obj[ck + '_f'] = na.fmt;
  try { c.putAll(obj, 6 * 3600); } catch (e) { Logger.log(e); }
  return { k: k, b64: b64, mime: w.mime, fmt: na.fmt, versao: 31 };
}
function diaIdx_() { return Math.floor((Date.now() - 3 * 3600000) / 86400000); }
/* As duas narrações do dia da pessoa: a da abertura (pelo resultado de ontem) e a do login. */
function vozesHoje(pessoa, pin) {
  checkPin_(pessoa, pin);
  const o = ontem_(pessoa), g = o === 'bom' ? 'b' : o === 'melhorar' ? 'm' : 'g', n = diaIdx_();
  const dia = g + (n % NARRA[g].length), login = 'l' + (n % 2) + '_' + pessoa;
  let lg = null; try { lg = vozB64_(login) || vozB64_('l' + (n % 2) + '_'); } catch (e) { Logger.log(e); }
  let dg = null; try { dg = vozB64_(dia); } catch (e) { Logger.log(e); }
  return { dia: hoje_(), abertura: dg, login: lg, textoAbertura: semTags_(NARRA[g][n % NARRA[g].length]) };
}
function voz(pessoa, pin, k) { checkPin_(pessoa, pin); if (!/^[a-z]\d$/.test(String(k))) throw new Error('Narração desconhecida.'); return vozB64_(k); }

function nomeDe_(id) { return (rows_('Equipe').find(e => e.id === id) || {}).nome || id; }

/* ---------- avaliação da coordenação ---------- */
function avaliarTarefa(pessoa, pin, dia, bloco, nota, obs) {
  checkGestor_(pessoa, pin);
  if (['aprovada', 'aprimorar', 'refazer'].indexOf(nota) < 0) throw new Error('Escolha: aprovada, aprimorar ou refazer.');
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Tarefa não encontrada.');
  const chave = dia + '__' + bloco;
  const cur = rows_('Status').find(x => x.chave === chave) || {};
  if (cur.estado !== 'concluida') throw new Error('Só dá para avaliar tarefa concluída.');
  const texto = String(obs || '').trim().slice(0, 60);
  const o = { dia, bloco, avaliacao: nota, avaliacao_obs: texto, avaliacao_hora: agora_() };
  const pes = pessoasTarefa_(tar);
  if (nota === 'refazer') {
    o.estado = 'andamento'; o.fim = '';
    const agoraDT = hoje_() + ' ' + agora_();
    o.prazo_ext = proximoTurno_(pes[0], agoraDT);
  }
  upsert_('Status', chave, o);
  const lbl = { aprovada: '⭐ Aprovada', aprimorar: '🛠 Aprimorar', refazer: '🔁 Refazer' }[nota];
  evento_('avaliacao', pes.join(','), lbl + ': "' + tar.titulo + '"' + (texto ? ' · ' + texto : '')
    + (nota === 'refazer' ? ' · novo prazo até ' + fmtDT_(o.prazo_ext, hoje_()) : ''), 'todos', bloco, pes.length === 1 ? pes[0] : '');
  return getData(dia, pessoa, pin);
}

/* ---------- frequência das atividades em grupo ---------- */
function enviarFrequencia(pessoa, pin, dia, bloco, fotoB64) {
  const quem = checkPin_(pessoa, pin);
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Atividade não encontrada.');
  if (!/^(sim|s|true|x|1)$/i.test(String(tar.atividade).trim())) throw new Error('Esta tarefa não é atividade em grupo.');
  if (pessoasTarefa_(tar).indexOf(pessoa) < 0 && GESTORES.indexOf(pessoa) < 0) throw new Error('Só quem está nesta atividade pode enviar a frequência.');
  if (!fotoB64) throw new Error('Tire a foto da lista de frequência.');
  const hora = agora_();
  const url = salvarFoto_('PASTA_FREQ', 'Frequência (ONG Amigos de Maribondo)', fotoB64,
    dia + ' ' + tar.titulo.replace(/[\\/:*?"<>|]/g, '') + ' (frequência, enviada ' + hora.replace(':', 'h') + ' por ' + quem.nome + ').jpg');
  upsert_('Status', dia + '__' + bloco, { dia, bloco, freq_url: url, freq_hora: hora, freq_por: pessoa, lista: 'sim' });
  const limite = mins_(fimTarefa_(tar)) + FREQ_PRAZO_MIN;
  const atrasada = dia < hoje_() || mins_(hora) > limite;
  evento_('frequencia', pessoa, '📋 ' + quem.nome + ' enviou a frequência de "' + tar.titulo + '" às ' + hora
    + (atrasada ? ' (fora do prazo de ' + hhmm_(limite) + ')' : '') + '.', 'todos', bloco);
  return getData(dia, pessoa, pin);
}

/* ---------- demandas da equipe ---------- */
/* situação de uma demanda: aberta (dentro das 5h) · nao_respondida (passou das 5h) · concluida · ideia */
function situacaoDemanda_(d, agoraMs) {
  const ms = Number(d.ms) || 0, limite = ms + DEMANDA_PRAZO_H * 3600000;
  if (d.item === 'ideia') return { sit: 'ideia', limite: limite };
  if (d.estado === 'atendida') {
    const am = Number(d.atendida_ms) || 0;
    return { sit: 'concluida', limite: limite, noPrazo: !am || am <= limite };
  }
  return { sit: agoraMs > limite ? 'nao_respondida' : 'aberta', limite: limite };
}
function demandasLista_() {
  const lim = isoAdd_(hoje_(), -14), agoraMs = Date.now();
  return rows_('Demandas').filter(d => d.dia >= INICIO_GERAL && (d.dia >= lim || (d.estado !== 'atendida' && d.estado !== 'validada')))
    .map(d => { const st = situacaoDemanda_(d, agoraMs);
      return { id: d.id, dia: d.dia, hora: d.hora, ms: Number(d.ms) || 0, pessoa: d.pessoa, item: d.item, detalhe: d.detalhe, estado: d.estado,
        atendidaPor: d.atendida_por, atendidaHora: d.atendida_hora, resposta: d.resposta || '', sit: st.sit, limite: st.limite, noPrazo: st.noPrazo !== false,
        limiteHora: Utilities.formatDate(new Date(st.limite), TZ, 'dd/MM HH:mm') }; })
    .sort((a, b) => b.ms - a.ms);
}
function resumoDemandas_(de, ate) {
  const agoraMs = Date.now(), r = { total: 0, noPrazo: 0, foraPrazo: 0, naoRespondidas: 0, abertas: 0, prazoH: DEMANDA_PRAZO_H };
  rows_('Demandas').filter(d => d.dia >= de && d.dia >= INICIO_GERAL && d.dia <= ate && d.item !== 'ideia').forEach(d => {
    const st = situacaoDemanda_(d, agoraMs); r.total++;
    if (st.sit === 'concluida') { if (st.noPrazo) r.noPrazo++; else r.foraPrazo++; }
    else if (st.sit === 'nao_respondida') r.naoRespondidas++; else r.abertas++;
  });
  r.pct = r.total ? Math.round(100 * r.noPrazo / r.total) : 0;
  return r;
}
function criarDemanda(pessoa, pin, item, detalhe) {
  const quem = checkPin_(pessoa, pin);
  const def = DEMANDAS.find(x => x.k === item);
  if (!def) throw new Error('Demanda desconhecida.');
  let det = String(detalhe || '').trim();
  if (def.max) {
    det = det.slice(0, def.max);
    if (det.length < 2) throw new Error('Escreva o que precisa (até ' + def.max + ' caracteres).');
  } else det = '';
  const aberta = rows_('Demandas').find(d => d.item === item && d.estado !== 'atendida' && (!def.max || d.detalhe === det));
  if (aberta) throw new Error('Já existe este pedido aberto (' + nomeDe_(aberta.pessoa) + ', ' + aberta.dia.slice(8) + '/' + aberta.dia.slice(5, 7) + ' ' + aberta.hora + ').');
  const id = 'd' + Date.now().toString(36);
  const sh = sheet_('Demandas');
  sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Demandas.length).setNumberFormat('@')
    .setValues([[id, hoje_(), agora_(), String(Date.now()), pessoa, item, det, 'aberta', '', '', '']]);
  const tx = '📦 ' + quem.nome + ' solicitou: ' + def.t + (det ? ' — ' + det : '');
  evento_('demanda', pessoa, tx, 'todos');
  avisarGestor_('Demanda: ' + def.t + (det ? ' — ' + det : '') + ' (' + quem.nome + ')', tx);
  return getData('', pessoa, pin);
}
function atenderDemanda(pessoa, pin, id, resposta) {
  checkGestor_(pessoa, pin);
  const sh = sheet_('Demandas');
  const v = sh.getDataRange().getDisplayValues();
  const i = v.findIndex((r, k) => k > 0 && r[0] === id);
  if (i < 1) throw new Error('Demanda não encontrada.');
  const col = k => HEAD.Demandas.indexOf(k) + 1;
  sh.getRange(i + 1, col('estado')).setValue('atendida');
  sh.getRange(i + 1, col('atendida_por')).setValue(pessoa);
  sh.getRange(i + 1, col('atendida_hora')).setNumberFormat('@').setValue(agora_());
  sh.getRange(i + 1, col('atendida_ms')).setNumberFormat('@').setValue(String(Date.now()));
  const resp = limpa_(resposta, 400);
  if (resp) sh.getRange(i + 1, col('resposta')).setNumberFormat('@').setValue(resp);
  const def = DEMANDAS.find(x => x.k === v[i][5]) || { t: v[i][5] };
  // aviso só para quem pediu, com a resposta da coordenação
  evento_('demanda', v[i][4], '✅ Sua demanda foi atendida: ' + def.t + (v[i][6] ? ' — ' + v[i][6] : '') + (resp ? '. Resposta da coordenação: "' + resp + '"' : '.'), 'pessoa', '', v[i][4]);
  evento_('demanda', v[i][4], '✅ Demanda concluída: ' + def.t + (v[i][6] ? ' — ' + v[i][6] : '') + ' (pedido de ' + nomeDe_(v[i][4]) + ').', 'todos', '', v[i][4]);
  return getData('', pessoa, pin);
}

/* ---------- visitas ---------- */
function visitasLista_() {
  const lim = isoAdd_(hoje_(), -7);
  return rows_('Visitas').filter(v => v.data >= lim || v.estado !== 'realizada')
    .map(v => ({ id: v.id, regiao: v.regiao, nome: v.nome, telefone: v.telefone, wa: wa_(v.telefone), data: v.data,
      responsaveis: String(v.responsaveis || '').split(',').filter(Boolean), estado: v.estado || 'agendada', realizadaHora: v.realizada_hora, criadaPor: v.criada_por }))
    .sort((a, b) => a.data.localeCompare(b.data));
}
function salvarVisita(pessoa, pin, v) {
  const quem = checkPin_(pessoa, pin);
  v = v || {};
  const regiao = String(v.regiao || '').trim().slice(0, 40), nome = String(v.nome || '').trim().slice(0, 60);
  const tel = String(v.telefone || '').trim().slice(0, 20), data = String(v.data || '').trim();
  const resp = (v.responsaveis || []).map(String).filter(Boolean);
  if (!regiao) throw new Error('Informe a região.');
  if (nome.length < 2) throw new Error('Informe o nome de quem será visitado.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('Escolha a data da visita.');
  if (!resp.length) throw new Error('Escolha quem vai fazer a visita.');
  const id = 'v' + Date.now().toString(36);
  const sh = sheet_('Visitas');
  sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Visitas.length).setNumberFormat('@')
    .setValues([[id, hoje_() + ' ' + agora_(), pessoa, regiao, nome, tel, data, resp.join(','), 'agendada', '', '']]);
  evento_('visita', resp.join(','), '🏠 Visita agendada: ' + nome + ' (' + regiao + ') em ' + data.slice(8) + '/' + data.slice(5, 7) + ' · ' + resp.map(nomeDe_).join(', ') + '.', 'todos');
  return getData('', pessoa, pin);
}
function marcarVisita(pessoa, pin, id) {
  const quem = checkPin_(pessoa, pin);
  const sh = sheet_('Visitas');
  const v = sh.getDataRange().getDisplayValues();
  const i = v.findIndex((r, k) => k > 0 && r[0] === id);
  if (i < 1) throw new Error('Visita não encontrada.');
  const resp = String(v[i][7] || '').split(',');
  if (resp.indexOf(pessoa) < 0 && GESTORES.indexOf(pessoa) < 0) throw new Error('Só os responsáveis pela visita podem marcar.');
  const col = k => HEAD.Visitas.indexOf(k) + 1;
  sh.getRange(i + 1, col('estado')).setValue('realizada');
  sh.getRange(i + 1, col('realizada_hora')).setNumberFormat('@').setValue(hoje_() + ' ' + agora_());
  sh.getRange(i + 1, col('realizada_por')).setValue(pessoa);
  evento_('visita', pessoa, '✅ ' + quem.nome + ' realizou a visita a ' + v[i][4] + ' (' + v[i][3] + ').', 'todos');
  return getData('', pessoa, pin);
}
function excluirVisita(pessoa, pin, id) {
  checkGestor_(pessoa, pin);
  const sh = sheet_('Visitas');
  const v = sh.getDataRange().getDisplayValues();
  const i = v.findIndex((r, k) => k > 0 && r[0] === id);
  if (i < 1) throw new Error('Visita não encontrada.');
  sh.deleteRow(i + 1);
  return getData('', pessoa, pin);
}

/* Coordenação ajusta horário (início/fim) e responsáveis de uma tarefa já criada. */
function editarTarefa(pessoa, pin, dia, id, t) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode editar atividades.');
  t = t || {};
  const a = hm_(t.hora), b = hm_(t.fim);
  if (a == null || b == null || b <= a) throw new Error('Confira o horário: o fim precisa ser depois do início.');
  const pes = (t.pessoas || []).map(String).filter(Boolean);
  if (!pes.length) throw new Error('Escolha quem faz a tarefa.');
  const sh = sheet_('Tarefas');
  const v = sh.getDataRange().getDisplayValues();
  const i = v.findIndex((r, k) => k > 0 && r[0] === dia && r[1] === id);
  if (i < 1) throw new Error('Tarefa não encontrada.');
  const col = k => HEAD.Tarefas.indexOf(k) + 1;
  const ini = hhmm_(a), fim = hhmm_(b);
  sh.getRange(i + 1, col('hora')).setNumberFormat('@').setValue(ini.replace(':00', 'h').replace(':', 'h'));
  sh.getRange(i + 1, col('ordem')).setNumberFormat('@').setValue(String(a));
  sh.getRange(i + 1, col('fim')).setNumberFormat('@').setValue(fim);
  sh.getRange(i + 1, col('pessoas')).setNumberFormat('@').setValue(pes.join(','));
  const tit = limpa_(t.titulo, 120);
  if (t.titulo != null && tit.length < 2) throw new Error('Escreva o nome da atividade.');
  if (tit) sh.getRange(i + 1, col('titulo')).setNumberFormat('@').setValue(tit);
  if (Array.isArray(t.itens)) sh.getRange(i + 1, col('itens')).setNumberFormat('@').setValue(t.itens.map(x => limpa_(x, 200).replace(/\|/g, '/')).filter(Boolean).join(' | '));
  if (Array.isArray(t.metas)) sh.getRange(i + 1, col('metas')).setNumberFormat('@').setValue(t.metas.map(x => limpa_(x, 200).replace(/\|/g, '/')).filter(Boolean).join(' | '));
  if (tit) v[i][5] = tit;
  evento_('alteracao', pes.join(','), '🗓 Atividade alterada: "' + v[i][5] + '": ' + ini + '–' + fim + ' · ' + pes.map(nomeDe_).join(', ') + '.', 'todos', id);
  return getData(dia, pessoa, pin);
}

/* ================================================================== */
/* v41 · Suporte geral do colaborador                                  */
/* ================================================================== */
const SUPORTE_CATS = ['Dúvida no app', 'Material ou estrutura', 'Problema numa atividade', 'Pessoal / RH', 'Outro'];
function suportesLista_(viewer) {
  if (!viewer || !viewer.id) return [];
  const L = rows_('Suportes').filter(s => viewer.gestor || s.pessoa === viewer.id)
    .sort((a, b) => Number(b.ms) - Number(a.ms));
  const abertos = L.filter(s => s.estado !== 'resolvido'), feitos = L.filter(s => s.estado === 'resolvido').slice(0, viewer.gestor ? 15 : 8);
  return abertos.concat(feitos).map(s => ({ id: s.id, dia: s.dia, hora: s.hora, pessoa: s.pessoa, nome: nomeDe_(s.pessoa), categoria: s.categoria,
    texto: s.texto, estado: s.estado || 'aberto', resposta: s.resposta, respPor: s.resp_por ? nomeDe_(s.resp_por) : '', respHora: s.resp_hora }));
}
function pedirSuporteGeral(pessoa, pin, categoria, texto) {
  const p = checkPin_(pessoa, pin);
  texto = limpa_(texto, 600);
  if (texto.length < 3) throw new Error('Escreva o que você precisa.');
  if (SUPORTE_CATS.indexOf(categoria) < 0) categoria = 'Outro';
  const id = 'sp' + Date.now().toString(36);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { upsert_('Suportes', id, { dia: hoje_(), hora: agora_(), ms: String(Date.now()), pessoa: pessoa, categoria: categoria, texto: texto, estado: 'aberto' }); }
  finally { lock.releaseLock(); }
  evento_('suporte', pessoa, '🆘 ' + p.nome + ' pediu suporte (' + categoria + '): ' + texto, 'gestor');
  return { id: id, suportes: suportesLista_({ id: pessoa, gestor: GESTORES.indexOf(pessoa) >= 0 }), whatsVictor: wa_((rows_('Equipe').find(e => e.id === DONO) || {}).telefone) };
}
function resolverSuporteGeral(pessoa, pin, id, resposta) {
  checkGestor_(pessoa, pin);
  const s = rows_('Suportes').find(x => x.id === id);
  if (!s) throw new Error('Pedido não encontrado.');
  resposta = limpa_(resposta, 600);
  upsert_('Suportes', id, { estado: 'resolvido', resposta: resposta, resp_por: pessoa, resp_hora: hoje_() + ' ' + agora_() });
  evento_('suporte', s.pessoa, '🤝 Seu pedido de suporte foi resolvido' + (resposta ? ': ' + resposta : '.'), 'pessoa', '', s.pessoa);
  return { suportes: suportesLista_({ id: pessoa, gestor: true }), telefone: wa_((rows_('Equipe').find(e => e.id === s.pessoa) || {}).telefone) };
}

/* ================================================================== */
/* v41 · Cadastro ONG (membros), documentos, presença e atendimento    */
/* ================================================================== */
const DOC_TIPOS = { foto: 'Foto 3x4', rg: 'RG', cpf: 'CPF', comprovante: 'Comprovante de residência', sus: 'Cartão SUS', exame: 'Exame', anexo: 'Anexo' };
const TEMAS_ATEND = ['Marcações', 'Informação', 'Matrícula no Flor', 'Matrícula na Dança', 'Matrícula no Kids', 'Cadastro na Sopa',
  'Cadastro na ONG', 'Cadastro do Geração Futuro', 'Marcação de consulta: Psicologia', 'Marcação de consulta: Outra'];
const TEMA_PROG_ = { 'Matrícula no Flor': 'flor', 'Matrícula na Dança': 'danca', 'Matrícula no Kids': 'kids', 'Cadastro na Sopa': 'sopa' };
const MAX_DOC_B64 = 11 * 1024 * 1024; // ~8 MB por arquivo

function membroResumo_(m) { return { num: m.num, nome: m.nome, telefone: m.telefone, endereco: m.endereco, criado: m.criado }; }
function membros(pessoa, pin) {
  checkPin_(pessoa, pin);
  const L = rows_('Membros').filter(m => m.num).map(membroResumo_).sort((a, b) => a.nome.localeCompare(b.nome));
  return { membros: L, total: L.length, temas: TEMAS_ATEND, docTipos: DOC_TIPOS, hoje: hoje_(), resumoHoje: resumoAtend_(hoje_()) };
}
function membro(pessoa, pin, num) {
  checkPin_(pessoa, pin);
  const m = rows_('Membros').find(x => x.num === num);
  if (!m) throw new Error('Cadastro não encontrado.');
  let moradores = []; try { moradores = JSON.parse(m.moradores || '[]'); } catch (e) { }
  const docs = rows_('MembroDocs').filter(d => d.num === num).map(d => ({ id: d.id, tipo: d.tipo, nome: d.nome, mime: d.mime, dia: d.dia, descricao: d.descricao, por: nomeDe_(d.por) }))
    .sort((a, b) => b.id.localeCompare(a.id));
  const atend = rows_('Atendimentos').filter(a => a.num === num).sort((a, b) => b.ficha.localeCompare(a.ficha)).slice(0, 40)
    .map(a => ({ ficha: a.ficha, dia: a.dia, inicio: a.inicio, tema: a.tema, data: a.data_marcada, descricao: a.descricao, por: nomeDe_(a.por) }));
  const pres = rows_('PresencaMembros').filter(p => p.num === num).sort((a, b) => Number(b.ms) - Number(a.ms)).slice(0, 40)
    .map(p => ({ dia: p.dia, hora: p.hora, tipo: p.tipo, atividade: p.atividade, por: nomeDe_(p.por) }));
  const sol = rows_('MembroSolicitacoes').filter(s => s.num === num).sort((a, b) => b.id.localeCompare(a.id))
    .map(s => ({ id: s.id, dia: s.dia, data: s.data, texto: s.texto, estado: s.estado || 'aberta', por: nomeDe_(s.por) }));
  return { num: m.num, nome: m.nome, telefone: m.telefone, endereco: m.endereco, rg: m.rg, cpf: m.cpf, sus: m.sus, instagram: m.instagram,
    nascimento: m.nascimento, obs: m.obs, moradores: moradores, criado: m.criado, criadoPor: nomeDe_(m.por), docs: docs, atendimentos: atend, presencas: pres, solicitacoes: sol,
    whats: wa_(m.telefone), docTipos: DOC_TIPOS };
}
function proxNumMembro_() {
  let max = 0;
  rows_('Membros').forEach(m => { const n = Number(String(m.num).replace(/\D/g, '')); if (n > max) max = n; });
  return 'AM-' + String(max + 1).padStart(4, '0');
}
function salvarMembro(pessoa, pin, m) {
  checkPin_(pessoa, pin);
  m = m || {};
  const nome = limpa_(m.nome, 90).replace(/\s+/g, ' ');
  if (nome.length < 3) throw new Error('O nome é obrigatório.');
  if (String(m.telefone || '').replace(/\D/g, '').length < 10) throw new Error('O telefone é obrigatório (com DDD).');
  if (limpa_(m.endereco).length < 5) throw new Error('O endereço é obrigatório.');
  if (String(m.rg || '').replace(/\W/g, '').length < 4) throw new Error('O número do RG é obrigatório.');
  const moradores = (m.moradores || []).slice(0, 5).map(x => ({ nome: limpa_(x && x.nome, 80), telefone: limpa_(x && x.telefone, 30), parentesco: limpa_(x && x.parentesco, 40) }))
    .filter(x => x.nome);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let num = String(m.num || '');
  try {
    sheet_('Membros');
    const todos = rows_('Membros');
    if (num && !todos.some(x => x.num === num)) throw new Error('Cadastro não encontrado.');
    const rg = String(m.rg).replace(/\W/g, '').toUpperCase();
    const dup = todos.find(x => x.num !== num && String(x.rg).replace(/\W/g, '').toUpperCase() === rg);
    if (dup) throw new Error('Este RG já está cadastrado: ' + dup.nome + ' (nº ' + dup.num + ').');
    const obj = { nome: nome, telefone: limpa_(m.telefone, 30), endereco: limpa_(m.endereco, 200), rg: limpa_(m.rg, 30), cpf: limpa_(m.cpf, 20),
      sus: limpa_(m.sus, 30), instagram: limpa_(m.instagram, 60).replace(/^@?/, m.instagram ? '@' : ''), nascimento: dataOk_(m.nascimento) ? m.nascimento : '',
      obs: limpa_(m.obs, 400), moradores: JSON.stringify(moradores), atualizado: hoje_() + ' ' + agora_() };
    if (!num) { num = proxNumMembro_(); obj.criado = obj.atualizado; obj.por = pessoa; }
    upsert_('Membros', num, obj);
    RC_ = RC_ ? {} : RC_;
  } finally { lock.releaseLock(); }
  if (!m.num) evento_('cadastro', pessoa, '🪪 Novo cadastro na ONG: ' + nome + ' (nº ' + num + ').', 'gestor');
  return membro(pessoa, pin, num);
}
function addDocMembro(pessoa, pin, num, tipo, b64, mime, nomeArq, descricao) {
  checkPin_(pessoa, pin);
  if (!DOC_TIPOS[tipo]) throw new Error('Tipo de documento inválido.');
  const m = rows_('Membros').find(x => x.num === num);
  if (!m) throw new Error('Cadastro não encontrado.');
  if (!b64) throw new Error('Escolha o arquivo.');
  if (String(b64).length > MAX_DOC_B64) throw new Error('Arquivo muito grande (máx. 8 MB).');
  mime = /^(image\/(jpeg|png|webp)|application\/pdf)$/.test(mime) ? mime : 'image/jpeg';
  const ext = mime === 'application/pdf' ? '.pdf' : '.jpg';
  const nome = num + ' ' + DOC_TIPOS[tipo] + ' ' + hoje_() + ' ' + agora_().replace(':', 'h') + ext;
  // pasta privada: os arquivos NÃO ficam públicos; o app mostra pelo backend, só para quem tem PIN
  const f = pasta_('DOCS_MEMBROS_FOLDER', 'Cadastro ONG - documentos (privado)').createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, nome));
  const id = 'd' + Date.now().toString(36);
  upsert_('MembroDocs', id, { num: num, tipo: tipo, nome: limpa_(nomeArq, 80) || nome, mime: mime, file_id: f.getId(), dia: hoje_() + ' ' + agora_(), descricao: limpa_(descricao, 200), por: pessoa });
  return membro(pessoa, pin, num);
}
function arquivoMembro(pessoa, pin, id) {
  checkPin_(pessoa, pin);
  const d = rows_('MembroDocs').find(x => x.id === id);
  if (!d) throw new Error('Arquivo não encontrado.');
  const blob = DriveApp.getFileById(d.file_id).getBlob();
  return { mime: d.mime || blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()), nome: d.nome };
}
function delDocMembro(pessoa, pin, id) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode apagar documentos.');
  const d = rows_('MembroDocs').find(x => x.id === id);
  if (!d) throw new Error('Arquivo não encontrado.');
  try { DriveApp.getFileById(d.file_id).setTrashed(true); } catch (e) { Logger.log(e); }
  apagarLinha_('MembroDocs', id);
  return membro(pessoa, pin, d.num);
}
function presencaMembro(pessoa, pin, num, tipo, atividade) {
  checkPin_(pessoa, pin);
  const m = rows_('Membros').find(x => x.num === num);
  if (!m) throw new Error('Cadastro não encontrado.');
  tipo = tipo === 'atividade' ? 'atividade' : 'entrada';
  atividade = limpa_(atividade, 80);
  if (tipo === 'atividade' && !atividade) throw new Error('Diga em qual atividade.');
  const hoje = hoje_();
  if (tipo === 'entrada' && rows_('PresencaMembros').some(p => p.num === num && p.dia === hoje && p.tipo === 'entrada')) throw new Error(m.nome + ' já teve a entrada registrada hoje.');
  upsert_('PresencaMembros', 'pm' + Date.now().toString(36), { dia: hoje, hora: agora_(), ms: String(Date.now()), num: num, nome: m.nome, tipo: tipo, atividade: atividade, por: pessoa });
  return membro(pessoa, pin, num);
}
function addSolicitacaoMembro(pessoa, pin, num, data, texto) {
  checkPin_(pessoa, pin);
  if (!rows_('Membros').some(x => x.num === num)) throw new Error('Cadastro não encontrado.');
  texto = limpa_(texto, 500);
  if (texto.length < 3) throw new Error('Descreva a solicitação.');
  upsert_('MembroSolicitacoes', 'so' + Date.now().toString(36), { num: num, dia: hoje_() + ' ' + agora_(), data: dataOk_(data) ? data : hoje_(), texto: texto, estado: 'aberta', por: pessoa });
  return membro(pessoa, pin, num);
}
function marcarSolicitacaoMembro(pessoa, pin, id, estado) {
  checkPin_(pessoa, pin);
  const s = rows_('MembroSolicitacoes').find(x => x.id === id);
  if (!s) throw new Error('Solicitação não encontrada.');
  upsert_('MembroSolicitacoes', id, { estado: estado === 'aberta' ? 'aberta' : 'atendida' });
  return membro(pessoa, pin, s.num);
}
function resumoAtend_(dia) {
  const L = rows_('Atendimentos').filter(a => a.dia === dia);
  const porTema = {}; L.forEach(a => porTema[a.tema] = (porTema[a.tema] || 0) + 1);
  return { dia: dia, total: L.length, porTema: porTema,
    lista: L.sort((a, b) => b.ficha.localeCompare(a.ficha)).map(a => ({ ficha: a.ficha, inicio: a.inicio, entrada: a.entrada, num: a.num, nome: a.nome, tema: a.tema, data: a.data_marcada, descricao: a.descricao, por: nomeDe_(a.por) })) };
}
function atendimentos(pessoa, pin, dia) { checkPin_(pessoa, pin); return resumoAtend_(dataOk_(dia) ? dia : hoje_()); }
function novoAtendimento(pessoa, pin, a) {
  checkPin_(pessoa, pin);
  a = a || {};
  const m = rows_('Membros').find(x => x.num === a.num);
  if (!m) throw new Error('Escolha o membro (ou faça o cadastro novo).');
  if (TEMAS_ATEND.indexOf(a.tema) < 0) throw new Error('Escolha o tema do atendimento.');
  if (!dataOk_(a.data)) throw new Error('Informe a data.');
  const desc = limpa_(a.descricao, 600);
  if (desc.length < 3) throw new Error('Escreva a descrição do atendimento.');
  const hoje = hoje_(), base = hoje.replace(/-/g, '');
  let ficha, entrada;
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    sheet_('Atendimentos');
    const n = rows_('Atendimentos').filter(x => x.dia === hoje).length + 1;
    ficha = base + '-' + String(n).padStart(3, '0');
    // registra a entrada do membro na ONG, se ainda não foi registrada hoje
    const ent = rows_('PresencaMembros').find(p => p.num === m.num && p.dia === hoje && p.tipo === 'entrada');
    entrada = ent ? ent.hora : agora_();
    if (!ent) upsert_('PresencaMembros', 'pm' + Date.now().toString(36), { dia: hoje, hora: entrada, ms: String(Date.now()), num: m.num, nome: m.nome, tipo: 'entrada', atividade: 'Atendimento', por: pessoa });
    upsert_('Atendimentos', ficha, { dia: hoje, entrada: entrada, inicio: agora_(), ms: String(Date.now()), num: m.num, nome: m.nome, tema: a.tema, data_marcada: a.data, descricao: desc, por: pessoa });
  } finally { lock.releaseLock(); }
  // matrícula / cadastro em programa: já coloca na lista do programa
  let programa = '';
  const prog = TEMA_PROG_[a.tema];
  if (prog) {
    try { salvarParticipante(pessoa, pin, { programa: prog, nome: m.nome, telefone: m.telefone, endereco: m.endereco, sus: m.sus }); programa = 'ok'; }
    catch (e) { programa = String(e.message || e); }
  }
  return { ficha: ficha, entrada: entrada, nome: m.nome, num: m.num, tema: a.tema, programa: programa, resumo: resumoAtend_(hoje) };
}

/* ================================================================== */
/* v42 · Importar o WhatsApp da equipe (lista colada ou contatos .vcf) */
/* ================================================================== */
function importarTelefones(pessoa, pin, linhas) {
  checkGestor_(pessoa, pin);
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const equipe = rows_('Equipe').filter(e => e.id);
  const atualizados = [], naoAchados = [], invalidos = [];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    (linhas || []).slice(0, 200).forEach(l => {
      const nome = limpa_(l && l.nome, 80), dig = String(l && l.tel || '').replace(/\D/g, '');
      if (!nome) return;
      const w = wa_(dig);
      if (!w || w.length < 12) { invalidos.push(nome); return; }
      const n = norm(nome), pn = n.split(' ')[0];
      let alvo = equipe.find(e => norm(e.nome) === n || e.id === n.replace(/ /g, ''));
      if (!alvo) { const c = equipe.filter(e => norm(e.nome).split(' ')[0] === pn || e.id === pn); if (c.length === 1) alvo = c[0]; }
      if (!alvo) { const c = equipe.filter(e => n.indexOf(norm(e.nome)) === 0 || norm(e.nome).indexOf(n) === 0); if (c.length === 1) alvo = c[0]; }
      if (!alvo) { naoAchados.push(nome); return; }
      upsert_('Equipe', alvo.id, { telefone: dig });
      atualizados.push({ id: alvo.id, nome: alvo.nome, tel: w });
    });
  } finally { lock.releaseLock(); }
  return { atualizados: atualizados, naoAchados: naoAchados, invalidos: invalidos };
}

/* ================================================================== */
/* v42 · Documentos da ONG (formulários em PDF, Word etc.)             */
/* ================================================================== */
const DOC_ONG_MIMES = { 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.oasis.opendocument.text': 'odt', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/jpeg': 'jpg', 'image/png': 'png' };
function docsOng(pessoa, pin) {
  checkPin_(pessoa, pin);
  return rows_('DocsONG').filter(d => d.id).map(d => ({ id: d.id, nome: d.nome, ext: d.ext, tamanho: Number(d.tamanho) || 0, dia: d.dia, por: nomeDe_(d.por) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
}
function addDocOng(pessoa, pin, nome, b64, mime, arquivo) {
  checkPin_(pessoa, pin);
  nome = limpa_(nome, 120).replace(/\s+/g, ' ');
  if (nome.length < 2) throw new Error('Dê um nome ao documento.');
  if (!b64) throw new Error('Escolha o arquivo.');
  if (String(b64).length > MAX_DOC_B64) throw new Error('Arquivo muito grande (máx. 8 MB).');
  let ext = DOC_ONG_MIMES[mime] || (String(arquivo || '').match(/\.(pdf|docx?|odt|xlsx?|jpe?g|png)$/i) || [])[1];
  if (!ext) throw new Error('Envie PDF, Word (.doc/.docx), planilha ou imagem.');
  ext = ext.toLowerCase();
  if (!DOC_ONG_MIMES[mime]) mime = Object.keys(DOC_ONG_MIMES).find(k => DOC_ONG_MIMES[k] === ext.replace('jpeg', 'jpg')) || 'application/octet-stream';
  const bytes = Utilities.base64Decode(b64);
  const f = pasta_('DOCS_ONG_FOLDER', 'Documentos da ONG (app)').createFile(Utilities.newBlob(bytes, mime, nome + '.' + ext));
  const id = 'do' + Date.now().toString(36);
  upsert_('DocsONG', id, { nome: nome, ext: ext, mime: mime, file_id: f.getId(), tamanho: String(bytes.length), dia: hoje_() + ' ' + agora_(), por: pessoa });
  evento_('documento', pessoa, '📂 Novo documento da ONG: ' + nome + ' (' + ext.toUpperCase() + ').', 'todos');
  return docsOng(pessoa, pin);
}
function baixarDocOng(pessoa, pin, id) {
  checkPin_(pessoa, pin);
  const d = rows_('DocsONG').find(x => x.id === id);
  if (!d) throw new Error('Documento não encontrado.');
  const blob = DriveApp.getFileById(d.file_id).getBlob();
  return { b64: Utilities.base64Encode(blob.getBytes()), mime: d.mime, nome: d.nome + '.' + d.ext };
}
function renomearDocOng(pessoa, pin, id, nome) {
  checkGestor_(pessoa, pin);
  nome = limpa_(nome, 120).replace(/\s+/g, ' ');
  if (nome.length < 2) throw new Error('Dê um nome ao documento.');
  const d = rows_('DocsONG').find(x => x.id === id);
  if (!d) throw new Error('Documento não encontrado.');
  upsert_('DocsONG', id, { nome: nome });
  try { DriveApp.getFileById(d.file_id).setName(nome + '.' + d.ext); } catch (e) { Logger.log(e); }
  return docsOng(pessoa, pin);
}
function delDocOng(pessoa, pin, id) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor pode apagar documentos.');
  const d = rows_('DocsONG').find(x => x.id === id);
  if (!d) throw new Error('Documento não encontrado.');
  try { DriveApp.getFileById(d.file_id).setTrashed(true); } catch (e) { Logger.log(e); }
  apagarLinha_('DocsONG', id);
  return docsOng(pessoa, pin);
}

/* ================================================================== */
/* v43 · Entrada com selfie (vale como foto do ponto)                  */
/* ================================================================== */
const SELFIE_VALIDA_MIN = 5 * 60; // a selfie do login serve para o ponto por até 5 horas
function selfieLogin(pessoa, pin, b64, info) {
  const p = checkPin_(pessoa, pin);
  if (!b64 || String(b64).length < 2000) throw new Error('Tire a selfie para entrar.');
  info = info || {};
  const face = info.face || {}, temRef = !!(rows_('Equipe').find(x => x.id === pessoa) || {}).foto_ref;
  if (temRef && face.st === 'diferente' && !face.forcar) throw new Error('O rosto não confere com a sua foto cadastrada. Tire de novo, de frente e com boa luz.');
  if (temRef && face.st === 'sem_rosto' && !face.forcar) throw new Error('Não encontrei um rosto na foto. Tire de novo, de frente e com boa luz.');
  const lat = Number(info.lat), lng = Number(info.lng), acc = Number(info.acc) || 0, temLoc = info.lat != null && isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0);
  const dist = temLoc ? distSede_(lat, lng) : null, naOng = dist != null && acc <= 300 && dist <= RAIO_SEDE + Math.min(acc, 100);
  const rosto = !temRef ? 'sem_ref' : face.st === 'ok' ? 'confere' : face.st === 'diferente' ? 'nao_confere' : face.st === 'sem_rosto' ? 'sem_rosto' : 'nao_verificado';
  const dia = hoje_(), hora = agora_();
  const f = pasta_('SELFIE_FOLDER', 'Selfies de entrada (app)').createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', dia + ' ' + hora.replace(':', 'h') + ' ' + p.nome + ' (selfie).jpg'));
  const id = 'sf' + Date.now().toString(36);
  upsert_('Selfies', id, { dia: dia, hora: hora, ms: String(Date.now()), pessoa: pessoa, url: f.getUrl(), usada: '',
    lat: temLoc ? lat.toFixed(6) : '', lng: temLoc ? lng.toFixed(6) : '', acc: temLoc ? String(Math.round(acc)) : '', dist: dist == null ? '' : String(dist), na_ong: naOng ? 'sim' : 'nao',
    rosto: rosto, rosto_dist: face.dist != null ? String(Math.round(Number(face.dist) * 1000) / 1000) : '' });
  if (rosto === 'nao_confere' || rosto === 'sem_rosto') evento_('selfie', pessoa, '⚠️ Selfie de ' + p.nome + ' (' + hora + '): o rosto não conferiu com a foto cadastrada. Confira em Gestão → Selfies de hoje.', 'gestor');
  return { id: id, hora: hora, dia: dia, validaMin: SELFIE_VALIDA_MIN, naOng: naOng, dist: dist, rosto: rosto };
}
function selfieParaPonto_(pessoa, id) {
  const s = rows_('Selfies').find(x => x.id === String(id || ''));
  if (!s || s.pessoa !== pessoa) throw new Error('Selfie do login não encontrada. Tire a foto do ponto.');
  if (s.usada) throw new Error('Essa selfie já foi usada num ponto. Tire uma foto nova.');
  if (s.dia !== hoje_() || Date.now() - Number(s.ms) > SELFIE_VALIDA_MIN * 60000) throw new Error('A selfie do login venceu. Tire uma foto nova.');
  if (!liberadoGeral_() && GESTORES.indexOf(pessoa) < 0 && SEM_LOCAL.indexOf(pessoa) < 0 && s.na_ong !== 'sim') throw new Error('Sua selfie do login não foi tirada na ONG. Tire a foto do ponto aqui na ONG.');
  return s;
}

/* ================================================================== */
/* v44 · Carteirinha de membro da ONG (a partir do Cadastro ONG)       */
/* ================================================================== */
function emitirCarteirinhaMembro(pessoa, pin, num) {
  checkPin_(pessoa, pin);
  const m = rows_('Membros').find(x => x.num === num);
  if (!m) throw new Error('Cadastro não encontrado.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  let numero, dia, hora;
  try {
    const sh = sheet_('Carteirinhas');
    const pr = PropertiesService.getScriptProperties();
    const seq = Math.max(Number(pr.getProperty('CART_SEQ') || 0), sh.getLastRow() - 1) + 1;
    pr.setProperty('CART_SEQ', String(seq));
    numero = String(seq).padStart(5, '0'); dia = hoje_(); hora = agora_();
    sh.getRange(sh.getLastRow() + 1, 1, 1, HEAD.Carteirinhas.length).setNumberFormat('@')
      .setValues([[numero, dia, hora, 'ong', num, m.nome, m.telefone, m.endereco, m.sus, pessoa]]);
  } finally { lock.releaseLock(); }
  const via = rows_('Carteirinhas').filter(x => x.programa === 'ong' && x.participante === num).length;
  // foto: a mais recente da seção "Foto 3x4" do cadastro
  let foto = '';
  const f = rows_('MembroDocs').filter(d => d.num === num && d.tipo === 'foto').sort((a, b) => b.id.localeCompare(a.id))[0];
  if (f) { try { foto = 'data:' + (f.mime || 'image/jpeg') + ';base64,' + Utilities.base64Encode(DriveApp.getFileById(f.file_id).getBlob().getBytes()); } catch (e) { Logger.log(e); } }
  const [y, mo, d] = dia.split('-');
  evento_('cadastro', pessoa, '🪪 Carteirinha da ONG emitida: ' + m.nome + ' (nº ' + num + ').', 'gestor');
  return { numero: numero, dia: dia, via: via, validade: d + '/' + mo + '/' + (Number(y) + 1), num: num, nome: m.nome, telefone: m.telefone,
    rg: m.rg, sus: m.sus, nascimento: m.nascimento, foto: foto };
}

/* ================================================================== */
/* v45 · "Estou na ONG" (até sexta 08h), selfie com local e rosto      */
/* ================================================================== */
function naOngConfirmado_(pessoa) { const h = hoje_(); return rows_('ConfirmaOng').some(c => c.dia === h && c.pessoa === pessoa); }
function confirmadosOng_() {
  const h = hoje_();
  return rows_('ConfirmaOng').filter(c => c.dia === h).sort((a, b) => a.hora.localeCompare(b.hora)).map(c => ({ pessoa: c.pessoa, hora: c.hora }));
}
/* até sexta 08h: quem não é da coordenação precisa confirmar "Estou na ONG" para ponto e atividades */
function exigeNaOng_(pessoa, oQue) {
  if (GESTORES.indexOf(pessoa) >= 0 || SEM_LOCAL.indexOf(pessoa) >= 0) return;
  if (liberadoGeral_() && !naOngConfirmado_(pessoa)) throw new Error('Toque em 📍 Estou na ONG antes de ' + oQue + '. Só vale dentro da ONG.');
}
function estouNaOng(pessoa, pin, loc) {
  const p = checkPin_(pessoa, pin);
  if (!liberadoGeral_()) throw new Error('A partir de agora a confirmação é pela localização do celular. Ative a localização.');
  if (naOngConfirmado_(pessoa)) return { confirmados: confirmadosOng_() };
  loc = loc || {};
  const lat = Number(loc.lat), lng = Number(loc.lng), temLoc = loc.lat != null && isFinite(lat) && isFinite(lng);
  const dist = temLoc ? distSede_(lat, lng) : null, hora = agora_();
  upsert_('ConfirmaOng', 'co' + Date.now().toString(36), { dia: hoje_(), hora: hora, pessoa: pessoa, lat: temLoc ? lat.toFixed(6) : '', lng: temLoc ? lng.toFixed(6) : '', dist: dist == null ? '' : String(dist) });
  evento_('naong', pessoa, '📍 ' + p.nome + ' confirmou: estou na ONG (' + hora + ').', 'todos');
  return { confirmados: confirmadosOng_() };
}
/* foto de referência de cada colaborador (para conferir o rosto na selfie) */
function salvarFotoRef(pessoa, pin, alvo, b64) {
  checkPin_(pessoa, pin); if (pessoa !== DONO) throw new Error('Só o Victor cadastra as fotos de referência.');
  const e = rows_('Equipe').find(x => x.id === alvo); if (!e) throw new Error('Colaborador não encontrado.');
  if (!b64 || String(b64).length < 2000) throw new Error('Escolha a foto.');
  const f = pasta_('REF_FOLDER', 'Fotos de referência da equipe (privado)').createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', e.nome + ' (referência ' + hoje_() + ').jpg'));
  if (e.foto_ref) { try { DriveApp.getFileById(e.foto_ref).setTrashed(true); } catch (x) { Logger.log(x); } }
  upsert_('Equipe', alvo, { foto_ref: f.getId() });
  return equipeCadastro(pessoa, pin);
}
function minhaFotoRef(pessoa, pin) {
  checkPin_(pessoa, pin);
  const e = rows_('Equipe').find(x => x.id === pessoa);
  if (!e || !e.foto_ref) return { versao: '', b64: '' };
  return { versao: e.foto_ref, b64: Utilities.base64Encode(DriveApp.getFileById(e.foto_ref).getBlob().getBytes()) };
}
function verFotoRef(pessoa, pin, alvo) {
  checkGestor_(pessoa, pin);
  const e = rows_('Equipe').find(x => x.id === alvo);
  if (!e || !e.foto_ref) throw new Error('Sem foto de referência.');
  return { b64: Utilities.base64Encode(DriveApp.getFileById(e.foto_ref).getBlob().getBytes()), mime: 'image/jpeg', nome: e.nome + ' (referência).jpg' };
}
/* selfies do dia para a coordenação conferir */
function selfiesHoje(pessoa, pin) {
  checkGestor_(pessoa, pin);
  const h = hoje_();
  return rows_('Selfies').filter(s => s.dia === h).sort((a, b) => Number(b.ms) - Number(a.ms))
    .map(s => ({ id: s.id, hora: s.hora, pessoa: s.pessoa, nome: nomeDe_(s.pessoa), naOng: s.na_ong, dist: s.dist, rosto: s.rosto, usada: s.usada }));
}
function verSelfie(pessoa, pin, id) {
  checkGestor_(pessoa, pin);
  const s = rows_('Selfies').find(x => x.id === id); if (!s) throw new Error('Selfie não encontrada.');
  const fid = (String(s.url).match(/[-\w]{25,}/) || [])[0];
  return { b64: Utilities.base64Encode(DriveApp.getFileById(fid).getBlob().getBytes()), mime: 'image/jpeg', nome: s.hora + ' ' + nomeDe_(s.pessoa) + ' (selfie).jpg' };
}

/* ================================================================== */
/* v46 · Meu Assessor 5: arquivos na galeria e leitura de RSS         */
/* ================================================================== */
function maArquivo(pessoa, pin, b64, mime, nome) {
  maCheck_(pessoa, pin);
  if (!b64) throw new Error('Arquivo vazio.');
  if (String(b64).length > 11 * 1024 * 1024) throw new Error('Arquivo grande demais (máx. 8 MB).');
  const pr = PropertiesService.getScriptProperties();
  let pasta = null;
  try { pasta = pr.getProperty('MA_FOLDER') ? DriveApp.getFolderById(pr.getProperty('MA_FOLDER')) : null; } catch (e) { pasta = null; }
  if (!pasta) { pasta = DriveApp.createFolder('Meu Assessor — fotos (Victor)'); pr.setProperty('MA_FOLDER', pasta.getId()); }
  const arq = pasta.createFile(Utilities.newBlob(Utilities.base64Decode(b64), String(mime || 'application/octet-stream'), limpa_(nome, 120) || ('arquivo ' + hoje_())));
  try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  return { id: arq.getId(), url: 'https://drive.google.com/file/d/' + arq.getId() + '/view' };
}
/* lê RSS/Atom (YouTube, blogs, podcasts) e devolve os itens mais recentes */
function maRss(pessoa, pin, url) {
  maCheck_(pessoa, pin);
  url = String(url || '').trim();
  if (!/^https?:\/\//.test(url)) throw new Error('Link de RSS inválido.');
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (r.getResponseCode() >= 400) throw new Error('Não consegui abrir esse RSS (' + r.getResponseCode() + ').');
  const xml = r.getContentText(), itens = [];
  const blocos = xml.match(/<(item|entry)[\s>][\s\S]*?<\/(item|entry)>/g) || [];
  blocos.slice(0, 20).forEach(b => {
    const tag = n => { const m = b.match(new RegExp('<' + n + '[^>]*>([\\s\\S]*?)<\\/' + n + '>')); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
    let link = tag('link'); if (!link) { const m = b.match(/<link[^>]*href="([^"]+)"/); link = m ? m[1] : ''; }
    const data = tag('pubDate') || tag('published') || tag('updated');
    let iso = ''; try { iso = data ? Utilities.formatDate(new Date(data), TZ, "yyyy-MM-dd'T'HH:mm") : ''; } catch (e) { }
    itens.push({ titulo: tag('title').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').slice(0, 200), link: link, data: iso });
  });
  return itens;
}

/* ================================================================== */
/* v47 · Campanha de postagem: link + foto, Feito com print, lista pública */
/* ================================================================== */
function salvarCampanha(pessoa, pin, c) {
  checkGestor_(pessoa, pin);
  c = c || {};
  const link = limpa_(c.link, 400), texto = limpa_(c.texto, 300) || 'Poste e mande print aqui! #BoraEngajar';
  let foto = '';
  if (c.fotoB64) {
    const f = pasta_('CAMP_FOLDER', 'Campanhas de postagem (app)').createFile(Utilities.newBlob(Utilities.base64Decode(c.fotoB64), 'image/jpeg', 'campanha ' + hoje_() + ' ' + agora_().replace(':', 'h') + '.jpg'));
    try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
    foto = 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w1200';
  } else if (c.manterFoto) foto = (cfg_('campanha', {}) || {}).foto || '';
  if (!link && !foto) throw new Error('Coloque o link do post ou a foto para postar.');
  const camp = { id: 'cp' + Date.now().toString(36), link: link, texto: texto, foto: foto, dia: hoje_(), hora: agora_(), por: pessoa };
  cfgSet_('campanha', camp, pessoa);
  if (link) cfgSet_('post', link, pessoa);
  evento_('campanha', pessoa, '📣 ' + texto + (link ? ' 👉 Abra Engaja.' : ''), 'todos');
  return campanhaInfo_();
}
function encerrarCampanha(pessoa, pin) { checkGestor_(pessoa, pin); cfgSet_('campanha', {}, pessoa); return null; }
function campanhaInfo_() {
  const c = cfg_('campanha', {}) || {};
  if (!c.id) return null;
  const desde = c.dia + ' ' + c.hora;
  const feitos = rows_('Engajamento').filter(x => x.estado !== 'invalido' && (x.dia + ' ' + x.hora) >= desde);
  const ja = {}; feitos.forEach(x => { if (!ja[x.pessoa]) ja[x.pessoa] = { pessoa: x.pessoa, hora: x.hora, dia: x.dia, tipo: (ENG_TIPOS[x.tipo] || { t: x.tipo }).t }; });
  const equipe = rows_('Equipe').map(e => e.id).filter(id => id && GESTORES.indexOf(id) < 0 && PRIVADOS.indexOf(id) < 0);
  return { id: c.id, link: c.link, texto: c.texto, foto: c.foto, dia: c.dia, hora: c.hora, por: nomeDe_(c.por),
    postaram: Object.keys(ja).map(k => ja[k]).sort((a, b) => (a.dia + a.hora).localeCompare(b.dia + b.hora)),
    faltam: equipe.filter(id => !ja[id]) };
}

/* ================================================================== */
/* MKT MARIBONDO — quadro de produções, entregas, chat ao vivo         */
/* ================================================================== */
HEAD.MKT = ['col', 'id', 'json', 'em', 'por', 'ms'];
HEAD.MKTChat = ['id', 'ms', 'dia', 'hora', 'por', 'tipo', 'texto', 'ref', 'alvo', 'extra'];
HEAD.MKTEquipe = ['id', 'nome', 'pin', 'gestor', 'funcoes', 'zap', 'foto', 'ativo', 'cor'];
const MK_COLECOES = ['cards', 'refs', 'perfis', 'padroes', 'config', 'jogo'];
const MK_SO_GESTOR = ['padroes', 'config'];
const MK_SEMENTE = [
  ['victor', 'Victor', 'sim', 'Gestão geral', '#111111'],
  ['igor', 'Igor', '', 'Artes · Coberturas', '#7C3AED'],
  ['thiago', 'Thiago', '', 'Vídeos · Motions', '#2563EB'],
  ['gemea', 'Gêmea', '', 'Gestão de artes · Captação e edições', '#DB2777'],
  ['klarice', 'Klarice', '', 'Gestão de vídeos e motions · Captação e edições', '#059669']
];
function mkSh_(nome) { const sh = sheet_(nome); return sh; }
function mkEquipe_() {
  const sh = mkSh_('MKTEquipe');
  let v = sh.getDataRange().getValues();
  if (v.length < 2) {
    MK_SEMENTE.forEach(s => sh.appendRow([s[0], s[1], '', s[2], s[3], '', '', 'sim', s[4]]));
    v = sh.getDataRange().getValues();
  }
  const h = v[0];
  return v.slice(1).filter(r => r[0]).map((r, i) => { const o = { _row: i + 2 }; h.forEach((k, j) => o[k] = String(r[j] == null ? '' : r[j])); return o; });
}
function mkPub_(r) { return { id: r.id, nome: r.nome, gestor: r.gestor === 'sim', funcoes: r.funcoes, zap: r.zap, foto: r.foto, ativo: r.ativo !== 'nao', cor: r.cor || '#111111', temPin: !!r.pin || r.id === MA_DONO }; }
function mkCheck_(pessoa, pin) {
  pessoa = String(pessoa || '').trim().toLowerCase(); pin = String(pin || '').trim();
  const r = mkEquipe_().find(x => x.id === pessoa && x.ativo !== 'nao');
  const ok = r && pin && ((pessoa === MA_DONO && pin === MA_SENHA) || (r.pin && r.pin === pin));
  if (!ok) { Utilities.sleep(700); throw new Error('Senha incorreta.'); }
  return mkPub_(r);
}
function mkGestor_(pessoa, pin) { const eu = mkCheck_(pessoa, pin); if (!eu.gestor) throw new Error('Só a gestão pode fazer isso.'); return eu; }
/* lista pública para a tela de entrada (nome e foto) */
function mkEquipeLista() { return mkEquipe_().filter(r => r.ativo !== 'nao').map(r => { const p = mkPub_(r); return { id: p.id, nome: p.nome, foto: p.foto, funcoes: p.funcoes, cor: p.cor, temPin: p.temPin }; }); }
function mkLogin(pessoa, pin) { const eu = mkCheck_(pessoa, pin); return { eu: eu, equipe: mkEquipe_().map(mkPub_) }; }
function mkMarca_(chave, ms) { try { CacheService.getScriptCache().put(chave, String(ms), 21600); } catch (e) {} PropertiesService.getScriptProperties().setProperty(chave, String(ms)); }
function mkLe_(chave) { let v = null; try { v = CacheService.getScriptCache().get(chave); } catch (e) {} if (v == null) v = PropertiesService.getScriptProperties().getProperty(chave); return Number(v || 0); }
function mkMsg_(r) { let alvo = [], extra = {}; try { alvo = r[8] ? JSON.parse(r[8]) : []; } catch (e) {} try { extra = r[9] ? JSON.parse(r[9]) : {}; } catch (e) {}
  return { id: String(r[0]), ms: Number(r[1]), dia: String(r[2]), hora: String(r[3]), por: String(r[4]), tipo: String(r[5]), texto: String(r[6]), ref: String(r[7] || ''), alvo: alvo, extra: extra }; }
function mkChatDesde_(desde, max) {
  const sh = mkSh_('MKTChat'), n = sh.getLastRow() - 1; if (n < 1) return [];
  const ini = Math.max(0, n - 600), v = sh.getRange(2 + ini, 1, n - ini, 10).getValues(), out = [];
  for (let i = v.length - 1; i >= 0; i--) { if (Number(v[i][1]) <= desde) break; out.push(mkMsg_(v[i])); if (out.length >= (max || 150)) break; }
  return out.reverse();
}
function mkEvento_(por, tipo, texto, ref, alvo, extra) {
  const ms = Math.max(Date.now(), mkLe_('MK_CHAT') + 1), id = 'm' + ms.toString(36) + Math.floor(Math.random() * 1e3);
  const linha = [id, String(ms), hoje_(), agora_(), por, tipo, limpa_(texto, 2000), ref || '', JSON.stringify(alvo || []), JSON.stringify(extra || {})];
  mkSh_('MKTChat').appendRow(linha);
  mkMarca_('MK_CHAT', ms);
  return mkMsg_(linha);
}
function mkDocs_(desde) {
  const sh = mkSh_('MKT'), v = sh.getDataRange().getValues(), out = {}, mud = [];
  MK_COLECOES.forEach(c => out[c] = {});
  for (let i = 1; i < v.length; i++) {
    const col = String(v[i][0]), id = String(v[i][1]); if (!out[col] || !id) continue;
    let o = null; try { o = JSON.parse(v[i][2]); } catch (e) {}
    if (desde != null) { if (Number(v[i][5]) > desde) mud.push({ col: col, id: id, obj: o }); }
    else if (o) out[col][id] = o;
  }
  return desde != null ? mud : out;
}
function mkCarregar(pessoa, pin) {
  const eu = mkCheck_(pessoa, pin);
  return { eu: eu, equipe: mkEquipe_().map(mkPub_), dados: mkDocs_(null), chat: mkChatDesde_(0, 250), ver: mkLe_('MK_VER'), chatUlt: mkLe_('MK_CHAT'), agora: Date.now(), hoje: hoje_() };
}
function mkGrava_(col, id, obj, por) {
  const sh = mkSh_('MKT'), n = Math.max(sh.getLastRow() - 1, 0), ms = Math.max(Date.now(), mkLe_('MK_VER') + 1);
  const chaves = n ? sh.getRange(2, 1, n, 2).getValues() : [];
  let row = -1; for (let i = 0; i < chaves.length; i++) if (chaves[i][0] === col && String(chaves[i][1]) === id) { row = i + 2; break; }
  const json = obj == null ? 'null' : JSON.stringify(obj);
  if (json.length > 48000) throw new Error('Registro grande demais.');
  const linha = [[col, id, json, hoje_() + ' ' + agora_(), por, String(ms)]];
  if (row > 0) sh.getRange(row, 1, 1, 6).setNumberFormat('@').setValues(linha); else sh.getRange(sh.getLastRow() + 1, 1, 1, 6).setNumberFormat('@').setValues(linha);
  mkMarca_('MK_VER', ms);
  return ms;
}
function mkLer_(col, id) { const sh = mkSh_('MKT'), v = sh.getDataRange().getValues(); for (let i = 1; i < v.length; i++) if (v[i][0] === col && String(v[i][1]) === id) { try { return JSON.parse(v[i][2]); } catch (e) { return null; } } return null; }
function mkSalvar(pessoa, pin, col, id, obj, ev) {
  const eu = mkCheck_(pessoa, pin);
  if (MK_COLECOES.indexOf(col) < 0) throw new Error('Coleção inválida.');
  if ((MK_SO_GESTOR.indexOf(col) >= 0 || obj == null) && !eu.gestor) throw new Error('Só a gestão pode fazer isso.');
  id = String(id || '').slice(0, 80); if (!id) throw new Error('Registro sem id.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  let msg = null;
  try { mkGrava_(col, id, obj, eu.id); if (ev && ev.texto) msg = mkEvento_(eu.id, ev.tipo || 'evento', ev.texto, ev.ref || (col === 'cards' ? id : ''), ev.alvo, ev.extra); } finally { lock.releaseLock(); }
  return { ok: true, msg: msg };
}
/* altera só alguns campos (e acrescenta itens em listas) sem apagar o que outra pessoa mudou ao mesmo tempo */
function mkPatch(pessoa, pin, col, id, patch, ev) {
  const eu = mkCheck_(pessoa, pin);
  if (MK_COLECOES.indexOf(col) < 0) throw new Error('Coleção inválida.');
  if (MK_SO_GESTOR.indexOf(col) >= 0 && !eu.gestor) throw new Error('Só a gestão pode fazer isso.');
  id = String(id == null ? '' : id).slice(0, 80); if (!id || id === 'null' || id === 'undefined') throw new Error('Registro sem id.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  let obj, msg = null;
  try {
    obj = mkLer_(col, id) || {};
    patch = patch || {};
    Object.keys(patch).forEach(k => {
      if (k === '__push') Object.keys(patch.__push).forEach(c => { obj[c] = (Array.isArray(obj[c]) ? obj[c] : []).concat([patch.__push[c]]); });
      else if (k === '__tira') Object.keys(patch.__tira).forEach(c => { obj[c] = (Array.isArray(obj[c]) ? obj[c] : []).filter(x => x && x.id !== patch.__tira[c]); });
      else if (k === '__muda') Object.keys(patch.__muda).forEach(c => { const m = patch.__muda[c]; obj[c] = (Array.isArray(obj[c]) ? obj[c] : []).map(x => x && x.id === m.id ? Object.assign({}, x, m) : x); });
      else if (patch[k] === null) delete obj[k]; else obj[k] = patch[k];
    });
    obj.atualizado = Date.now(); obj.atualizadoPor = eu.id;
    mkGrava_(col, id, obj, eu.id);
    if (ev && ev.texto) msg = mkEvento_(eu.id, ev.tipo || 'evento', ev.texto, ev.ref || (col === 'cards' ? id : ''), ev.alvo, ev.extra);
  } finally { lock.releaseLock(); }
  return { obj: obj, msg: msg };
}
/* pulso: o app pergunta a cada poucos segundos; se nada mudou, responde na hora sem abrir a planilha */
function mkPulso(pessoa, pin, desdeChat, ver) {
  mkCheck_(pessoa, pin);
  const chatUlt = mkLe_('MK_CHAT'), verUlt = mkLe_('MK_VER'), out = { agora: Date.now(), ver: verUlt, chatUlt: chatUlt };
  if (Number(desdeChat || 0) < chatUlt) out.chat = mkChatDesde_(Number(desdeChat || 0), 150);
  if (Number(ver || 0) < verUlt){ out.docs = mkDocs_(Number(ver || 0)); out.equipe = mkEquipe_().map(mkPub_); }
  return out;
}
function mkChat(pessoa, pin, texto, ref, tipo, alvo, extra) {
  const eu = mkCheck_(pessoa, pin);
  texto = limpa_(texto, 2000); if (!texto) throw new Error('Mensagem vazia.');
  tipo = ['msg', 'alerta', 'ciente', 'sos', 'evento', 'aviso'].indexOf(tipo) >= 0 ? tipo : 'msg';
  if ((tipo === 'alerta' || tipo === 'aviso') && !eu.gestor) tipo = 'msg';
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try { return mkEvento_(eu.id, tipo, texto, ref, alvo, extra); } finally { lock.releaseLock(); }
}
function mkArquivo(pessoa, pin, b64, mime, nome) {
  const eu = mkCheck_(pessoa, pin);
  if (!b64) throw new Error('Arquivo vazio.');
  if (String(b64).length > 36 * 1024 * 1024) throw new Error('Arquivo grande demais para subir pelo app (máx. 25 MB). Mande o link do Drive ou WeTransfer.');
  const pasta = pasta_('MKT_FOLDER', 'MKT Maribondo — entregas (app)');
  const arq = pasta.createFile(Utilities.newBlob(Utilities.base64Decode(b64), String(mime || 'application/octet-stream'), (limpa_(nome, 120) || 'arquivo') + ''));
  try { arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { Logger.log(e); }
  try { arq.setDescription('Enviado por ' + eu.nome + ' em ' + hoje_() + ' ' + agora_()); } catch (e) {}
  const id = arq.getId();
  return { id: id, url: 'https://drive.google.com/file/d/' + id + '/view', down: 'https://drive.google.com/uc?export=download&id=' + id, thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000', nome: limpa_(nome, 120) || 'arquivo', mime: String(mime || '') };
}
function mkEquipeSalvar(pessoa, pin, id, d) {
  const eu = mkGestor_(pessoa, pin);
  d = d || {}; id = String(id || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
  if (!id) throw new Error('Informe um identificador.');
  const sh = mkSh_('MKTEquipe'), lista = mkEquipe_(), r = lista.find(x => x.id === id);
  const pinNovo = d.pin != null ? String(d.pin).replace(/\D/g, '').slice(0, 8) : null;
  if (pinNovo && pinNovo.length < 4) throw new Error('A senha precisa ter pelo menos 4 números.');
  if (d.foto && String(d.foto).length > 40000) throw new Error('Foto grande demais.');
  const linha = [id, limpa_(d.nome != null ? d.nome : (r ? r.nome : id), 60), pinNovo != null ? pinNovo : (r ? r.pin : ''),
    eu.id === MA_DONO && d.gestor != null ? (d.gestor ? 'sim' : '') : (r ? r.gestor : ''), limpa_(d.funcoes != null ? d.funcoes : (r ? r.funcoes : ''), 160),
    String(d.zap != null ? d.zap : (r ? r.zap : '')).replace(/[^\d+]/g, '').slice(0, 20), d.foto != null ? String(d.foto) : (r ? r.foto : ''),
    d.ativo != null ? (d.ativo ? 'sim' : 'nao') : (r ? r.ativo : 'sim'), String(d.cor || (r ? r.cor : '#111111')).slice(0, 9)];
  if (id === MA_DONO) linha[3] = 'sim';
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try { if (r) sh.getRange(r._row, 1, 1, 9).setNumberFormat('@').setValues([linha]); else sh.appendRow(linha); mkMarca_('MK_VER', Date.now()); } finally { lock.releaseLock(); }
  return mkEquipe_().map(mkPub_);
}
function mkMeuPerfil(pessoa, pin, d) {
  const eu = mkCheck_(pessoa, pin); d = d || {};
  const sh = mkSh_('MKTEquipe'), r = mkEquipe_().find(x => x.id === eu.id);
  if (d.foto != null) { if (String(d.foto).length > 40000) throw new Error('Foto grande demais.'); sh.getRange(r._row, 7).setValue(String(d.foto)); }
  if (d.zap != null) sh.getRange(r._row, 6).setNumberFormat('@').setValue(String(d.zap).replace(/[^\d+]/g, '').slice(0, 20));
  if (d.pinNovo) { const p = String(d.pinNovo).replace(/\D/g, ''); if (p.length < 4) throw new Error('A senha precisa ter pelo menos 4 números.'); sh.getRange(r._row, 3).setNumberFormat('@').setValue(p); }
  mkMarca_('MK_VER', Date.now());
  return mkEquipe_().map(mkPub_);
}

/* ================================================================== */
/* PAINEL AO VIVO DA ONG — números do dia, metas, relatório semanal    */
/* ================================================================== */
HEAD.Padrinhos = ['id', 'dia', 'hora', 'nome', 'telefone', 'valor', 'forma', 'obs', 'por'];
const PAINEL_METAS_PADRAO = { cadastros: 5, atendimentos: 10, presentes: 40, entradas: 30, padrinhos: 1 };
function painelCalc_() {
  const cache = CacheService.getScriptCache();
  try { const c = cache.get('PAINEL_V1'); if (c) return JSON.parse(c); } catch (e) {}
  const hj = hoje_(), ini = isoAdd_(hj, -41), dias = [];
  for (let d = ini; d <= hj; d = isoAdd_(d, 1)) dias.push(d);
  const z = () => { const o = {}; dias.forEach(d => o[d] = 0); return o; };
  const S = { cadastros: z(), atendimentos: z(), presentes: z(), entradas: z(), padrinhos: z() }, valor = z();
  const semIni = isoAdd_(hj, -((new Date(hj + 'T12:00:00').getDay() + 6) % 7)), semAnt = isoAdd_(semIni, -7);
  const temas = {}, temasHoje = {}, progs = {}, progsHoje = {}, PN = {};
  PROGRAMAS.forEach(p => { PN[p.k] = p.t; progs[p.t] = 0; progsHoje[p.t] = 0; });
  let membros = 0, padTotal = 0;
  rows_('Membros').forEach(m => { if (!m.num) return; membros++; const d = String(m.criado || '').slice(0, 10); if (d in S.cadastros) S.cadastros[d]++; });
  rows_('Atendimentos').forEach(a => { if (!(a.dia in S.atendimentos)) return; S.atendimentos[a.dia]++; const t = a.tema || 'Outro';
    if (a.dia >= semIni) temas[t] = (temas[t] || 0) + 1; if (a.dia === hj) temasHoje[t] = (temasHoje[t] || 0) + 1; });
  rows_('Presencas').forEach(p => { if (p.presente !== 'sim' || !(p.dia in S.presentes)) return; S.presentes[p.dia]++; const t = PN[p.programa] || p.programa;
    if (p.dia >= semIni) progs[t] = (progs[t] || 0) + 1; if (p.dia === hj) progsHoje[t] = (progsHoje[t] || 0) + 1; });
  rows_('PresencaMembros').forEach(p => { if (p.dia in S.entradas) S.entradas[p.dia]++; });
  rows_('Padrinhos').forEach(p => { if (!p.id) return; padTotal++; if (p.dia in S.padrinhos) { S.padrinhos[p.dia]++; valor[p.dia] += Number(String(p.valor || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0; } });
  const soma = (o, a, b) => Object.keys(o).filter(d => d >= a && d <= b).reduce((s, d) => s + o[d], 0);
  const semana = {}; Object.keys(S).forEach(k => { semana[k] = { atual: soma(S[k], semIni, hj), anterior: soma(S[k], semAnt, isoAdd_(semIni, -1)) }; });
  const out = { atualizado: hj + ' ' + agora_(), hoje: hj, semIni: semIni, dias: dias, series: S, valorPadrinhos: valor, semana: semana, temasSemana: temas, temasHoje: temasHoje,
    progsSemana: progs, progsHoje: progsHoje, totais: { membros: membros, padrinhos: padTotal }, metas: Object.assign({}, PAINEL_METAS_PADRAO, cfg_('metasPainel', {}) || {}), organograma: organograma_() };
  try { cache.put('PAINEL_V1', JSON.stringify(out), 20); } catch (e) {}
  return out;
}
function organograma_() {
  const salvo = cfg_('organograma', null);
  if (salvo && salvo.length) return salvo;
  const eq = rows_('Equipe').filter(e => e.id && e.id !== 'teste');
  return eq.map(e => ({ id: e.id, nome: e.nome, cor: e.cor, cargo: e.id === 'victor' ? 'Presidência · Coordenação geral' : e.id === 'lucas' ? 'Coordenação' : 'Equipe', pai: e.id === 'victor' ? '' : e.id === 'lucas' ? 'victor' : (eq.some(x => x.id === 'lucas') ? 'lucas' : 'victor') }));
}
function painelAoVivo(pessoa, pin) { checkPin_(pessoa, pin); const d = painelCalc_(); d.gestor = GESTORES.indexOf(pessoa) >= 0; return d; }
/* versão pública (link sem senha): só números, sem nomes de atendidos nem valores de doação */
function painelPublico() { const d = JSON.parse(JSON.stringify(painelCalc_())); delete d.valorPadrinhos; d.organograma = (d.organograma || []).map(n => ({ id: n.id, nome: String(n.nome || '').split(' ')[0], cargo: n.cargo, pai: n.pai, cor: n.cor })); return d; }
function salvarMetasPainel(pessoa, pin, m) { checkGestor_(pessoa, pin); const o = {}; Object.keys(PAINEL_METAS_PADRAO).forEach(k => { const v = Number((m || {})[k]); if (v >= 0 && v < 100000) o[k] = Math.round(v); }); cfgSet_('metasPainel', o, pessoa); try { CacheService.getScriptCache().remove('PAINEL_V1'); } catch (e) {} return painelAoVivo(pessoa, pin); }
function salvarOrganograma(pessoa, pin, nos) {
  checkGestor_(pessoa, pin);
  if (!Array.isArray(nos) || nos.length > 80) throw new Error('Organograma inválido.');
  const L = nos.map(n => ({ id: String(n.id || '').slice(0, 40), nome: limpa_(n.nome, 60), cargo: limpa_(n.cargo, 80), pai: String(n.pai || '').slice(0, 40), cor: String(n.cor || '').slice(0, 9) })).filter(n => n.id && n.nome);
  cfgSet_('organograma', L, pessoa); try { CacheService.getScriptCache().remove('PAINEL_V1'); } catch (e) {}
  return L;
}
function addPadrinho(pessoa, pin, d) {
  checkPin_(pessoa, pin); d = d || {};
  const nome = limpa_(d.nome, 80); if (!nome) throw new Error('Informe o nome do padrinho ou madrinha.');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { sheet_('Padrinhos').appendRow(['pd' + Date.now().toString(36), hoje_(), agora_(), nome, String(d.telefone || '').replace(/[^\d+]/g, '').slice(0, 20), limpa_(d.valor, 20), limpa_(d.forma, 40), limpa_(d.obs, 200), pessoa]); } finally { lock.releaseLock(); }
  try { CacheService.getScriptCache().remove('PAINEL_V1'); } catch (e) {}
  try { evento_('padrinho', pessoa, '💛 Novo padrinho/madrinha: ' + nome.split(' ')[0] + '! Obrigado por fortalecer a ONG.', 'todos'); } catch (e) {}
  return painelAoVivo(pessoa, pin);
}
function padrinhosLista(pessoa, pin) { checkGestor_(pessoa, pin); return rows_('Padrinhos').filter(p => p.id).slice(-200).reverse(); }

/* ================================================================== */
/* FINANCEIRO DA ONG — folha prevista x paga, lançamentos, comprovantes */
/* ================================================================== */
HEAD.Lancamentos = ['id', 'mes', 'dia', 'tipo', 'categoria', 'descricao', 'pessoa', 'valor', 'forma', 'status', 'comprovante', 'comp_mime', 'obs', 'por', 'criado'];
const FIN_CATS = { entrada: ['Padrinhos e madrinhas', 'Doação avulsa', 'Edital / projeto', 'Evento', 'Bazar / vendas', 'Outras entradas'], saida: ['Folha', 'Alimentação (sopa)', 'Material', 'Transporte', 'Contas (água, luz, internet)', 'Aluguel', 'Manutenção', 'Comunicação / MKT', 'Outras saídas'] };
function finNum_(v) { let t = String(v == null ? '' : v).replace(/[^\d,.-]/g, ''); if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(/,/g, ''); return Math.round((Number(t) || 0) * 100) / 100; }
function financeiro(pessoa, pin, mes) {
  checkDono_(pessoa, pin);
  mes = /^\d{4}-\d{2}$/.test(String(mes || '')) ? mes : hoje_().slice(0, 7);
  const equipe = rows_('Equipe').filter(e => e.id && PRIVADOS.indexOf(e.id) < 0).map(e => ({ id: e.id, nome: e.nome }));
  const fol = {}; rows_('Folha').forEach(x => fol[x.pessoa] = { funcao: x.funcao, valor: finNum_(x.valor), data: x.data_pagamento, adicoes: x.adicoes });
  const L = rows_('Lancamentos').filter(l => l.id && l.mes === mes).map(l => ({ id: l.id, dia: l.dia, tipo: l.tipo, categoria: l.categoria, descricao: l.descricao, pessoa: l.pessoa, valor: finNum_(l.valor), forma: l.forma, status: l.status, temComp: !!l.comprovante, obs: l.obs, por: l.por, criado: l.criado }));
  const folha = equipe.map(e => { const f = fol[e.id] || {}; const pg = L.filter(l => l.tipo === 'saida' && l.categoria === 'Folha' && l.pessoa === e.id && l.status === 'pago');
    const pago = pg.reduce((s, l) => s + l.valor, 0); return { id: e.id, nome: e.nome, funcao: f.funcao || '', previsto: f.valor || 0, data: f.data || '', adicoes: f.adicoes || '', pago: Math.round(pago * 100) / 100, pagamentos: pg }; });
  const pad = rows_('Padrinhos').filter(p => p.id && String(p.dia).slice(0, 7) === mes).map(p => ({ dia: p.dia, nome: p.nome, valor: finNum_(p.valor), forma: p.forma }));
  const soma = (arr, f) => Math.round(arr.reduce((s, x) => s + (f ? f(x) : x), 0) * 100) / 100;
  const entradasL = L.filter(l => l.tipo === 'entrada' && l.status === 'pago'), saidasL = L.filter(l => l.tipo === 'saida' && l.status === 'pago');
  const tot = { folhaPrevista: soma(folha, f => f.previsto), folhaPaga: soma(folha, f => f.pago) };
  tot.folhaAPagar = Math.max(0, Math.round((tot.folhaPrevista - tot.folhaPaga) * 100) / 100);
  tot.padrinhosNovos = soma(pad, p => p.valor); tot.entradas = soma(entradasL, l => l.valor); tot.saidas = soma(saidasL, l => l.valor);
  tot.saldo = Math.round((tot.entradas - tot.saidas) * 100) / 100;
  tot.aPagarOutros = soma(L.filter(l => l.tipo === 'saida' && l.status === 'previsto'), l => l.valor); tot.aReceber = soma(L.filter(l => l.tipo === 'entrada' && l.status === 'previsto'), l => l.valor);
  const porCat = {}; L.filter(l => l.status === 'pago').forEach(l => { const k = l.tipo + '|' + l.categoria; porCat[k] = Math.round(((porCat[k] || 0) + l.valor) * 100) / 100; });
  return { mes: mes, folha: folha, lancamentos: L.sort((a, b) => String(b.dia).localeCompare(String(a.dia))), padrinhos: pad, totais: tot, porCategoria: porCat, categorias: FIN_CATS, ong: 'ONG Amigos de Maribondo' };
}
function finSalvarComp_(b64, mime, nome) {
  if (!b64) return '';
  if (String(b64).length > 14 * 1024 * 1024) throw new Error('Comprovante grande demais (máx. 10 MB).');
  const pasta = pasta_('FIN_FOLDER', 'ONG — Comprovantes financeiros (app, privado)');
  return pasta.createFile(Utilities.newBlob(Utilities.base64Decode(b64), String(mime || 'image/jpeg'), limpa_(nome, 100) || ('comprovante ' + hoje_()))).getId();
}
function addLancamento(pessoa, pin, d) {
  checkDono_(pessoa, pin); d = d || {};
  const tipo = d.tipo === 'entrada' ? 'entrada' : 'saida', valor = finNum_(d.valor);
  if (!(valor > 0)) throw new Error('Informe o valor.');
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(d.dia || '')) ? d.dia : hoje_();
  const mes = /^\d{4}-\d{2}$/.test(String(d.mes || '')) ? d.mes : dia.slice(0, 7);
  if (tipo === 'saida' && d.categoria === 'Folha' && !rows_('Equipe').some(e => e.id === d.pessoa)) throw new Error('Escolha quem recebeu.');
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const comp = finSalvarComp_(d.compB64, d.compMime, d.compNome);
    sheet_('Lancamentos').appendRow(['l' + Date.now().toString(36), mes, dia, tipo, limpa_(d.categoria, 60) || (tipo === 'entrada' ? 'Outras entradas' : 'Outras saídas'), limpa_(d.descricao, 200), String(d.pessoa || '').slice(0, 30), String(valor), limpa_(d.forma, 30), d.status === 'previsto' ? 'previsto' : 'pago', comp, comp ? String(d.compMime || 'image/jpeg') : '', limpa_(d.obs, 200), pessoa, hoje_() + ' ' + agora_()]);
  } finally { lock.releaseLock(); }
  return financeiro(pessoa, pin, mes);
}
function marcarLancamento(pessoa, pin, id, d) {
  checkDono_(pessoa, pin); d = d || {};
  const r = rows_('Lancamentos').find(x => x.id === id); if (!r) throw new Error('Lançamento não encontrado.');
  const o = {}; if (d.status) o.status = d.status === 'previsto' ? 'previsto' : 'pago'; if (d.dia) o.dia = d.dia;
  if (d.compB64) { o.comprovante = finSalvarComp_(d.compB64, d.compMime, d.compNome); o.comp_mime = String(d.compMime || 'image/jpeg'); }
  upsert_('Lancamentos', id, o);
  return financeiro(pessoa, pin, r.mes);
}
function delLancamento(pessoa, pin, id) {
  checkDono_(pessoa, pin);
  const sh = sheet_('Lancamentos'), v = sh.getDataRange().getDisplayValues(); let mes = '';
  for (let i = 1; i < v.length; i++) if (v[i][0] === id) { mes = v[i][1]; sh.deleteRow(i + 1); break; }
  return financeiro(pessoa, pin, mes);
}
function verComprovante(pessoa, pin, id) {
  checkDono_(pessoa, pin);
  const r = rows_('Lancamentos').find(x => x.id === id); if (!r || !r.comprovante) throw new Error('Sem comprovante.');
  const f = DriveApp.getFileById(r.comprovante);
  return { b64: Utilities.base64Encode(f.getBlob().getBytes()), mime: r.comp_mime || f.getMimeType(), nome: f.getName() };
}

/* ================================================================== */
/* v52 · Sequência de tarefa no próximo turno + programação com aprovação */
/* ================================================================== */
function proximoPeriodo_(pessoa, depoisDT) {
  let d = depoisDT.slice(0, 10), depois = mins_(depoisDT.slice(11));
  const tarefas = rows_('Tarefas'), hor = rows_('Horarios');
  for (let i = 0; i < 10; i++) {
    const e = esperados_(d, tarefas, hor)[pessoa];
    const p = e ? e.periodos.find(x => x.a >= depois) : null;
    if (p) return { dia: d, a: p.a, b: p.b };
    d = isoAdd_(d, 1); depois = 0;
  }
  return null;
}
/* gestor pede para continuar a tarefa no próximo turno de quem fez (reforço) */
function sequenciaTarefa(pessoa, pin, dia, bloco, obs) {
  checkGestor_(pessoa, pin);
  const tar = rows_('Tarefas').find(x => x.dia === dia && x.id === bloco);
  if (!tar) throw new Error('Tarefa não encontrada.');
  const pes = pessoasTarefa_(tar); if (!pes.length) throw new Error('Tarefa sem responsável.');
  const per = proximoPeriodo_(pes[0], hoje_() + ' ' + agora_());
  if (!per) throw new Error('Não achei o próximo turno dessa pessoa. Confira os horários na Gestão.');
  const dur = Math.max(30, (hm_(tar.fim || fimTarefa_(tar)) || 0) - (hm_(tar.hora) || 0));
  const ini = per.a, fim = Math.min(per.b, ini + Math.min(dur, 240));
  const titulo = '🔁 Sequência: ' + String(tar.titulo).replace(/^🔁 Sequência:\s*/, '');
  const itens = [limpa_(obs, 200) || 'Continuar de onde parou', 'Origem: ' + nomeDia_(dia) + ' ' + tar.hora].join(' | ');
  const id = 's' + Date.now().toString(36);
  const row = [per.dia, id, hhmm_(ini), String(ini), ini < 12 * 60 ? 'manha' : 'tarde', titulo, pes.join(','), itens, tar.metas || '', tar.atividade || 'não', hhmm_(fim)];
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { const sh = ss_().getSheetByName('Tarefas'); sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setNumberFormat('@').setValues([row]); if (RC_) delete RC_.Tarefas; }
  finally { lock.releaseLock(); }
  const quando = (per.dia === hoje_() ? 'hoje' : nomeDia_(per.dia)) + ' às ' + hhmm_(ini);
  pes.forEach(p => { try { evento_('reforco', pessoa, '🔁 Reforço: continuar "' + tar.titulo + '" no próximo turno (' + quando + ').' + (obs ? ' ' + limpa_(obs, 120) : ''), 'pessoa', id, p); } catch (e) {} });
  return { dia: per.dia, hora: hhmm_(ini), fim: hhmm_(fim), quando: quando, titulo: titulo };
}
/* programação: propõe os próximos dias a partir do mesmo dia da semana anterior (ou do último dia com tarefas) */
function modeloDia_(dia, todas) {
  const tem = d => todas.some(t => t.dia === d && !/^teste/.test(t.id));
  for (let k = 1; k <= 4; k++) { const d = isoAdd_(dia, -7 * k); if (tem(d)) return d; }
  for (let k = 1; k <= 14; k++) { const d = isoAdd_(dia, -k), w = new Date(d + 'T12:00:00').getDay(); if (w !== 0 && w !== 6 && tem(d)) return d; }
  return '';
}
function modeloLista_(todas, mod) { return todas.filter(t => t.dia === mod && !/^teste/.test(t.id) && !/^🔁 Sequência/.test(t.titulo)).sort((a, b) => Number(a.ordem) - Number(b.ordem) || String(a.hora).localeCompare(String(b.hora)) || String(a.titulo).localeCompare(String(b.titulo))); }
function previaProgramacao(pessoa, pin, dias) {
  checkGestor_(pessoa, pin);
  const todas = rows_('Tarefas');
  return (dias || []).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(0, 14).map(dia => {
    const mod = modeloDia_(dia, todas), ja = todas.filter(t => t.dia === dia);
    const prop = mod ? modeloLista_(todas, mod)
      .map((t, i) => ({ id: t.id, k: String(i), hora: t.hora, fim: t.fim || fimTarefa_(t), turno: t.turno, titulo: t.titulo, pessoas: pessoasTarefa_(t), itens: t.itens, dup: ja.some(x => x.titulo === t.titulo && x.hora === t.hora) })) : [];
    return { dia: dia, nome: nomeDia_(dia), modelo: mod, modeloNome: mod ? nomeDia_(mod) : '', existentes: ja.length, tarefas: prop };
  });
}
function aplicarProgramacao(pessoa, pin, plano) {
  checkGestor_(pessoa, pin);
  const todas = rows_('Tarefas'), rows = [];
  (plano || []).forEach(p => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dia || '') || !p.modelo) return;
    const ja = todas.filter(t => t.dia === p.dia), ids = {}; ja.forEach(t => ids[t.id] = 1);
    modeloLista_(todas, p.modelo).filter((t, i) => (p.ks || []).indexOf(String(i)) >= 0).forEach(t => {
      if (ja.some(x => x.titulo === t.titulo && x.hora === t.hora)) return;
      const id = ids[t.id] ? t.id + 'p' + rows.length : t.id; ids[id] = 1;
      rows.push([p.dia, id, t.hora, t.ordem, t.turno, t.titulo, t.pessoas, t.itens, t.metas, t.atividade, t.fim || fimTarefa_(t)]);
    });
  });
  if (rows.length) {
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try { const sh = ss_().getSheetByName('Tarefas'); sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setNumberFormat('@').setValues(rows); if (RC_) delete RC_.Tarefas; }
    finally { lock.releaseLock(); }
    const dias = [...new Set(rows.map(r => r[0]))].map(nomeDia_).join(', ');
    try { evento_('programacao', pessoa, '🗓️ Programação publicada: ' + dias + '. Confira suas atividades.', 'todos'); } catch (e) {}
  }
  return { criadas: rows.length };
}
