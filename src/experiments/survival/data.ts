import type { SurvivalItem } from "./score";

interface LocalizedText { en: string; ja: string }
export interface SurvivalScenario {
  image: string;
  title: LocalizedText;
  situation: LocalizedText;
  goal: LocalizedText;
  requiredMeaning: string[];
}

export const survivalScenarios: SurvivalScenario[] = [
  {
    image: "/assets/scenarios/aliens-ticket-gate.png",
    title: { en: "Aliens Are Blocking the Ticket Gate", ja: "改札前を宇宙人がふさいでいる" },
    situation: { en: "On your way to work, three aliens block the ticket gate. They think IC cards are special cookies and want to taste yours. Use your items to pass the gate and catch your train.", ja: "通勤中、改札前に宇宙人が3人立ちはだかっています。彼らはICカードを特別なクッキーだと思い込み、あなたのカードを味見したがっています。アイテムを使って改札を通り、電車に乗ってください。" },
    goal: { en: "Explain how you will pass the ticket gate without causing trouble.", ja: "トラブルを起こさずに改札を通る方法を説明する" },
    requiredMeaning: ["aliens block ticket gate", "going to work", "need to catch train", "use items to pass safely"],
  },
  {
    image: "/assets/scenarios/pigs-office-lobby.png",
    title: { en: "Pigs Block the Office Lobby", ja: "会社のロビーが大量の豚でふさがれている" },
    situation: { en: "You arrive at the office, but many pigs are sitting in the lobby with visitor badges. Your client will arrive in five minutes and cannot see this. Use your items to move the pigs politely.", ja: "出社すると、会社のロビーで大量の豚が来客用バッジをつけて座っています。5分後には取引先が到着し、この状態を見られるわけにはいきません。アイテムを使って、豚たちを丁寧に移動させてください。" },
    goal: { en: "Explain how you will clear the lobby before the client arrives.", ja: "取引先が来る前にロビーを片づける方法を説明する" },
    requiredMeaning: ["pigs in office lobby", "client arriving soon", "need clear path", "use items to control situation"],
  },
  {
    image: "/assets/scenarios/mother-client-presentation.png",
    title: { en: "Your Mother Appears During a Client Presentation", ja: "取引先へのプレゼン中に母親が現れた" },
    situation: { en: "You are presenting to an important client. Suddenly, your mother enters the room, gives everyone snacks, and says, ‘My child is a little nervous today.’ You have two minutes to save the presentation.", ja: "大事な取引先へのプレゼン中に、突然お母さんが会議室へ入ってきて、参加者にお菓子を配りながら「今日はこの子、少し緊張しているんです」と言いました。残り2分でプレゼンを立て直してください。" },
    goal: { en: "Explain how to save the presentation and control the situation.", ja: "プレゼンの空気を立て直し、状況をコントロールする方法を説明する" },
    requiredMeaning: ["mother appears", "important presentation", "embarrassing situation", "continue presentation"],
  },
  {
    image: "/assets/scenarios/cash-register-interview.png",
    title: { en: "The Cash Register Starts a Job Interview", ja: "コンビニのレジが面接を始めた" },
    situation: { en: "You try to buy coffee, but the cash register asks, ‘What is your greatest weakness?’ The line behind you is getting longer. Use your items to pass the interview and pay quickly.", ja: "コンビニでコーヒーを買おうとしたら、レジが「あなたの一番の弱みは何ですか」と質問してきました。後ろの列がどんどん長くなっています。アイテムを使って面接を突破し、すばやく会計してください。" },
    goal: { en: "Make the register accept you and finish the payment.", ja: "レジを納得させて、会計を終わらせる" },
    requiredMeaning: ["convenience store", "cash register asks questions", "want to buy something", "persuade it"],
  },
  {
    image: "/assets/scenarios/boss-vending-machine.png",
    title: { en: "Your Boss Is Stuck in a Vending Machine", ja: "上司が自動販売機に詰まっている" },
    situation: { en: "During lunch, you find your boss stuck inside a vending machine between tea and energy drinks. Your boss says, ‘Buy motivation, not me.’ Use your items to rescue your boss before the next meeting.", ja: "昼休み、自動販売機の中で上司が緑茶とエナジードリンクの間に挟まっているのを見つけました。上司は「私ではなく、やる気を買いなさい」と言っています。次の会議までに、アイテムを使って助け出してください。" },
    goal: { en: "Explain how you will rescue your boss quickly and safely.", ja: "上司をすばやく安全に助け出す方法を説明する" },
    requiredMeaning: ["boss stuck in vending machine", "before meeting", "need rescue", "use items safely"],
  },
  {
    image: "/assets/scenarios/phone-boss-meetings.png",
    title: { en: "Your Phone Speaks Like Your Boss", ja: "スマホが上司の声で話し出した" },
    situation: { en: "While you are walking in town, your phone suddenly speaks in your boss's voice and adds a meeting called ‘Meeting About Meetings.’ It starts in three minutes. Use your items to stop it.", ja: "街を歩いていると、スマホが突然上司の声で話し出し、「会議についての会議」という予定を勝手に追加しました。開始は3分後です。アイテムを使って止めてください。" },
    goal: { en: "Explain the problem and a plan to stop the phone.", ja: "スマホの異常と、それを止める作戦を説明する" },
    requiredMeaning: ["phone talks like boss", "walking in town", "unwanted schedule", "stop it"],
  },
  {
    image: "/assets/scenarios/soup-complaint-desk.png",
    title: { en: "Your Soup Contains a Tiny Complaint Desk", ja: "スープの中に小さなクレーム窓口がある" },
    situation: { en: "At dinner, a tiny complaint desk appears in your soup. A small clerk says your spoon breaks the ‘quiet soup rule’ and blocks the soup. The restaurant closes in ten minutes.", ja: "夕食中、スープの中に小さなクレーム窓口が現れました。小さな係員が「静かなスープ規則に違反しています」と言って、スープをふさいでいます。閉店まであと10分です。" },
    goal: { en: "Explain how you will handle the complaint and continue dinner.", ja: "クレームに対応し、食事を続ける方法を説明する" },
    requiredMeaning: ["tiny complaint desk in soup", "during dinner", "spoon noise problem", "continue eating"],
  },
  {
    image: "/assets/scenarios/street-performer-copy.png",
    title: { en: "A Street Performer Copies Everything You Do", ja: "大道芸人があなたの動きを全部まねしてくる" },
    situation: { en: "On your way to a dinner reservation, a street performer starts copying every move you make. The crowd thinks you are a comedy duo and blocks the sidewalk. Use your items to leave politely.", ja: "夕食の予約に向かっている途中、大道芸人があなたの動きをすべてまねし始めました。見物人はあなたたちをコメディコンビだと思い込み、歩道がふさがっています。アイテムを使って失礼なく抜け出してください。" },
    goal: { en: "Explain how you will leave the crowd and arrive on time.", ja: "人だかりから抜け出し、時間通りに到着する方法を説明する" },
    requiredMeaning: ["street performer copies you", "crowd blocks sidewalk", "need arrive on time", "polite escape"],
  },
  {
    image: "/assets/scenarios/flying-business-card.png",
    title: { en: "A Client's Business Card Flies Away", ja: "取引先の名刺が空へ飛んでいった" },
    situation: { en: "During a business greeting, your client's business card flies away like a bird and lands on a tall office plant. You need the name for your notes, and the client is waiting.", ja: "取引先との初対面の挨拶中、相手の名刺が鳥のように飛んでいき、高い観葉植物の上に止まりました。会議メモに名前を書く必要があり、相手も待っています。" },
    goal: { en: "Explain a polite plan to get the business card back.", ja: "失礼にならない形で名刺を取り戻す方法を説明する" },
    requiredMeaning: ["business card flew away", "business greeting", "need to get it back", "polite plan"],
  },
  {
    image: "/assets/scenarios/tomato-speech-supermarket.png",
    title: { en: "Tomatoes Give a Speech at the Supermarket", ja: "スーパーのトマトが演説を始めた" },
    situation: { en: "While shopping, the tomatoes start a serious speech about tomato rights. Customers stop to listen, the aisle is blocked, and you must buy dinner before the store closes.", ja: "スーパーで買い物をしていると、トマトたちが「トマトの権利」についてまじめな演説を始めました。お客さんが立ち止まって通路がふさがれ、閉店前に夕食の材料を買わなければなりません。" },
    goal: { en: "Explain a plan to pass the aisle and continue shopping.", ja: "通路を通り、買い物を続ける方法を説明する" },
    requiredMeaning: ["tomato gives speech", "supermarket", "aisle blocked", "continue shopping"],
  },
  {
    image: "/assets/scenarios/taxi-birthday-balloons.png",
    title: { en: "The Taxi Is Full of Birthday Balloons", ja: "タクシーの中が誕生日の風船でいっぱい" },
    situation: { en: "You get into a taxi for an important appointment, but the back seat is full of birthday balloons from the last passenger. The meter is running, and you are already late. Use your items to make space without popping the balloons.", ja: "大事な予定に向かうためタクシーに乗ると、後部座席が前の乗客の誕生日風船でいっぱいでした。メーターは動いていて、あなたはすでに遅れています。風船を割らずに、アイテムを使って座る場所を作ってください。" },
    goal: { en: "Explain how you will make space and leave quickly.", ja: "座る場所を作り、すぐに出発する方法を説明する" },
    requiredMeaning: ["taxi full of balloons", "important appointment", "already late", "make space without popping balloons"],
  },
  {
    image: "/assets/scenarios/office-cat-id-card.png",
    title: { en: "The Office Cat Took Your ID Card", ja: "会社の猫が社員証を持っていった" },
    situation: { en: "At lunch, the office cat grabs your ID card and hides under the sofa. It looks like the cat wants a snack tax. You need the card for a meeting in five minutes.", ja: "昼休み、会社で飼われている猫があなたの社員証をくわえて、ソファの下に隠れてしまいました。どうやら猫は「おやつ税」を要求しているようです。5分後の会議で社員証が必要です。" },
    goal: { en: "Explain how you will get your office pass back before the meeting.", ja: "会議前に社員証を取り戻す方法を説明する" },
    requiredMeaning: ["office cat took ID card", "cat is under sofa", "meeting in five minutes", "get card without scaring cat"],
  },
];

export const survivalItems: SurvivalItem[] = [
  ["paper cup", "紙コップ"], ["rubber band", "輪ゴム"], ["receipt", "レシート"], ["small towel", "小さいタオル"], ["marker pen", "油性ペン"], ["empty bottle", "空のボトル"], ["train map", "路線図"], ["banana", "バナナ"], ["sticky notes", "ふせん"], ["plastic bag", "ビニール袋"], ["coin", "コイン"], ["string", "ひも"], ["postcard", "ポストカード"], ["spoon", "スプーン"], ["key chain", "キーホルダー"], ["business card", "名刺"], ["folding fan", "扇子"], ["train ticket", "切符"], ["candy", "キャンディ"], ["neck tie", "ネクタイ"], ["lip balm", "リップクリーム"], ["portable charger", "モバイルバッテリー"], ["chopsticks", "割り箸"], ["toy car", "おもちゃの車"], ["shopping bag", "買い物袋"],
].map(([en, ja]) => ({ en, ja }));

export function pickRandom<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}
