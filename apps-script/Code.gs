/**
 * Registro de cliques dos sites de leads, em uma única planilha.
 *
 * Recebe dois formatos e grava as duas origens nas MESMAS colunas:
 *  - POST com JSON e token (site do guincho)
 *  - GET com parâmetros na URL (sites gerados pelo AI Studio)
 *
 * Como atualizar:
 * 1. Extensões > Apps Script, apague todo o código e cole este.
 * 2. Execute a função setup() uma vez (cria o cabeçalho e a aba Resumo).
 * 3. Se já existem linhas desalinhadas, execute migrarLinhasAntigas() uma vez.
 * 4. Implantar > Gerenciar implantações > editar (lápis) > Versão: Nova versão > Implantar. A URL /exec continua a mesma.
 * 5. Confira: abra a URL /exec no navegador. Deve aparecer "ok v2". Se aparecer "ok", a versão antiga ainda está no ar.
 */

const VERSAO = 'ok v2';
const TOKEN = '479479';
const FUSO = 'America/Sao_Paulo';
const CAB = ['Data e hora', 'Dia', 'Hora', 'Dia da semana', 'Site', 'Botão', 'Posição',
  'Página', 'Origem', 'Meio', 'Campanha', 'Termo', 'Dispositivo', 'Veio de anúncio',
  'Tela', 'Idioma', 'Sessão', 'Mensagem', 'Nicho'];
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'];

/* ---------- configuração ---------- */

function cabecalho_(sh) {
  sh.getRange(1, 1, 1, CAB.length).setValues([CAB])
    .setFontWeight('bold').setBackground('#1F3864').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sh.getRange('B:B').setNumberFormat('@');
}

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Cliques');
  if (!sh) sh = ss.insertSheet('Cliques');
  if (sh.getLastRow() === 0) cabecalho_(sh);
  return sh;
}

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(FUSO);

  const sh = aba_();
  cabecalho_(sh);

  const rs = ss.getSheetByName('Resumo') || ss.insertSheet('Resumo');
  rs.clear();
  rs.getRange('A1').setValue('Cliques por dia e por botão').setFontWeight('bold');
  rs.getRange('A2').setFormula(
    `=QUERY(Cliques!A2:S, "select B, count(B) where B is not null group by B pivot F order by B desc label B 'Dia'", 0)`);
  rs.getRange('G1').setValue('Cliques por hora do dia').setFontWeight('bold');
  rs.getRange('G2').setFormula(
    `=QUERY(Cliques!A2:S, "select C, count(C) where C is not null group by C order by C label C 'Hora', count(C) 'Cliques'", 0)`);
  rs.getRange('M1').setValue('Cliques por site e por botão').setFontWeight('bold');
  rs.getRange('M2').setFormula(
    `=QUERY(Cliques!A2:S, "select E, count(E) where E is not null group by E pivot F order by E label E 'Site'", 0)`);
}

/* ---------- padronização dos valores ---------- */

function limpa_(v) {
  const s = String(v == null ? '' : v).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function botao_(v) {
  const s = String(v || '').toLowerCase().trim();
  if (/whats|zap|wpp/.test(s)) return 'whatsapp';
  if (/lig|tel|call|fone/.test(s)) return 'ligar';
  return s;
}

function origem_(v) {
  const s = String(v || '').trim();
  if (!s) return 'direto';
  const m = s.match(/^https?:\/\/([^\/]+)/i);
  return m ? m[1].replace(/^www\./, '') : s;
}

function anuncio_(v) {
  const s = String(v == null ? '' : v).trim();
  return s && !/^(n[aã]o|false|0)$/i.test(s) ? 'sim' : 'não';
}

/* ---------- gravação ---------- */

// d aceita os nomes dos dois formatos (botao/acao, posicao/local, meio/utm_medium...)
function registrar_(d) {
  const agora = new Date();
  const linha = [
    agora,
    Utilities.formatDate(agora, FUSO, 'yyyy-MM-dd'),
    Number(Utilities.formatDate(agora, FUSO, 'H')),
    SEMANA[Number(Utilities.formatDate(agora, FUSO, 'u')) % 7],
    limpa_(d.site),
    botao_(d.botao || d.acao),
    limpa_(d.posicao || d.local),
    limpa_(d.pagina),
    limpa_(origem_(d.origem)),
    limpa_(d.meio || d.utm_medium),
    limpa_(d.campanha || d.utm_campaign),
    limpa_(d.termo || d.utm_term),
    limpa_(d.dispositivo),
    anuncio_(d.anuncio || d.gclid),
    limpa_(d.tela),
    limpa_(d.idioma),
    limpa_(d.sessao),
    limpa_(d.detalhe || d.mensagem),
    limpa_(d.nicho)
  ];
  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    aba_().appendRow(linha);
  } finally {
    trava.releaseLock();
  }
}

// Sites gerados pelo AI Studio (parâmetros na URL)
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.acao || p.botao) registrar_(p);
    return ContentService.createTextOutput(VERSAO);
  } catch (err) {
    return ContentService.createTextOutput('erro');
  }
}

// Site do guincho (JSON com token). Sem JSON, aceita parâmetros como o GET.
function doPost(e) {
  try {
    const bruto = e && e.postData && e.postData.contents;
    let d = null;
    try { d = bruto ? JSON.parse(bruto) : null; } catch (x) { d = null; }
    if (d && typeof d === 'object') {
      if (d.token !== TOKEN) return ContentService.createTextOutput('negado');
      registrar_(d);
    } else {
      return doGet(e);
    }
    return ContentService.createTextOutput(VERSAO);
  } catch (err) {
    return ContentService.createTextOutput('erro');
  }
}

/* ---------- conserto das linhas antigas ---------- */

// Linhas gravadas pelo formato antigo dos sites novos (data e hora separadas, nicho na coluna D).
// Cria uma cópia de segurança da aba antes de mexer e é seguro rodar mais de uma vez.
function migrarLinhasAntigas() {
  const sh = aba_();
  const ss = sh.getParent();
  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const larg = CAB.length;
  const rng = sh.getRange(2, 1, n, larg);
  const val = rng.getValues();
  const vis = rng.getDisplayValues();
  let migradas = 0, falhas = 0;

  const novo = val.map(function (r, i) {
    const antiga = SEMANA.indexOf(String(r[3])) === -1 && /^(whatsapp|ligar)$/i.test(String(r[4]));
    if (!antiga) return r;
    const dt = dataAntiga_(vis[i][0], vis[i][1]);
    if (!dt) { falhas++; return r; }
    migradas++;
    return [
      dt,
      Utilities.formatDate(dt, FUSO, 'yyyy-MM-dd'),
      Number(Utilities.formatDate(dt, FUSO, 'H')),
      SEMANA[Number(Utilities.formatDate(dt, FUSO, 'u')) % 7],
      limpa_(r[2]),            // site
      botao_(r[4]),            // botão (era "ação")
      limpa_(r[5]),            // posição (era "local do botão")
      limpa_(r[6]),            // página
      limpa_(origem_(r[8])),   // origem
      limpa_(r[10]),           // meio (utm_medium)
      limpa_(r[11]),           // campanha
      limpa_(r[12]),           // termo
      limpa_(r[14]),           // dispositivo
      anuncio_(r[13]),         // veio de anúncio
      limpa_(r[15]),           // tela
      limpa_(r[16]),           // idioma
      limpa_(r[17]),           // sessão
      limpa_(r[18]),           // mensagem
      limpa_(r[3])             // nicho
    ];
  });

  if (migradas === 0) {
    ss.toast('Nenhuma linha antiga encontrada. Falhas: ' + falhas, 'Migração', 8);
    return;
  }
  sh.copyTo(ss).setName('Backup Cliques ' + Utilities.formatDate(new Date(), FUSO, 'dd-MM HH-mm'));
  cabecalho_(sh);
  sh.getRange(2, 1, n, larg).setValues(novo);
  ss.toast('Linhas corrigidas: ' + migradas + '. Falhas: ' + falhas + '. Cópia de segurança criada.', 'Migração', 10);
}

function dataAntiga_(a, b) {
  const sa = String(a || '').trim(), sb = String(b || '').trim();
  let iso = null, m;
  if ((m = sa.match(/^(\d{2})\/(\d{2})\/(\d{4})/))) iso = m[3] + '-' + m[2] + '-' + m[1];
  else if ((m = sa.match(/^(\d{4})-(\d{2})-(\d{2})/))) iso = m[1] + '-' + m[2] + '-' + m[3];
  const t = sb.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!iso || !t) return null;
  const hora = ('0' + t[1]).slice(-2) + ':' + t[2] + ':' + (t[3] || '00');
  try {
    return Utilities.parseDate(iso + ' ' + hora, FUSO, 'yyyy-MM-dd HH:mm:ss');
  } catch (err) {
    return null;
  }
}
