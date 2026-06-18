/**
 * 多言語対応（i18n）。日本語/英語/スペイン語/フランス語/中国語/韓国語/ロシア語。
 * 軽量な辞書＋リアクティブな locale ストア。t(key, vars) で訳語を取得する。
 */

import { useSyncExternalStore } from "react";

// 辞書は多言語ぶん持つが、当面は日本語と英語のみ選択可能にする
export type Locale = "ja" | "en" | "es" | "fr" | "zh" | "ko" | "ru";

/** UIで選択できる言語（現在は日本語・英語のみ） */
export const LOCALES: Locale[] = ["ja", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  es: "Español",
  fr: "Français",
  zh: "中文",
  ko: "한국어",
  ru: "Русский",
};

type Dict = Record<Locale, string>;

/** 主要UIの訳語。{x} はプレースホルダ */
const STRINGS: Record<string, Dict> = {
  "title.name": { ja: "給料クエスト", en: "Salary Quest", es: "Misión Salario", fr: "Quête du Salaire", zh: "工资冒险", ko: "급여 퀘스트", ru: "Зарплата-Квест" },
  "title.sub": { ja: "今いくら稼いでる？", en: "How much are you earning?", es: "¿Cuánto estás ganando?", fr: "Combien gagnez-vous ?", zh: "你现在赚了多少？", ko: "지금 얼마 벌고 있어?", ru: "Сколько ты уже заработал?" },
  "title.new": { ja: "はじめから", en: "New Game", es: "Nueva partida", fr: "Nouvelle partie", zh: "重新开始", ko: "처음부터", ru: "Новая игра" },
  "title.continue": { ja: "つづきから", en: "Continue", es: "Continuar", fr: "Continuer", zh: "继续游戏", ko: "이어서 하기", ru: "Продолжить" },
  "title.confirmNew": { ja: "はじめから始めます。今のレベル・所持金・着せ替え・勤務履歴は消えます。よろしいですか？", en: "Start a new game? Your level, gold, costume and work history will be erased. OK?", es: "¿Empezar de nuevo? Se borrarán tu nivel, oro, traje e historial. ¿Continuar?", fr: "Nouvelle partie ? Votre niveau, or, costume et historique seront effacés. OK ?", zh: "重新开始？等级、金币、装扮和记录都会被清除。确定吗？", ko: "처음부터 시작할까요? 레벨·골드·코스튬·기록이 모두 삭제됩니다. 괜찮나요?", ru: "Начать заново? Уровень, золото, костюм и история будут удалены. Продолжить?" },
  "hint.move": { ja: "矢印キー / WASD で移動", en: "Move with arrow keys / WASD", es: "Muévete con flechas / WASD", fr: "Déplacez-vous avec les flèches / WASD", zh: "用方向键 / WASD 移动", ko: "방향키 / WASD 로 이동", ru: "Движение: стрелки / WASD" },
  "hint.moveTouch": { ja: "十字キーで移動", en: "Move with the D-pad", es: "Muévete con la cruceta", fr: "Déplacez-vous avec la croix", zh: "用十字键移动", ko: "십자 키로 이동", ru: "Движение: крестовина" },

  "prompt.workAsk": { ja: "ここで はたらきますか？", en: "Work here?", es: "¿Trabajar aquí?", fr: "Travailler ici ?", zh: "在这里工作吗？", ko: "여기서 일할까요?", ru: "Работать здесь?" },
  "btn.work": { ja: "はたらく！", en: "Work!", es: "¡Trabajar!", fr: "Travailler !", zh: "工作！", ko: "일하기!", ru: "Работать!" },
  "work.header": { ja: "はたらいています", en: "Working...", es: "Trabajando...", fr: "Au travail...", zh: "工作中...", ko: "일하는 중...", ru: "Работаю..." },
  "work.income": { ja: "しょとく", en: "Income", es: "Ingresos", fr: "Revenu", zh: "收入", ko: "수입", ru: "Доход" },
  "work.saved": { ja: "{n} G ためた", en: "Earned {n} G", es: "{n} G ganados", fr: "{n} G gagnés", zh: "已赚 {n} G", ko: "{n} G 모음", ru: "Накоплено {n} G" },
  "work.nextLevel": { ja: "つぎのレベルまで あと {n}", en: "{n} to next level", es: "{n} para subir de nivel", fr: "{n} avant le niveau suivant", zh: "距离升级还差 {n}", ko: "다음 레벨까지 {n}", ru: "До след. уровня {n}" },
  "cmd.stopWork": { ja: "しごとを やめて まちに もどる", en: "Stop working and return to town", es: "Dejar de trabajar y volver al pueblo", fr: "Arrêter et retourner en ville", zh: "结束工作返回城镇", ko: "일을 끝내고 마을로", ru: "Закончить и вернуться в город" },

  "levelup.head": { ja: "＊「ゆうしゃ」は", en: "* The hero", es: "* El héroe", fr: "* Le héros", zh: "＊勇者", ko: "＊용사는", ru: "* Герой" },
  "levelup.toLevel": { ja: "レベル {n} に あがった！", en: "reached level {n}!", es: "¡subió al nivel {n}!", fr: "atteint le niveau {n} !", zh: "升到了等级 {n}！", ko: "레벨 {n} 이(가) 되었다!", ru: "достиг уровня {n}!" },
  "levelup.gotTitle": { ja: "「{rank}」になった！", en: 'Became "{rank}"!', es: '¡Ahora eres "{rank}"!', fr: 'Devenu "{rank}" !', zh: '成为了「{rank}」！', ko: '"{rank}" 이(가) 되었다!', ru: 'Стал "{rank}"!' },
  "levelup.gold": { ja: "💰 ゴールドを {n}G てにいれた！", en: "💰 Got {n} G!", es: "💰 ¡Conseguiste {n} G!", fr: "💰 {n} G obtenus !", zh: "💰 获得了 {n} G！", ko: "💰 골드 {n}G 획득!", ru: "💰 Получено {n} G!" },

  "shop.name": { ja: "どうぐ屋", en: "Item Shop", es: "Tienda", fr: "Boutique", zh: "道具店", ko: "도구점", ru: "Магазин" },
  "shop.keeper": { ja: "おつかれさまでした、今日は何をおかいもとめになりますか？", en: "Welcome back! What would you like to buy today?", es: "¡Bienvenido! ¿Qué desea comprar hoy?", fr: "Bonjour ! Que souhaitez-vous acheter aujourd'hui ?", zh: "辛苦了，今天想买点什么？", ko: "수고하셨습니다. 오늘은 무엇을 사시겠어요?", ru: "Здравствуйте! Что хотите купить сегодня?" },
  "shop.ask": { ja: "ゴールドで すがたを 変えられるよ！", en: "Change your look with gold!", es: "¡Cambia tu aspecto con oro!", fr: "Changez d'apparence avec de l'or !", zh: "用金币改变外形吧！", ko: "골드로 모습을 바꿀 수 있어!", ru: "Сменить облик за золото!" },
  "shop.enter": { ja: "店に入る", en: "Enter shop", es: "Entrar", fr: "Entrer", zh: "进入商店", ko: "가게에 들어가기", ru: "Войти в магазин" },
  "shop.exit": { ja: "店を出る", en: "Leave shop", es: "Salir", fr: "Sortir", zh: "离开商店", ko: "가게에서 나가기", ru: "Выйти" },

  "costume.title": { ja: "きせかえ", en: "Costume", es: "Disfraz", fr: "Costume", zh: "换装", ko: "옷 갈아입기", ru: "Костюм" },
  "costume.change": { ja: "すがたを かえる", en: "Change appearance", es: "Cambiar aspecto", fr: "Changer d'apparence", zh: "改变外形", ko: "모습 바꾸기", ru: "Сменить облик" },
  "costume.default": { ja: "もとの すがた", en: "Original look", es: "Aspecto original", fr: "Apparence d'origine", zh: "原本造型", ko: "기본 모습", ru: "Обычный вид" },
  "costume.equipped": { ja: "着用中", en: "Equipped", es: "Equipado", fr: "Équipé", zh: "使用中", ko: "착용 중", ru: "Надето" },
  "costume.equip": { ja: "着る", en: "Equip", es: "Equipar", fr: "Équiper", zh: "穿上", ko: "입기", ru: "Надеть" },
  "costume.revert": { ja: "もとに戻す", en: "Revert", es: "Revertir", fr: "Rétablir", zh: "还原", ko: "되돌리기", ru: "Вернуть" },
  "costume.buy": { ja: "{n}G で買う", en: "Buy for {n} G", es: "Comprar por {n} G", fr: "Acheter {n} G", zh: "{n}G 购买", ko: "{n}G 구매", ru: "Купить за {n} G" },

  "house.name": { ja: "わが家", en: "Home", es: "Casa", fr: "Maison", zh: "我家", ko: "우리 집", ru: "Дом" },
  "house.enter": { ja: "中に入る", en: "Enter", es: "Entrar", fr: "Entrer", zh: "进入", ko: "들어가기", ru: "Войти" },
  "house.enterAsk": { ja: "家で カレンダーと ノルマを 確認できる。", en: "Check your calendar and quota at home.", es: "Consulta el calendario y tu meta en casa.", fr: "Consultez le calendrier et l'objectif chez vous.", zh: "在家可以查看日历和目标。", ko: "집에서 달력과 목표를 확인할 수 있어.", ru: "Дома можно посмотреть календарь и цель." },
  "house.exit": { ja: "外に出る", en: "Go outside", es: "Salir", fr: "Sortir", zh: "出门", ko: "밖으로", ru: "Выйти" },
  "house.norma": { ja: "こんげつの ノルマ", en: "Monthly quota", es: "Meta mensual", fr: "Objectif mensuel", zh: "本月目标", ko: "이번 달 목표", ru: "Цель месяца" },
  "house.goal": { ja: "目標", en: "Goal", es: "Meta", fr: "Objectif", zh: "目标", ko: "목표", ru: "Цель" },
  "house.achieved": { ja: "🎉 ノルマ達成！", en: "🎉 Quota reached!", es: "🎉 ¡Meta alcanzada!", fr: "🎉 Objectif atteint !", zh: "🎉 达成目标！", ko: "🎉 목표 달성!", ru: "🎉 Цель достигнута!" },
  "house.remain": { ja: "あと {n}", en: "{n} to go", es: "Faltan {n}", fr: "Encore {n}", zh: "还差 {n}", ko: "{n} 남음", ru: "Осталось {n}" },
  "house.noGoal": { ja: "「ノルマを きめる」で月の目標を設定しよう。", en: 'Set a monthly goal in "Set goal".', es: 'Fija una meta mensual en "Definir meta".', fr: 'Définissez un objectif dans "Définir l\'objectif".', zh: '在「设定目标」里设置月目标吧。', ko: '"목표 정하기"에서 월 목표를 설정하세요.', ru: 'Задайте цель в "Задать цель".' },
  "house.setGoal": { ja: "ノルマを きめる", en: "Set goal", es: "Definir meta", fr: "Définir l'objectif", zh: "设定目标", ko: "목표 정하기", ru: "Задать цель" },
  "house.graph": { ja: "しゅうにゅうグラフ（6か月）", en: "Income (6 months)", es: "Ingresos (6 meses)", fr: "Revenus (6 mois)", zh: "收入（6个月）", ko: "수입 (6개월)", ru: "Доход (6 мес.)" },
  "house.calendar": { ja: "かせぎカレンダー", en: "Earnings calendar", es: "Calendario de ingresos", fr: "Calendrier des gains", zh: "收入日历", ko: "수입 달력", ru: "Календарь доходов" },
  "house.data": { ja: "データ", en: "Data", es: "Datos", fr: "Données", zh: "数据", ko: "데이터", ru: "Данные" },
  "data.csv": { ja: "📤 CSVで書き出す", en: "📤 Export CSV", es: "📤 Exportar CSV", fr: "📤 Exporter CSV", zh: "📤 导出 CSV", ko: "📤 CSV 내보내기", ru: "📤 Экспорт CSV" },
  "data.noRecord": { ja: "まだ収入の記録がありません。", en: "No income records yet.", es: "Aún no hay registros.", fr: "Aucun enregistrement pour l'instant.", zh: "还没有收入记录。", ko: "아직 수입 기록이 없습니다.", ru: "Пока нет записей о доходе." },

  "sign.title": { ja: "たてふだ", en: "Sign", es: "Cartel", fr: "Panneau", zh: "告示牌", ko: "푯말", ru: "Указатель" },
  "sign.text": { ja: "やあ ぼうけんしゃ！「¥バイト」に ちかづくと はたらけるぞ！", en: "Hey adventurer! Approach the workplace to start working!", es: "¡Hola aventurero! Acércate al trabajo para empezar.", fr: "Salut aventurier ! Approche-toi du travail pour commencer !", zh: "你好冒险者！靠近工作点就能工作了！", ko: "어이 모험가! 일터에 다가가면 일할 수 있어!", ru: "Эй, искатель! Подойди к месту работы, чтобы начать!" },

  "goal.month": { ja: "月の目標", en: "Monthly goal", es: "Meta mensual", fr: "Objectif mensuel", zh: "月目标", ko: "월 목표", ru: "Цель/месяц" },
  "goal.year": { ja: "年の目標", en: "Yearly goal", es: "Meta anual", fr: "Objectif annuel", zh: "年目标", ko: "연 목표", ru: "Цель/год" },
  "goal.workdays": { ja: "出勤日数", en: "Workdays", es: "Días de trabajo", fr: "Jours travaillés", zh: "出勤天数", ko: "근무 일수", ru: "Рабочих дней" },
  "goal.avg": { ja: "平均時給 {n} で逆算", en: "Based on avg wage {n}", es: "Según salario medio {n}", fr: "D'après le salaire moyen {n}", zh: "按平均时薪 {n} 计算", ko: "평균 시급 {n} 기준", ru: "При средней ставке {n}" },
  "goal.perDayMonth": { ja: "月目標 → 1日あたり", en: "Monthly → per day", es: "Mensual → por día", fr: "Mensuel → par jour", zh: "月目标 → 每天", ko: "월 목표 → 하루", ru: "Месяц → в день" },
  "goal.perDayYear": { ja: "年目標 → 1日あたり", en: "Yearly → per day", es: "Anual → por día", fr: "Annuel → par jour", zh: "年目标 → 每天", ko: "연 목표 → 하루", ru: "Год → в день" },
  "goal.perDayHours": { ja: "≒ {h}/日", en: "≈ {h}/day", es: "≈ {h}/día", fr: "≈ {h}/jour", zh: "≈ {h}/天", ko: "≈ {h}/일", ru: "≈ {h}/день" },
  "goal.save": { ja: "ノルマを保存", en: "Save goal", es: "Guardar meta", fr: "Enregistrer", zh: "保存目标", ko: "목표 저장", ru: "Сохранить" },
  "goal.saved": { ja: "保存しました ✓", en: "Saved ✓", es: "Guardado ✓", fr: "Enregistré ✓", zh: "已保存 ✓", ko: "저장됨 ✓", ru: "Сохранено ✓" },

  "char.char:warrior": { ja: "戦士", en: "Warrior", es: "Guerrero", fr: "Guerrier", zh: "战士", ko: "전사", ru: "Воин" },
  "char.char:priest": { ja: "僧侶", en: "Priest", es: "Sacerdote", fr: "Prêtre", zh: "僧侣", ko: "사제", ru: "Жрец" },
  "char.char:hero": { ja: "勇者", en: "Hero", es: "Héroe", fr: "Héros", zh: "勇者", ko: "용사", ru: "Герой" },
  "char.char:salaryman": { ja: "社会人", en: "Office worker", es: "Oficinista", fr: "Salarié", zh: "上班族", ko: "직장인", ru: "Служащий" },
  "char.char:student": { ja: "学生", en: "Student", es: "Estudiante", fr: "Étudiant", zh: "学生", ko: "학생", ru: "Студент" },

  "rem.title": { ja: "リマインダー", en: "Reminder", es: "Recordatorio", fr: "Rappel", zh: "提醒", ko: "알림", ru: "Напоминание" },
  "rem.enable": { ja: "毎日この時刻に通知", en: "Notify daily at this time", es: "Avisar cada día a esta hora", fr: "Rappel quotidien à cette heure", zh: "每天此时提醒", ko: "매일 이 시간에 알림", ru: "Напоминать ежедневно" },
  "rem.time": { ja: "通知する時刻", en: "Reminder time", es: "Hora", fr: "Heure", zh: "提醒时间", ko: "알림 시간", ru: "Время" },
  "rem.note": { ja: "このタブを開いている間に通知します。", en: "Fires while this tab is open.", es: "Suena con esta pestaña abierta.", fr: "Se déclenche si cet onglet est ouvert.", zh: "在此标签页打开时提醒。", ko: "이 탭이 열려 있을 때 알립니다.", ru: "Срабатывает при открытой вкладке." },
  "rem.denied": { ja: "通知が許可されていません（ブラウザ設定を確認）。", en: "Notifications are blocked (check browser settings).", es: "Notificaciones bloqueadas (revisa el navegador).", fr: "Notifications bloquées (vérifiez le navigateur).", zh: "通知被阻止（请检查浏览器设置）。", ko: "알림이 차단되어 있습니다(브라우저 설정 확인).", ru: "Уведомления заблокированы (проверьте браузер)." },
  "notify.title": { ja: "給料クエスト", en: "Salary Quest", es: "Misión Salario", fr: "Quête du Salaire", zh: "工资冒险", ko: "급여 퀘스트", ru: "Зарплата-Квест" },
  "notify.body": { ja: "はたらく時間です！今日も稼ごう💪", en: "Time to work! Let's earn today 💪", es: "¡Hora de trabajar! A ganar hoy 💪", fr: "C'est l'heure de travailler ! Gagnons aujourd'hui 💪", zh: "该工作啦！今天也来赚钱 💪", ko: "일할 시간이에요! 오늘도 벌어봐요 💪", ru: "Пора работать! Заработаем сегодня 💪" },
  "common.language": { ja: "言語", en: "Language", es: "Idioma", fr: "Langue", zh: "语言", ko: "언어", ru: "Язык" },
};

const KEY = "earnflow.locale";

function detectDefault(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && LOCALES.includes(saved as Locale)) return saved as Locale;
    const nav = (navigator.language || "ja").slice(0, 2).toLowerCase();
    if (nav === "en") return "en";
  } catch {
    /* ignore */
  }
  return "ja";
}

let locale: Locale = detectDefault();
const listeners = new Set<() => void>();

export function setLocale(l: Locale): void {
  locale = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn());
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => locale,
    () => locale,
  );
}

function translate(loc: Locale, key: string, vars?: Record<string, string | number>): string {
  const entry = STRINGS[key];
  let s = entry ? entry[loc] ?? entry.en ?? key : key;
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

/** 翻訳関数を返すフック。t("key", { n: 5 }) */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const loc = useLocale();
  return (key, vars) => translate(loc, key, vars);
}
