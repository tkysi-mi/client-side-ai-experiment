// ========== Collapsible Section Functionality ==========
/**
 * Toggle collapsible content visibility
 * @param {HTMLElement} button - The button element that was clicked
 */
function toggleCollapsible(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.collapsible-icon');
    const isExpanded = content.classList.contains('expanded');

    if (isExpanded) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
        button.querySelector('span:last-child').textContent = '使い方を表示';
        button.setAttribute('aria-expanded', 'false');
    } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
        button.querySelector('span:last-child').textContent = '使い方を非表示';
        button.setAttribute('aria-expanded', 'true');
    }
}

// ========== Global State Variables ==========
let recognition = null;
let languageModelSession = null;
let translationDebounceTimer = null;
let translationHistory = [];
let lastFinalTranscript = '';
let isTranslating = false;
let silenceTimer = null;
let currentSessionText = '';
let currentSessionTranslation = '';
let lastActivityTime = 0;
let gameModelSession = null;
let gameRecognition = null;
let gameTimerInterval = null;
let gamePhase = 'waiting';
let gameSecondsRemaining = 60;
let gameMissionCount = 0;
let activeMission = null;
let activeItems = [];
let gameFinalTranscript = '';
let gameDisplayLanguage = 'en';

const THINK_SECONDS = 60;
const TALK_SECONDS = 60;

// ========== DOM Element References ==========
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const englishText = document.getElementById('englishText');
const japaneseText = document.getElementById('japaneseText');
const historyDiv = document.getElementById('history');
const aiStatus = document.getElementById('ai-status');
const speechStatus = document.getElementById('speech-status');
const modelStatus = document.getElementById('model-status');
const warningDiv = document.getElementById('warning');
const warningText = document.getElementById('warning-text');
const translationLoader = document.getElementById('translationLoader');
const initButton = document.getElementById('initialize-model-button');
const usageToggle = document.getElementById('usage-toggle');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const gamePhaseEl = document.getElementById('gamePhase');
const gameTimerEl = document.getElementById('gameTimer');
const missionNumberEl = document.getElementById('missionNumber');
const scenarioTitleEl = document.getElementById('scenarioTitle');
const scenarioTextEl = document.getElementById('scenarioText');
const scenarioGoalEl = document.getElementById('scenarioGoal');
const scenarioImageEl = document.getElementById('scenarioImage');
const itemOneEl = document.getElementById('itemOne');
const itemTwoEl = document.getElementById('itemTwo');
const itemThreeEl = document.getElementById('itemThree');
const newMissionBtn = document.getElementById('newMissionBtn');
const startTalkBtn = document.getElementById('startTalkBtn');
const gameMicBtn = document.getElementById('gameMicBtn');
const evaluateBtn = document.getElementById('evaluateBtn');
const playerAnswer = document.getElementById('playerAnswer');
const totalScore = document.getElementById('totalScore');
const scoreBreakdown = document.getElementById('scoreBreakdown');
const gameLanguageButtons = document.querySelectorAll('[data-game-lang]');

// ========== Game Content ==========
const survivalScenarios = [
    {
        image: 'assets/scenarios/aliens-ticket-gate.png',
        title: {
            en: 'Aliens Are Blocking the Ticket Gate',
            ja: '改札前を宇宙人がふさいでいる'
        },
        situation: {
            en: 'On your way to work, three aliens block the ticket gate. They think IC cards are special cookies and want to taste yours. Use your items to pass the gate and catch your train.',
            ja: '通勤中、改札前に宇宙人が3人立ちはだかっています。彼らはICカードを特別なクッキーだと思い込み、あなたのカードを味見したがっています。アイテムを使って改札を通り、電車に乗ってください。'
        },
        goal: {
            en: 'Explain how you will pass the ticket gate without causing trouble.',
            ja: 'トラブルを起こさずに改札を通る方法を説明する'
        },
        requiredMeaning: ['aliens block ticket gate', 'going to work', 'need to catch train', 'use items to pass safely']
    },
    {
        image: 'assets/scenarios/pigs-office-lobby.png',
        title: {
            en: 'Pigs Block the Office Lobby',
            ja: '会社のロビーが大量の豚でふさがれている'
        },
        situation: {
            en: 'You arrive at the office, but many pigs are sitting in the lobby with visitor badges. Your client will arrive in five minutes and cannot see this. Use your items to move the pigs politely.',
            ja: '出社すると、会社のロビーで大量の豚が来客用バッジをつけて座っています。5分後には取引先が到着し、この状態を見られるわけにはいきません。アイテムを使って、豚たちを丁寧に移動させてください。'
        },
        goal: {
            en: 'Explain how you will clear the lobby before the client arrives.',
            ja: '取引先が来る前にロビーを片づける方法を説明する'
        },
        requiredMeaning: ['pigs in office lobby', 'client arriving soon', 'need clear path', 'use items to control situation']
    },
    {
        image: 'assets/scenarios/mother-client-presentation.png',
        title: {
            en: 'Your Mother Appears During a Client Presentation',
            ja: '取引先へのプレゼン中に母親が現れた'
        },
        situation: {
            en: 'You are presenting to an important client. Suddenly, your mother enters the room, gives everyone snacks, and says, "My child is a little nervous today." You have two minutes to save the presentation.',
            ja: '大事な取引先へのプレゼン中に、突然お母さんが会議室へ入ってきて、参加者にお菓子を配りながら「今日はこの子、少し緊張しているんです」と言いました。残り2分でプレゼンを立て直してください。'
        },
        goal: {
            en: 'Explain how to save the presentation and control the situation.',
            ja: 'プレゼンの空気を立て直し、状況をコントロールする方法を説明する'
        },
        requiredMeaning: ['mother appears', 'important presentation', 'embarrassing photos', 'continue presentation']
    },
    {
        image: 'assets/scenarios/cash-register-interview.png',
        title: {
            en: 'The Cash Register Starts a Job Interview',
            ja: 'コンビニのレジが面接を始めた'
        },
        situation: {
            en: 'You try to buy coffee, but the cash register asks, "What is your greatest weakness?" The line behind you is getting longer. Use your items to pass the interview and pay quickly.',
            ja: 'コンビニでコーヒーを買おうとしたら、レジが「あなたの一番の弱みは何ですか」と質問してきました。後ろの列がどんどん長くなっています。アイテムを使って面接を突破し、すばやく会計してください。'
        },
        goal: {
            en: 'Make the register accept you and finish the payment.',
            ja: 'レジを納得させて、会計を終わらせる'
        },
        requiredMeaning: ['convenience store', 'cash register asks questions', 'want to buy something', 'persuade it']
    },
    {
        image: 'assets/scenarios/boss-vending-machine.png',
        title: {
            en: 'Your Boss Is Stuck in a Vending Machine',
            ja: '上司が自動販売機に詰まっている'
        },
        situation: {
            en: 'During lunch, you find your boss stuck inside a vending machine between tea and energy drinks. Your boss says, "Buy motivation, not me." Use your items to rescue your boss before the next meeting.',
            ja: '昼休み、自動販売機の中で上司が緑茶とエナジードリンクの間に挟まっているのを見つけました。上司は「私ではなく、やる気を買いなさい」と言っています。次の会議までに、アイテムを使って助け出してください。'
        },
        goal: {
            en: 'Explain how you will rescue your boss quickly and safely.',
            ja: '上司をすばやく安全に助け出す方法を説明する'
        },
        requiredMeaning: ['boss stuck in vending machine', 'before meeting', 'need rescue', 'use items safely']
    },
    {
        image: 'assets/scenarios/phone-boss-meetings.png',
        title: {
            en: 'Your Phone Speaks Like Your Boss',
            ja: 'スマホが上司の声で話し出した'
        },
        situation: {
            en: "While you are walking in town, your phone suddenly speaks in your boss's voice and adds a meeting called 'Meeting About Meetings.' It starts in three minutes. Use your items to stop it.",
            ja: '街を歩いていると、スマホが突然上司の声で話し出し、「会議についての会議」という予定を勝手に追加しました。開始は3分後です。アイテムを使って止めてください。'
        },
        goal: {
            en: 'Explain the problem and a plan to stop the phone.',
            ja: 'スマホの異常と、それを止める作戦を説明する'
        },
        requiredMeaning: ['phone talks like boss', 'walking in town', 'unwanted schedule', 'stop it']
    },
    {
        image: 'assets/scenarios/soup-complaint-desk.png',
        title: {
            en: 'Your Soup Contains a Tiny Complaint Desk',
            ja: 'スープの中に小さなクレーム窓口がある'
        },
        situation: {
            en: 'At dinner, a tiny complaint desk appears in your soup. A small clerk says your spoon breaks the "quiet soup rule" and blocks the soup. The restaurant closes in ten minutes.',
            ja: '夕食中、スープの中に小さなクレーム窓口が現れました。小さな係員が「静かなスープ規則に違反しています」と言って、スープをふさいでいます。閉店まであと10分です。'
        },
        goal: {
            en: 'Explain how you will handle the complaint and continue dinner.',
            ja: 'クレームに対応し、食事を続ける方法を説明する'
        },
        requiredMeaning: ['tiny complaint desk in soup', 'during dinner', 'spoon noise problem', 'continue eating']
    },
    {
        image: 'assets/scenarios/street-performer-copy.png',
        title: {
            en: 'A Street Performer Copies Everything You Do',
            ja: '大道芸人があなたの動きを全部まねしてくる'
        },
        situation: {
            en: 'On your way to a dinner reservation, a street performer starts copying every move you make. The crowd thinks you are a comedy duo and blocks the sidewalk. Use your items to leave politely.',
            ja: '夕食の予約に向かっている途中、大道芸人があなたの動きをすべてまねし始めました。見物人はあなたたちをコメディコンビだと思い込み、歩道がふさがっています。アイテムを使って失礼なく抜け出してください。'
        },
        goal: {
            en: 'Explain how you will leave the crowd and arrive on time.',
            ja: '人だかりから抜け出し、時間通りに到着する方法を説明する'
        },
        requiredMeaning: ['street performer copies you', 'crowd blocks sidewalk', 'need arrive on time', 'polite escape']
    },
    {
        image: 'assets/scenarios/flying-business-card.png',
        title: {
            en: 'A Client\'s Business Card Flies Away',
            ja: '取引先の名刺が空へ飛んでいった'
        },
        situation: {
            en: 'During a business greeting, your client\'s business card flies away like a bird and lands on a tall office plant. You need the name for your notes, and the client is waiting.',
            ja: '取引先との初対面の挨拶中、相手の名刺が鳥のように飛んでいき、高い観葉植物の上に止まりました。会議メモに名前を書く必要があり、相手も待っています。'
        },
        goal: {
            en: 'Explain a polite plan to get the business card back.',
            ja: '失礼にならない形で名刺を取り戻す方法を説明する'
        },
        requiredMeaning: ['business card flew away', 'business greeting', 'need to get it back', 'polite plan']
    },
    {
        image: 'assets/scenarios/tomato-speech-supermarket.png',
        title: {
            en: 'Tomatoes Give a Speech at the Supermarket',
            ja: 'スーパーのトマトが演説を始めた'
        },
        situation: {
            en: 'While shopping, the tomatoes start a serious speech about tomato rights. Customers stop to listen, the aisle is blocked, and you must buy dinner before the store closes.',
            ja: 'スーパーで買い物をしていると、トマトたちが「トマトの権利」についてまじめな演説を始めました。お客さんが立ち止まって通路がふさがれ、閉店前に夕食の材料を買わなければなりません。'
        },
        goal: {
            en: 'Explain a plan to pass the aisle and continue shopping.',
            ja: '通路を通り、買い物を続ける方法を説明する'
        },
        requiredMeaning: ['tomato gives speech', 'supermarket', 'aisle blocked', 'continue shopping']
    },
    {
        image: 'assets/scenarios/taxi-birthday-balloons.png',
        title: {
            en: 'The Taxi Is Full of Birthday Balloons',
            ja: 'タクシーの中が誕生日の風船でいっぱい'
        },
        situation: {
            en: 'You get into a taxi for an important appointment, but the back seat is full of birthday balloons from the last passenger. The meter is running, and you are already late. Use your items to make space without popping the balloons.',
            ja: '大事な予定に向かうためタクシーに乗ると、後部座席が前の乗客の誕生日風船でいっぱいでした。メーターは動いていて、あなたはすでに遅れています。風船を割らずに、アイテムを使って座る場所を作ってください。'
        },
        goal: {
            en: 'Explain how you will make space and leave quickly.',
            ja: '座る場所を作り、すぐに出発する方法を説明する'
        },
        requiredMeaning: ['taxi full of balloons', 'important appointment', 'already late', 'make space without popping balloons']
    },
    {
        image: 'assets/scenarios/office-cat-id-card.png',
        title: {
            en: 'The Office Cat Took Your ID Card',
            ja: '会社の猫が社員証を持っていった'
        },
        situation: {
            en: 'At lunch, the office cat grabs your ID card and hides under the sofa. It looks like the cat wants a snack tax. You need the card for a meeting in five minutes.',
            ja: '昼休み、会社で飼われている猫があなたの社員証をくわえて、ソファの下に隠れてしまいました。どうやら猫は「おやつ税」を要求しているようです。5分後の会議で社員証が必要です。'
        },
        goal: {
            en: 'Explain how you will get your office pass back before the meeting.',
            ja: '会議前に社員証を取り戻す方法を説明する'
        },
        requiredMeaning: ['office cat took ID card', 'cat is under sofa', 'meeting in five minutes', 'get card without scaring cat']
    }
];

const survivalItems = [
    { en: 'paper cup', ja: '紙コップ' },
    { en: 'rubber band', ja: '輪ゴム' },
    { en: 'receipt', ja: 'レシート' },
    { en: 'small towel', ja: '小さいタオル' },
    { en: 'marker pen', ja: '油性ペン' },
    { en: 'empty bottle', ja: '空のボトル' },
    { en: 'train map', ja: '路線図' },
    { en: 'banana', ja: 'バナナ' },
    { en: 'sticky notes', ja: 'ふせん' },
    { en: 'plastic bag', ja: 'ビニール袋' },
    { en: 'coin', ja: 'コイン' },
    { en: 'string', ja: 'ひも' },
    { en: 'postcard', ja: 'ポストカード' },
    { en: 'spoon', ja: 'スプーン' },
    { en: 'key chain', ja: 'キーホルダー' },
    { en: 'business card', ja: '名刺' },
    { en: 'folding fan', ja: '扇子' },
    { en: 'train ticket', ja: '切符' },
    { en: 'candy', ja: 'キャンディ' },
    { en: 'neck tie', ja: 'ネクタイ' },
    { en: 'lip balm', ja: 'リップクリーム' },
    { en: 'portable charger', ja: 'モバイルバッテリー' },
    { en: 'chopsticks', ja: '割り箸' },
    { en: 'toy car', ja: 'おもちゃの車' },
    { en: 'shopping bag', ja: '買い物袋' }
];

// ========== Initialization ==========
/**
 * Initialize the application
 * Checks API availability, permissions, and model status
 */
async function initialize() {
    // Chrome AI APIの確認
    if (!window.LanguageModel) {
        showWarning('Chrome AI APIが利用できません。Chromeを最新バージョン (Stable 140+) にアップデートし、必要に応じて Prompt API の Origin Trial トークンが設定されているか確認してください。');
        aiStatus.textContent = '利用不可';
        aiStatus.className = 'status-value inactive';
        startBtn.disabled = true;
        return;
    }

    aiStatus.textContent = '利用可能';
    aiStatus.className = 'status-value active';

    // Web Speech APIの確認
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showWarning('Web Speech APIが利用できません。Chrome等の対応ブラウザを使用してください。');
        speechStatus.textContent = '利用不可';
        speechStatus.className = 'status-value inactive';
        startBtn.disabled = true;
        return;
    }

    // マイクアクセス許可状態を確認
    try {
        const permissions = await navigator.permissions.query({ name: 'microphone' });
        if (permissions.state === 'denied') {
            showWarning('マイクアクセスが拒否されています。ブラウザの設定でマイクアクセスを許可してください。');
            speechStatus.textContent = 'アクセス拒否';
            speechStatus.className = 'status-value inactive';
            startBtn.disabled = true;
            return;
        } else if (permissions.state === 'prompt') {
            speechStatus.textContent = '許可待ち';
            speechStatus.className = 'status-value loading';
        } else {
            speechStatus.textContent = '利用可能';
            speechStatus.className = 'status-value active';
        }
    } catch (error) {
        // permissions API が利用できない場合
        speechStatus.textContent = '利用可能';
        speechStatus.className = 'status-value active';
    }

    // AI モデルの利用可能性を確認
    await checkModelAvailability();

    // デバッグモード: AI APIが利用できない場合でも音声認識をテスト可能にする
    if (!window.LanguageModel) {
        console.log('デバッグモード: AI APIなしで音声認識のみ動作');
        startBtn.disabled = false; // 音声認識のテストを可能にする
        showWarning('デバッグモード: AI翻訳は利用できませんが、音声認識のテストが可能です。');
    }
}

// ========== Model Availability Check ==========
/**
 * Check if the AI model is available for use
 * Handles different states: available, downloadable, downloading, unavailable
 */
async function checkModelAvailability() {
    try {
        const availability = await window.LanguageModel.availability();

        switch (availability) {
            case 'available':
                modelStatus.textContent = '利用可能';
                modelStatus.className = 'status-value active';
                if (initButton) { initButton.style.display = 'none'; }
                await createLanguageModelSession();
                break;
            case 'downloadable':
                modelStatus.textContent = 'ダウンロード可能';
                modelStatus.className = 'status-value loading';
                showWarning('AI モデルのダウンロードが必要です。初回利用時は時間がかかることがあります。');
                if (initButton) {
                    initButton.style.display = '';
                    initButton.disabled = false;
                    initButton.textContent = 'AIモデルを準備する';
                }
                break;
            case 'downloading':
                modelStatus.textContent = 'ダウンロード中';
                modelStatus.className = 'status-value loading';
                showWarning('AI モデルをダウンロードしています。しばらくお待ちください。');
                if (initButton) {
                    initButton.style.display = '';
                    initButton.disabled = false;
                    initButton.textContent = 'AIモデルを準備する';
                }
                break;
            case 'unavailable':
                modelStatus.textContent = '利用不可';
                modelStatus.className = 'status-value inactive';
                showWarning('AI モデルが利用できません。システム要件を確認してください。');
                startBtn.disabled = true;
                if (initButton) { initButton.style.display = 'none'; }
                break;
        }
    } catch (error) {
        console.error('モデル確認エラー:', error);
        modelStatus.textContent = 'エラー';
        modelStatus.className = 'status-value inactive';
        showWarning('モデルの確認中にエラーが発生しました。');
    }
}

// ========== Language Model Session Creation ==========
/**
 * Create a new language model session with translation settings
 * Monitors download progress if model needs to be downloaded
 */
async function createLanguageModelSession() {
    try {
        languageModelSession = await window.LanguageModel.create({
            temperature: 0.3, // 翻訳の精度を高めるため低温度
            topK: 3,
            initialPrompts: [
                {
                    role: 'system',
                    content: 'You are a professional English to Japanese translator. Translate the given English text to natural Japanese. Only output the Japanese translation without any explanation or additional text.'
                }
            ],
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    modelStatus.textContent = `ダウンロード中 ${progress}%`;
                    modelStatus.className = 'status-value loading';
                });
            }
        });

        modelStatus.textContent = '準備完了';
        modelStatus.className = 'status-value active';
        hideWarning();
        if (initButton) {
            initButton.textContent = '準備完了';
            initButton.disabled = true;
            initButton.style.display = 'none';
        }
        console.log('Language Model セッションを作成しました');
    } catch (error) {
        console.error('セッション作成エラー:', error);
        modelStatus.textContent = 'エラー';
        modelStatus.className = 'status-value inactive';
        showWarning('AI モデルの初期化に失敗しました。');
        if (initButton) {
            initButton.disabled = false;
            initButton.textContent = 'AIモデルを準備する';
        }
    }
}

// ========== Speech Recognition Setup ==========
/**
 * Configure speech recognition with continuous mode and interim results
 * Sets up event handlers for recognition lifecycle
 */
function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        speechStatus.textContent = '認識中';
        speechStatus.className = 'status-value active';
        console.log('音声認識を開始しました');
    };

    recognition.onend = () => {
        console.log('音声認識が停止しました');

        // ユーザーが明示的に停止した場合は再開しない
        if (startBtn.disabled) { // 音声認識がまだアクティブな場合のみ再開
            speechStatus.textContent = '再開中';
            speechStatus.className = 'status-value loading';

            // 自動的に再開（少し遅延を入れる）
            setTimeout(() => {
                if (startBtn.disabled) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('再開失敗:', e);
                        // 再開に失敗した場合はボタン状態をリセット
                        startBtn.disabled = false;
                        stopBtn.disabled = true;
                        speechStatus.textContent = '停止';
                        speechStatus.className = 'status-value inactive';
                        showWarning('音声認識の継続に失敗しました。再度開始してください。');
                    }
                }
            }, 500);
        } else {
            speechStatus.textContent = '停止';
            speechStatus.className = 'status-value inactive';
        }
    };

    recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        speechStatus.textContent = 'エラー';
        speechStatus.className = 'status-value inactive';

        // ボタンの状態を元に戻す
        startBtn.disabled = false;
        stopBtn.disabled = true;

        switch(event.error) {
            case 'no-speech':
                showWarning('音声が検出されませんでした。マイクが正常に動作しているか確認してください。');
                break;
            case 'not-allowed':
                showWarning('マイクへのアクセスが拒否されました。ブラウザの設定でマイクアクセスを許可してください。');
                speechStatus.textContent = 'アクセス拒否';
                break;
            case 'audio-capture':
                showWarning('マイクでの音声キャプチャに失敗しました。マイクが他のアプリで使用されていないか確認してください。');
                break;
            case 'network':
                showWarning('ネットワークエラーが発生しました。インターネット接続を確認してください。');
                break;
            case 'aborted':
                // ユーザーが停止した場合は警告を表示しない
                hideWarning();
                speechStatus.textContent = '停止';
                break;
            default:
                showWarning(`音声認識エラーが発生しました: ${event.error}`);
                break;
        }
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // 英語テキストの表示を更新
        if (finalTranscript || interimTranscript) {
            lastActivityTime = Date.now();
            clearTimeout(silenceTimer);
        }

        if (finalTranscript) {
            currentSessionText += (currentSessionText ? ' ' : '') + finalTranscript;
            englishText.innerHTML = currentSessionText;
            // 最終結果はすぐに翻訳
            translateText(currentSessionText, false);

            // 3秒の無音タイマーを設定
            silenceTimer = setTimeout(() => {
                saveCurrentSessionToHistory();
            }, 3000);
        } else if (interimTranscript) {
            const displayText = currentSessionText + (currentSessionText ? ' ' : '') +
                '<span class="interim-text">' + interimTranscript + '</span>';
            englishText.innerHTML = displayText;
            // 中間結果の翻訳（デバウンシング）
            debouncedTranslate(currentSessionText + ' ' + interimTranscript, false);
        }
    };
}

// ========== Translation Functions ==========
/**
 * Debounced translation to avoid excessive API calls
 * @param {string} text - Text to translate
 * @param {boolean} isFinal - Whether this is the final transcript
 */
function debouncedTranslate(text, isFinal) {
    if (!text.trim()) return;

    clearTimeout(translationDebounceTimer);
    translationDebounceTimer = setTimeout(() => {
        translateText(text, isFinal);
    }, 300); // 300ms のデバウンシング
}

/**
 * Translate text using the language model with streaming
 * @param {string} text - Text to translate
 * @param {boolean} isFinal - Whether this is the final transcript
 */
async function translateText(text, isFinal) {
    if (!languageModelSession || !text.trim() || isTranslating) return;

    isTranslating = true;
    translationLoader.style.display = 'inline-block';

    try {
        const prompt = `Translate to Japanese: "${text}"`;

        // ストリーミング対応の翻訳
        japaneseText.textContent = '';
        const stream = languageModelSession.promptStreaming(prompt);

        let fullTranslation = '';
        for await (const chunk of stream) {
            fullTranslation += chunk; // チャンクを累積
            japaneseText.textContent = fullTranslation;
            console.log('Translation chunk:', chunk); // デバッグ用
        }

        currentSessionTranslation = fullTranslation;
        console.log('Final translation saved:', fullTranslation); // デバッグ用
    } catch (error) {
        console.error('翻訳エラー:', error);
        japaneseText.textContent = '翻訳エラーが発生しました';
        currentSessionTranslation = '';
    } finally {
        isTranslating = false;
        translationLoader.style.display = 'none';
    }
}

// ========== Demo Tabs ==========
function switchTab(tabName) {
    tabButtons.forEach((button) => {
        const isActive = button.dataset.tab === tabName;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', String(isActive));
    });

    tabPanels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === `${tabName}-panel`);
    });
}

// ========== Survival Game Functions ==========
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const rest = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${rest}`;
}

function setGamePhase(phase, seconds) {
    gamePhase = phase;
    gameSecondsRemaining = seconds;
    const phaseLabels = {
        waiting: '待機中',
        thinking: 'Thinking',
        talking: 'Talk',
        scoring: '採点中',
        done: '完了'
    };

    gamePhaseEl.textContent = phaseLabels[phase] || phase;
    gameTimerEl.textContent = formatTime(seconds);
}

function startGameTimer(seconds, onFinish) {
    clearInterval(gameTimerInterval);
    gameSecondsRemaining = seconds;
    gameTimerEl.textContent = formatTime(gameSecondsRemaining);

    gameTimerInterval = setInterval(() => {
        gameSecondsRemaining -= 1;
        gameTimerEl.textContent = formatTime(Math.max(gameSecondsRemaining, 0));

        if (gameSecondsRemaining <= 0) {
            clearInterval(gameTimerInterval);
            onFinish();
        }
    }, 1000);
}

function pickRandomItems(source, count) {
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function localizeMission(fieldName) {
    if (!activeMission) return '';
    const field = activeMission[fieldName];
    if (typeof field === 'string') return field;
    return field[gameDisplayLanguage] || field.en || field.ja || '';
}

function localizeItem(item) {
    if (gameDisplayLanguage === 'ja') {
        return `${item.ja} / ${item.en}`;
    }

    return item.en;
}

function renderMission() {
    scenarioTitleEl.textContent = localizeMission('title');
    scenarioTextEl.textContent = localizeMission('situation');
    scenarioGoalEl.textContent = localizeMission('goal');
    scenarioImageEl.src = activeMission.image;
    scenarioImageEl.alt = localizeMission('title');
    missionNumberEl.textContent = `#${gameMissionCount}`;

    const [first, second, third] = activeItems;
    itemOneEl.textContent = localizeItem(first);
    itemTwoEl.textContent = localizeItem(second);
    itemThreeEl.textContent = localizeItem(third);
}

function setGameDisplayLanguage(language) {
    gameDisplayLanguage = language;

    gameLanguageButtons.forEach((button) => {
        const isActive = button.dataset.gameLang === language;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    if (activeMission) {
        renderMission();
    }
}

function startNewMission() {
    stopGameSpeechRecognition();
    gameMissionCount += 1;
    activeMission = pickRandomItems(survivalScenarios, 1)[0];
    activeItems = pickRandomItems(survivalItems, 3);
    gameFinalTranscript = '';

    renderMission();
    playerAnswer.value = '';
    playerAnswer.disabled = true;
    startTalkBtn.disabled = false;
    gameMicBtn.disabled = true;
    evaluateBtn.disabled = true;
    totalScore.textContent = '--';
    scoreBreakdown.innerHTML = '<p>Thinking timeです。3つのアイテムをどう使うか考えてください。Talk timeになったら英語で説明します。</p>';

    setGamePhase('thinking', THINK_SECONDS);
    startGameTimer(THINK_SECONDS, startTalkPhase);
}

function startTalkPhase() {
    if (!activeMission) return;

    setGamePhase('talking', TALK_SECONDS);
    playerAnswer.disabled = false;
    playerAnswer.focus();
    startTalkBtn.disabled = true;
    gameMicBtn.disabled = false;
    evaluateBtn.disabled = false;
    scoreBreakdown.innerHTML = '<p>Talk timeです。文法よりも、状況・理由・3つのアイテムの使い方が伝わることを優先してください。</p>';

    startGameTimer(TALK_SECONDS, () => {
        stopGameSpeechRecognition();
        if (playerAnswer.value.trim()) {
            evaluateGameAnswer();
        } else {
            setGamePhase('done', 0);
            scoreBreakdown.innerHTML = '<p>回答が入力されませんでした。もう一度ミッションを開始してください。</p>';
        }
    });
}

function setupGameSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    gameRecognition = new SpeechRecognition();
    gameRecognition.continuous = true;
    gameRecognition.interimResults = true;
    gameRecognition.lang = 'en-US';
    gameRecognition.maxAlternatives = 1;

    gameRecognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                gameFinalTranscript += (gameFinalTranscript ? ' ' : '') + transcript.trim();
            } else {
                interimTranscript += transcript;
            }
        }

        playerAnswer.value = `${gameFinalTranscript}${interimTranscript ? ` ${interimTranscript}` : ''}`.trim();
    };

    gameRecognition.onerror = (event) => {
        console.error('ゲーム音声認識エラー:', event.error);
        showWarning(`音声入力エラー: ${event.error}`);
    };
}

function toggleGameSpeechRecognition() {
    if (gamePhase !== 'talking') return;

    try {
        if (!gameRecognition) {
            setupGameSpeechRecognition();
        }

        if (gameMicBtn.classList.contains('active')) {
            stopGameSpeechRecognition();
        } else {
            gameRecognition.start();
            gameMicBtn.classList.add('active');
            gameMicBtn.textContent = '音声停止';
        }
    } catch (error) {
        console.error('ゲーム音声認識開始エラー:', error);
        showWarning('音声入力の開始に失敗しました。テキスト入力で続けてください。');
        stopGameSpeechRecognition();
    }
}

function stopGameSpeechRecognition() {
    if (gameRecognition) {
        try {
            gameRecognition.stop();
        } catch (error) {
            console.log('ゲーム音声認識停止:', error);
        }
    }

    gameMicBtn.classList.remove('active');
    gameMicBtn.textContent = '音声入力';
}

async function createGameModelSession() {
    if (gameModelSession) return gameModelSession;

    gameModelSession = await window.LanguageModel.create({
        temperature: 0.2,
        topK: 3,
        initialPrompts: [
            {
                role: 'system',
                content: 'You evaluate short English explanations by CEFR A1/A2 learners. Reward successful meaning transfer more than grammar. Return only valid JSON.'
            }
        ]
    });

    return gameModelSession;
}

async function promptLanguageModel(session, prompt) {
    if (typeof session.prompt === 'function') {
        return session.prompt(prompt);
    }

    const stream = session.promptStreaming(prompt);
    let output = '';
    for await (const chunk of stream) {
        output += chunk;
    }
    return output;
}

function parseJsonFromText(text) {
    try {
        return JSON.parse(text);
    } catch (error) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw error;
        return JSON.parse(match[0]);
    }
}

function clampScore(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return 0;
    return Math.max(0, Math.min(100, Math.round(number)));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fallbackGameScore(answer) {
    const lowerAnswer = answer.toLowerCase();
    const usedItems = activeItems.filter((item) => lowerAnswer.includes(item.en.toLowerCase())).length;
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

    return {
        meaningTransfer: Math.min(100, wordCount * 4),
        reasonClarity: lowerAnswer.includes('because') || lowerAnswer.includes('so') ? 70 : 45,
        itemUse: Math.round((usedItems / 3) * 100),
        taskSuccess: wordCount >= 18 ? 70 : 45,
        repairability: wordCount >= 12 ? 65 : 35,
        total: 0,
        understood: ['一部の説明は伝わりました。'],
        needsWork: ['AI採点に失敗したため、簡易採点を表示しています。'],
        nextLine: 'I need help because...'
    };
}

function normalizeGameScore(score) {
    const normalized = {
        meaningTransfer: clampScore(score.meaningTransfer),
        reasonClarity: clampScore(score.reasonClarity),
        itemUse: clampScore(score.itemUse),
        taskSuccess: clampScore(score.taskSuccess),
        repairability: clampScore(score.repairability),
        understood: Array.isArray(score.understood) ? score.understood.slice(0, 3) : [],
        needsWork: Array.isArray(score.needsWork) ? score.needsWork.slice(0, 3) : [],
        nextLine: typeof score.nextLine === 'string' ? score.nextLine : ''
    };

    normalized.total = clampScore(
        normalized.meaningTransfer * 0.35 +
        normalized.reasonClarity * 0.2 +
        normalized.itemUse * 0.15 +
        normalized.taskSuccess * 0.2 +
        normalized.repairability * 0.1
    );

    return normalized;
}

function renderGameScore(score) {
    totalScore.textContent = score.total;

    const rows = [
        ['意味伝達', score.meaningTransfer],
        ['理由', score.reasonClarity],
        ['アイテム', score.itemUse],
        ['達成', score.taskSuccess],
        ['修復性', score.repairability]
    ];

    const understood = score.understood.length
        ? score.understood.map((item) => `<p>伝わった: ${escapeHtml(item)}</p>`).join('')
        : '<p>伝わった点はまだ少なめです。</p>';
    const needsWork = score.needsWork.length
        ? score.needsWork.map((item) => `<p>次の改善: ${escapeHtml(item)}</p>`).join('')
        : '<p>改善点は大きくありません。</p>';
    const nextLine = score.nextLine ? `<p>次の一言: ${escapeHtml(score.nextLine)}</p>` : '';

    scoreBreakdown.innerHTML = `
        <dl>
            ${rows.map(([label, value]) => `
                <div class="score-row">
                    <dt>${label}</dt>
                    <dd class="score-meter"><span style="width: ${value}%"></span></dd>
                    <dd>${value}</dd>
                </div>
            `).join('')}
        </dl>
        <div class="feedback-list">
            ${understood}
            ${needsWork}
            ${nextLine}
        </div>
    `;
}

async function evaluateGameAnswer() {
    if (!activeMission || !playerAnswer.value.trim()) return;

    clearInterval(gameTimerInterval);
    stopGameSpeechRecognition();
    setGamePhase('scoring', 0);
    playerAnswer.disabled = true;
    evaluateBtn.disabled = true;
    gameMicBtn.disabled = true;
    startTalkBtn.disabled = true;
    scoreBreakdown.innerHTML = '<p>AIが、文法ではなく「意味が相手に届いたか」を中心に採点しています。</p>';

    const prompt = `
Evaluate this CEFR A1/A2 learner answer for a short survival explanation game.

Situation in English:
${activeMission.situation.en}

Situation in Japanese:
${activeMission.situation.ja}

Goal:
${activeMission.goal.en}

Required meaning:
${activeMission.requiredMeaning.join(', ')}

The learner must use these three items:
${activeItems.map((item) => `- ${item.en} (${item.ja})`).join('\n')}

Learner answer:
${playerAnswer.value.trim()}

Score each category from 0 to 100.
meaningTransfer: whether the key situation/request is understandable.
reasonClarity: whether the reason or logic is understandable.
itemUse: whether the three items are used in a plausible explanation.
taskSuccess: whether another person could take the right action.
repairability: whether this answer could be improved easily with one short hint.

Return only this JSON shape:
{
  "meaningTransfer": 0,
  "reasonClarity": 0,
  "itemUse": 0,
  "taskSuccess": 0,
  "repairability": 0,
  "understood": ["short Japanese feedback"],
  "needsWork": ["short Japanese feedback"],
  "nextLine": "one simple English sentence the learner can say next"
}
`;

    try {
        const session = await createGameModelSession();
        const response = await promptLanguageModel(session, prompt);
        const score = normalizeGameScore(parseJsonFromText(response));
        renderGameScore(score);
    } catch (error) {
        console.error('ゲーム採点エラー:', error);
        const fallbackScore = normalizeGameScore(fallbackGameScore(playerAnswer.value));
        renderGameScore(fallbackScore);
        showWarning('AI採点に失敗したため、簡易採点を表示しています。');
    } finally {
        setGamePhase('done', 0);
        playerAnswer.disabled = false;
    }
}

// ========== History Management ==========
/**
 * Add a translation pair to history
 * @param {string} english - English text
 * @param {string} japanese - Japanese translation
 */
function addToHistory(english, japanese) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    translationHistory.unshift({
        english: english,
        japanese: japanese,
        timestamp: timestamp
    });

    // 最大10件まで保持
    if (translationHistory.length > 10) {
        translationHistory.pop();
    }

    updateHistoryDisplay();
}

/**
 * Update the history display UI
 */
function updateHistoryDisplay() {
    if (translationHistory.length === 0) {
        historyDiv.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 0.875rem;">履歴がありません</div>';
        return;
    }

    historyDiv.innerHTML = translationHistory.map(item => `
        <div class="history-item">
            <div class="history-text">
                <div class="language-indicator">English</div>
                <div class="history-english">${item.english}</div>
            </div>
            <div class="history-text">
                <div class="language-indicator">日本語</div>
                <div class="history-japanese">${item.japanese}</div>
            </div>
            <div class="timestamp">${item.timestamp}</div>
        </div>
    `).join('');
}

// ========== Warning Message Functions ==========
/**
 * Display a warning message to the user
 * @param {string} message - Warning message to display
 */
function showWarning(message) {
    warningText.textContent = message;
    warningDiv.classList.remove('hidden');
}

/**
 * Hide the warning message
 */
function hideWarning() {
    warningDiv.classList.add('hidden');
}

// ========== Session Management ==========
/**
 * Save the current translation session to history
 */
function saveCurrentSessionToHistory() {
    if (currentSessionText.trim() && currentSessionTranslation.trim()) {
        addToHistory(currentSessionText, currentSessionTranslation);
        currentSessionText = '';
        currentSessionTranslation = '';
        englishText.textContent = '';
        japaneseText.textContent = '';
        console.log('セッションを履歴に保存しました');
    }
}

// ========== Event Listeners ==========

// Demo tabs
tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
        switchTab(button.dataset.tab);
    });
});

// Initialize model button
if (initButton) {
    initButton.addEventListener('click', async () => {
        try {
            initButton.disabled = true;
            initButton.textContent = '準備中...';
            await createLanguageModelSession();
        } catch (e) {
            console.error('Model initialization error:', e);
        }
    });
}

// Usage toggle button
if (usageToggle) {
    usageToggle.addEventListener('click', () => {
        toggleCollapsible(usageToggle);
    });
}

// Survival game buttons
gameLanguageButtons.forEach((button) => {
    button.addEventListener('click', () => {
        setGameDisplayLanguage(button.dataset.gameLang);
    });
});

if (newMissionBtn) {
    newMissionBtn.addEventListener('click', startNewMission);
}

if (startTalkBtn) {
    startTalkBtn.addEventListener('click', () => {
        clearInterval(gameTimerInterval);
        startTalkPhase();
    });
}

if (gameMicBtn) {
    gameMicBtn.addEventListener('click', toggleGameSpeechRecognition);
}

if (evaluateBtn) {
    evaluateBtn.addEventListener('click', evaluateGameAnswer);
}

// Start button - Begin speech recognition
startBtn.addEventListener('click', () => {
    try {
        if (!recognition) {
            setupSpeechRecognition();
        }

        recognition.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        currentSessionText = '';
        currentSessionTranslation = '';
        englishText.textContent = '';
        japaneseText.textContent = '';
        clearTimeout(silenceTimer);
        hideWarning();
    } catch (error) {
        console.error('音声認識開始エラー:', error);
        showWarning('音声認識の開始に失敗しました。ブラウザを更新して再度お試しください。');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
});

// Stop button - Stop speech recognition
stopBtn.addEventListener('click', () => {
    if (recognition) {
        recognition.stop();
    }
    clearTimeout(silenceTimer);
    // 停止時に現在のセッションを履歴に保存
    saveCurrentSessionToHistory();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    speechStatus.textContent = '停止';
    speechStatus.className = 'status-value inactive';
});

// Clear button - Clear translation history
clearBtn.addEventListener('click', () => {
    translationHistory = [];
    updateHistoryDisplay();
    currentSessionText = '';
    currentSessionTranslation = '';
    englishText.textContent = '';
    japaneseText.textContent = '';
    clearTimeout(silenceTimer);
});

// ========== Page Lifecycle Events ==========

// Initialize on page load
window.addEventListener('load', () => {
    initialize();
    updateHistoryDisplay();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (languageModelSession) {
        languageModelSession.destroy();
    }
    if (gameModelSession) {
        gameModelSession.destroy();
    }
    if (recognition) {
        recognition.stop();
    }
    if (gameRecognition) {
        gameRecognition.stop();
    }
});
