// "Managing Up" — the deck. The writing IS the game; tune here.
import type { OfficeCard } from "./types";

// 7 rungs, start at Intern (idx 0) → CEO at idx 6 = 6 promotions. Starting at the
// bottom means just ONE ladder pip is lit on Day 1 (you're the new hire).
// Reviews fire ~every 4 turns (~9 chances/run), so the top is reachable with
// good play but not guaranteed — that's the "how high can you go" spine.
export const RANKS = [
  "Intern",
  "Associate",
  "Analyst",
  "Manager",
  "Director",
  "VP of Synergy",
  "Chief Synergy Officer",
];

export const COMPANIES = [
  "Synergent",
  "Brightloom",
  "Kestrel Dynamics",
  "Pendleton & Pace",
  "Monocle",
  "Verdant Labs",
  "Northwind Mutual",
  "Tessellate",
  "Cloudhaven",
  "Apex Holdings",
  "Lumenworks",
  "Strathmore Group",
];

// Recurring cast (avatars used in the UI):
// Brad 🧔 (your manager) · Dave 😏 (rival) · Priya 👩‍💻 (the one who actually works)
// Janet 📋 (HR) · The Skip 🕴️ (VP, terrifying) · Tyler 🧃 (intern, chaos)

// --- Onboarding: a fixed, gentle "first day" that always opens a run ----------
// Each card moves exactly ONE meter, so the meters reveal one-at-a-time (clout →
// cred → receipts) instead of all at once. These all sit on "Day 1".
export const ONBOARDING: OfficeCard[] = [
  {
    id: "ob_notes",
    kind: "onboard",
    channel: "dm",
    from: "Brad",
    avatar: "🧔",
    text: "9:04am, day one. Brad: “You must be the new hire — we are SO glad you're here! 🎉 Tiny thing: can you take notes in the 10am?”",
    choices: [
      {
        label: "“Absolutely, happy to!” ✍️",
        result: "You have volunteered before finding the bathroom.",
        effect: { clout: 10, note: "volunteered to take meeting notes before finding the bathroom" },
      },
      { label: "“Sure — where is it?” 🙂", effect: { clout: 5 } },
      { label: "“I'm… still setting up my laptop?” 😅", effect: { clout: -4 } },
    ],
  },
  {
    id: "ob_priya",
    kind: "onboard",
    channel: "irl",
    from: "Priya",
    avatar: "👩‍💻",
    text: "Your desk neighbor leans over: “psst — coffee's terrible, the printer hates everyone, and never microwave fish. you'll be fine.”",
    choices: [
      {
        label: "“Thank you, genuinely.” 🙏",
        result: "A work-friend, on day one. Ahead of schedule.",
        effect: { cred: 10, note: "made a work-friend on day one (wildly ahead of schedule)" },
      },
      { label: "Offer to grab her a coffee ☕", effect: { cred: 8 } },
      { label: "“…noted.” (you will microwave fish)", effect: { cred: -3 } },
    ],
  },
  {
    id: "ob_funfact",
    kind: "onboard",
    channel: "slack",
    text: "#general, 9:30am: “Everyone welcome our newest team member! Drop a fun fact 👇” 142 people are watching.",
    choices: [
      { label: "Something safe and forgettable 😇", effect: { receipts: 3, cred: 2 } },
      {
        label: "Wildly oversharing personal fact 😬",
        result: "Screenshotted in three private channels already.",
        effect: { receipts: 12, note: "opened with an unprompted overshare in #general on day one" },
      },
      { label: "“new phone, who dis 😎”", effect: { receipts: 6, cred: 3 } },
    ],
  },
];

export const DECK: OfficeCard[] = [
  {
    id: "brad_eod",
    channel: "slack",
    from: "Brad",
    avatar: "🧔",
    text: "hey! quick one — can you circle back on the Q3 deck before EOD? 🙏 (it is 4:55pm)",
    choices: [
      {
        label: "On it 🫡",
        result: "There goes your evening.",
        effect: { clout: 9, cred: -3, note: "rebuilt Brad's deck after 5pm and called it 'no worries'" },
      },
      {
        label: "“at capacity rn” 🙅",
        result: "Boundaries! Brad is typing…",
        effect: { clout: -11, cred: 7, note: "told a manager I was 'at capacity' and meant it" },
      },
      {
        label: "Forward it to Tyler 😈",
        result: "The intern inherits the deck.",
        effect: { clout: 4, cred: -6, receipts: 7, flag: "dumped_tyler", note: "delegated a 5pm deck to an intern and logged off" },
      },
    ],
  },
  {
    id: "dave_cc",
    channel: "email",
    from: "Dave",
    avatar: "😏",
    text: "Per my last email — still waiting on your section. (cc: the Skip)\n\nYou never got a first email.",
    choices: [
      {
        label: "Apologize & resend 🙇",
        effect: { clout: -4, cred: 2 },
      },
      {
        label: "“Resending now!” (you have nothing) 😇",
        result: "You are now writing it in a blind panic.",
        effect: { clout: 6, receipts: 11, note: "claimed to 'resend' an email that has never existed" },
      },
      {
        label: "Reply-All the receipts 🧨",
        replyAll: true,
        result: "47 people are watching.",
        effect: { clout: 8, cred: -9, receipts: 16, flag: "dave_war", note: "started a reply-all war with Dave in front of the VP" },
      },
    ],
  },
  {
    id: "fish",
    channel: "irl",
    text: "Someone microwaved fish. The office is a crime scene. The #general thread is at 51 replies and climbing.",
    choices: [
      { label: "Stay out of it 🙊", effect: {} },
      {
        label: "Investigate (it was you) 🐟",
        result: "You are leading the manhunt for yourself.",
        effect: { cred: 7, receipts: 6, note: "led an investigation into a fish crime I personally committed" },
      },
      {
        label: "Blame Dave 🎯",
        effect: { clout: 2, cred: -3, receipts: 9, flag: "framed_dave", note: "framed a colleague for a fish-related incident" },
      },
    ],
  },
  {
    id: "priya_cover",
    channel: "dm",
    from: "Priya",
    avatar: "👩‍💻",
    minDay: 3,
    text: "covered your 8am standup. you owe me. ☕",
    choices: [
      {
        label: "Thank her, buy coffee 🤝",
        effect: { cred: 11, clout: -2, note: "thanked Priya like a functioning human (rare)" },
      },
      {
        label: "👍",
        result: "You reacted with a single thumbs-up to a genuine favor.",
        effect: { cred: -8, receipts: 4, note: "responded to a real favor with one (1) passive-aggressive 👍" },
      },
      {
        label: "Take credit for the 8am 😈",
        effect: { clout: 9, cred: -13, receipts: 9, note: "took credit for a meeting I did not attend" },
      },
    ],
  },
  {
    id: "elevator_skip",
    channel: "irl",
    from: "The Skip",
    avatar: "🕴️",
    minDay: 4,
    text: "You're trapped in the elevator with the VP. 14 floors. “So! What are you working on?”",
    choices: [
      {
        label: "Buzzword salad 🧠",
        result: "You said four words. None were nouns. He nodded.",
        effect: { clout: 11, receipts: 5, note: "synergized an entire sentence at a VP using zero real information" },
      },
      {
        label: "Honestly describe your work 😬",
        result: "His eyes glaze at floor 6.",
        effect: { clout: -5, cred: 5 },
      },
      { label: "“lots of moving parts!” 🫠", effect: { clout: 3 } },
    ],
  },
  {
    id: "rto",
    channel: "email",
    from: "Brad",
    avatar: "🧔",
    text: "Leadership wants everyone back in the office 5 days a week. “Replies welcome!” (to all 240 of us)",
    choices: [
      {
        label: "“Excited to collaborate IRL!” 🤥",
        result: "Your soul left the building, but your Clout didn't.",
        effect: { clout: 13, cred: -15, receipts: 7, note: "publicly cheered the return-to-office mandate" },
      },
      { label: "Say nothing 🤐", effect: {} },
      {
        label: "Reply-All a polite revolt ✊",
        replyAll: true,
        result: "63 people 👀. 4 brave 👍.",
        effect: { clout: -16, cred: 17, receipts: 14, flag: "rto_rebel", note: "led a reply-all revolt against RTO and briefly became a folk hero" },
      },
    ],
  },
  {
    id: "tyler_ceo",
    channel: "dm",
    from: "Tyler",
    avatar: "🧃",
    text: "is it weird that i booked a 1:1 with the CEO to “pick his brain”??",
    choices: [
      { label: "Yes. Cancel it. 🛑", effect: { cred: 6 } },
      {
        label: "Iconic. Do it. 🔥",
        effect: { cred: 5, receipts: 6, flag: "enabled_tyler", note: "encouraged the intern to cold-book the CEO" },
      },
      {
        label: "Ask to tag along 🤝",
        effect: { clout: 8, cred: -5, note: "tried to piggyback on an intern's CEO meeting" },
      },
    ],
  },
  {
    id: "quicksync",
    channel: "calendar",
    text: "📅 “Quick Sync” just landed. Recurring. No agenda. 9 attendees. Starts in 4 minutes.",
    choices: [
      { label: "Join, camera off, mute, vanish 😶", effect: { clout: 2, cred: 2, note: "attended a meeting as a small grey circle" } },
      { label: "Decline as “tentative” 👻", effect: { clout: -2, cred: 4 } },
      {
        label: "“could this have been an email?” 💅",
        result: "You said the forbidden words. Out loud.",
        effect: { clout: -6, cred: 13, receipts: 8, note: "asked if a meeting could have been an email, to its face" },
      },
    ],
  },
  {
    id: "dave_idea",
    channel: "slack",
    from: "Dave",
    avatar: "😏",
    text: "great point in there 🙂 mind if I run with it?\n\n(It was your entire idea.)",
    choices: [
      { label: "“sure!” (he gets the credit) 😇", effect: { cred: 4, clout: -9, note: "let Dave run with my idea and my promotion" } },
      { label: "“let's co-present” 🤝", effect: { clout: 6, cred: 3 } },
      { label: "“actually, I've got it” 🗡️", effect: { clout: 7, cred: -6, flag: "dave_war", note: "drew a line in the sand with Dave over an idea" } },
    ],
  },
  {
    id: "saturday",
    channel: "calendar",
    from: "Brad",
    avatar: "🧔",
    text: "Brad invited you to “Blue-Sky Brainstorm 🧠✨” — Saturday, 9am.",
    choices: [
      { label: "Accept (weekend gone) 😩", effect: { clout: 10, cred: -2, note: "gave up a Saturday for a brainstorm with no whiteboard" } },
      { label: "Decline 🙅", effect: { clout: -7, cred: 2 } },
      { label: "“let's make it an async doc” 📄", effect: { clout: 1, cred: 7, note: "heroically converted a Saturday meeting into a doc nobody read" } },
    ],
  },
  {
    id: "tyler_meme",
    channel: "dm",
    from: "Tyler",
    avatar: "🧃",
    text: "i made a meme about Brad. it's so good. posting to #general in 5 min 👀",
    choices: [
      { label: "Talk him down 🛑", effect: { clout: 5, cred: -3 } },
      { label: "“send it to me first” 😏", effect: { cred: 8, receipts: 8, flag: "brad_meme", note: "received contraband Brad memes and said nothing" } },
      { label: "Post a better one yourself 💣", effect: { cred: 7, clout: -10, receipts: 18, note: "out-memed an intern at my manager's expense, publicly" } },
    ],
  },
  {
    id: "general_slip",
    channel: "slack",
    text: "You typed a spicy take meant for a DM. You posted it in #general. To everyone. It has 12 reactions already.",
    choices: [
      { label: "Delete & pray 🙏", effect: { receipts: 7 } },
      { label: "“haha wrong channel 😅”", effect: { cred: 2, receipts: 3 } },
      { label: "Double down 💀", effect: { clout: 5, cred: -7, receipts: 20, flag: "general_fire", note: "stood by a take I posted to 4,000 coworkers by accident" } },
    ],
  },
  {
    id: "war_room",
    channel: "email",
    text: "You've been added to a “Tiger Team” for a project no one can explain. Kickoff is now.",
    choices: [
      { label: "Lean in, become essential 💼", effect: { clout: 10, cred: -4, note: "made myself indispensable to a project with no defined goal" } },
      { label: "Vanish into it 🫥", effect: { note: "joined a tiger team and was never heard from again" } },
      { label: "“I have bandwidth for one (1) swat team” 💅", effect: { cred: 7 } },
    ],
  },
  {
    id: "skip_dm",
    channel: "dm",
    from: "The Skip",
    avatar: "🕴️",
    text: "got a sec?",
    minDay: 4,
    choices: [
      { label: "“of course!” ⚡", result: "Two terrifying minutes later, you've been volunteered for something.", effect: { clout: 14, receipts: 4, note: "got 'a sec'-ed by a VP and emerged with a new unpaid responsibility" } },
      { label: "“in a meeting — 5?” (you are not) ⏳", effect: { clout: -3, cred: 1 } },
    ],
  },
  {
    id: "lunch_theft",
    channel: "irl",
    text: "Your labeled lunch is gone from the fridge. You have a strong suspect. There is no justice system.",
    choices: [
      { label: "Let it go (be the bigger person) 🧘", effect: { cred: 4 } },
      { label: "Passive-aggressive fridge note 📝", effect: { cred: -4, receipts: 6, note: "authored a legendary passive-aggressive fridge note" } },
      { label: "Eat someone else's lunch 🍱", effect: { receipts: 8, flag: "lunch_criminal", note: "resolved a lunch theft by committing a lunch theft" } },
    ],
  },
  {
    id: "linkedin_dave",
    channel: "slack",
    from: "Dave",
    avatar: "😏",
    text: "Dave just posted “Humbled & honored to share I've been promoted to Senior…” It's 600 likes deep.",
    requires: (s) => s.flags.dave_war === true,
    choices: [
      { label: "Like it. Seethe. 👍", effect: { cred: 2, note: "liked my nemesis's promotion post while dying inside" } },
      { label: "Comment “well deserved 🙂” 🗡️", effect: { clout: 3, receipts: 5 } },
      { label: "Book a meeting with the Skip 📈", effect: { clout: 9, cred: -4, note: "responded to a rival's promotion by aggressively scheduling upward" } },
    ],
  },
  {
    id: "credit_winback",
    channel: "irl",
    text: "In the all-hands, leadership praises “the Q3 launch.” You did most of it. Dave is standing up to wave.",
    minDay: 3,
    choices: [
      { label: "Let him have it 😔", effect: { cred: 5, clout: -8 } },
      { label: "“actually, the whole team —” 🤝", effect: { clout: 4, cred: 9, note: "redirected stolen credit to the team on a live mic" } },
      { label: "Stand up faster than Dave 🏃", effect: { clout: 11, cred: -7, receipts: 6, note: "raced a colleague to their feet to claim a launch" } },
    ],
  },
  {
    id: "burnout",
    channel: "irl",
    text: "It's 7:40pm. You're the last one here. The motion-sensor lights just turned off on you again.",
    minDay: 5,
    choices: [
      { label: "Wave your arms, keep grinding 💡", effect: { clout: 7, cred: -2, note: "triggered the office motion lights solo at 7:40pm, again" } },
      { label: "Go home like a person 🚪", effect: { cred: 5, clout: -2 } },
      { label: "Quietly start applying elsewhere 📲", effect: { cred: 3, flag: "rage_applying", note: "began rage-applying from the office wifi" } },
    ],
  },
  {
    id: "standup_lie",
    channel: "calendar",
    minDay: 3,
    text: "Daily standup. “What did you get done yesterday?” You got nothing done yesterday.",
    choices: [
      { label: "“mostly unblocking others” 🧱", result: "Ancient. Powerful. Unfalsifiable.", effect: { clout: 5, note: "reported 'unblocking others' for a third consecutive day" } },
      { label: "Tell the truth 😬", effect: { clout: -6, cred: 6 } },
      { label: "List things Priya did 🫥", effect: { clout: 4, cred: -9, receipts: 7, note: "presented a colleague's work as a status update" } },
    ],
  },
  {
    id: "offsite",
    channel: "calendar",
    text: "Mandatory “fun”: a team offsite with trust falls and a ropes course. Attendance is “optional.”",
    minDay: 6,
    choices: [
      { label: "Go, fake the fun 🤸", effect: { clout: 6, cred: 3, note: "did a trust fall into the arms of people I'd lay off" } },
      { label: "“family thing” (there is no thing) 👨‍👩‍👧", effect: { clout: -4, receipts: 5, note: "skipped the offsite for a family event that did not exist" } },
      { label: "Get genuinely competitive 🏆", effect: { cred: 7, clout: -2 } },
    ],
  },
  {
    id: "slack_status",
    channel: "slack",
    text: "It's 2pm. You've done one thing. Your green dot is a lie you must maintain.",
    choices: [
      { label: "Set status to 🟢 “in deep work” and nap", effect: { receipts: 6, note: "weaponized the 'deep work' status for a 2pm nap" } },
      { label: "Send a thoughtful message to look busy 💬", effect: { clout: 3, note: "task-masked with an extremely visible thread reply" } },
      { label: "Actually do work (rookie) ✍️", effect: { cred: 4, clout: 2 } },
    ],
  },
  {
    id: "pip_threat",
    channel: "hr",
    from: "Janet",
    avatar: "📋",
    text: "HR would like “a quick chat about a tone concern from a recent message.” 🙂",
    requires: (s) => s.receipts >= 45,
    choices: [
      { label: "Grovel completely 🙇", effect: { receipts: -22, clout: -6 } },
      { label: "“I stand by my tone” 😤", effect: { receipts: -8, cred: 9, clout: -11, note: "told HR I stand by my tone" } },
      { label: "Blame autocorrect 📱", effect: { receipts: -14, note: "blamed autocorrect to HR's face" } },
    ],
  },
  {
    id: "reorg",
    channel: "allhands",
    from: "Brad",
    avatar: "🧔",
    text: "“Some exciting changes to how we're organized.” Brad won't make eye contact. A new box appeared above you on the org chart.",
    minDay: 7,
    choices: [
      { label: "Befriend the new boss instantly 🤝", effect: { clout: 10, cred: -4, note: "speed-ran loyalty to a manager I'd never met" } },
      { label: "Keep your head down 🐢", effect: {} },
      { label: "Ask “what does this mean for me” on the call 🎤", effect: { clout: -5, cred: 6, receipts: 5 } },
    ],
  },
  {
    id: "glowing_intro",
    channel: "slack",
    from: "Priya",
    avatar: "👩‍💻",
    minDay: 4,
    text: "“btw I told the Director you carried the launch. you deserve it.” 🫶",
    requires: (s) => s.cred >= 60,
    choices: [
      { label: "Thank her and mean it 🥹", effect: { clout: 8, cred: 4, note: "got talked up to a Director by the one person who actually likes me" } },
      { label: "Immediately leverage it upward 📈", effect: { clout: 12, cred: -6, note: "converted Priya's kindness into a calendar invite with the Director" } },
    ],
  },
  {
    id: "quit_with_priya",
    channel: "dm",
    from: "Priya",
    avatar: "👩‍💻",
    text: "ok hear me out. we both quit, we start something, we never use the word 'synergy' again.",
    requires: (s) => s.cred >= 70 && s.day >= 8,
    choices: [
      {
        label: "Quit in a blaze of glory 🔥",
        end: { status: "quit", title: "You Quit (Iconically)", reason: "walked out with Priya to 'start something' — a group chat and a dream" },
      },
      { label: "“…for the equity though” 💎", effect: { clout: 4, note: "stayed for equity that will be worth a team lunch" } },
    ],
  },
  {
    id: "ceo_replyall",
    channel: "email",
    from: "Tyler",
    avatar: "🧃",
    text: "Tyler just hit Reply-All to the CEO's company-wide email with a single word: “bet.”",
    minDay: 5,
    choices: [
      { label: "Pretend you didn't see it 🙈", effect: {} },
      { label: "Reply-All “+1” 🤝", replyAll: true, effect: { cred: 9, clout: -8, receipts: 12, note: "'+1'-ed an intern's reply-all to the CEO" } },
      { label: "DM Tyler an exit strategy 🪂", effect: { cred: 6, note: "ran point on intern crisis comms" } },
    ],
  },

  // --- expansion: sharper tradeoffs (few free lunches) + flag callbacks --------
  {
    id: "promo_packet",
    channel: "email",
    minDay: 6,
    text: "It's promo season. You have to write your OWN case for promotion. The doc is titled “Impact.” The doc is blank.",
    choices: [
      { label: "Take credit for everything 📈", effect: { clout: 11, cred: -6, receipts: 4, note: "wrote a promo packet crediting me for Q2, morale, and the weather" } },
      { label: "Credit the team, generously 🤝", effect: { cred: 11, clout: -5, note: "wrote a promo packet that was mostly other people's names" } },
      { label: "Ask Priya to peer-review it 👀", effect: { clout: 4, cred: 4 } },
    ],
  },
  {
    id: "layoff_whisper",
    channel: "dm",
    from: "Brad",
    avatar: "🧔",
    minDay: 8,
    text: "between us. there's a list. you're not on it. Dave is. 🤐",
    choices: [
      { label: "Say nothing, feel nothing 🪨", effect: { clout: 8, receipts: 4, note: "sat on a layoff list like knowing that was a normal thing to do" } },
      { label: "Quietly tip Dave off 🫱", effect: { cred: 12, clout: -10, receipts: 6, flag: "warned_dave", note: "warned my nemesis before HR could, for reasons I still can't explain" } },
      { label: "“is the list… final?” 😬", effect: { clout: -4, cred: 3 } },
    ],
  },
  {
    id: "glassdoor",
    channel: "irl",
    minDay: 9,
    requires: (s) => s.receipts >= 35,
    text: "A scorching Glassdoor review dropped overnight. It quotes a Slack message word-for-word. Your Slack message. HR is “looking into how it got out.”",
    choices: [
      { label: "Deny everything 🙅", effect: { receipts: 6, clout: 3, note: "denied writing a Glassdoor review that opened with my own catchphrase" } },
      { label: "Take the anonymous L 🤫", effect: { receipts: -10, cred: 2 } },
      { label: "Astroturf a 5-star rebuttal ⭐", effect: { receipts: 15, clout: 5, note: "reviewed my own employer five stars, in a voice suspiciously like mine" } },
    ],
  },
  {
    id: "fish_reopened",
    channel: "hr",
    from: "Janet",
    avatar: "📋",
    requires: (s) => s.flags.framed_dave === true,
    text: "Janet: “The, um, fish matter. New information suggests it wasn't Dave.” She is looking directly at you.",
    choices: [
      { label: "Cooperate fully (deflect fully) 🕵️", effect: { receipts: 8, clout: 2, note: "cooperated with the fish investigation by pointing it at a third party" } },
      { label: "Confess, quietly 🐟", effect: { clout: -7, cred: 10, receipts: -12, note: "confessed to the fish crime and felt, briefly, clean" } },
      { label: "“follow the smell” 🔥", effect: { clout: 4, cred: -6, receipts: 14, note: "escalated a fish cover-up into a full internal conspiracy" } },
    ],
  },
  {
    id: "tyler_quit",
    channel: "slack",
    from: "Tyler",
    avatar: "🧃",
    minDay: 7,
    requires: (s) => s.flags.enabled_tyler === true,
    text: "Tyler posted a 2,000-word goodbye in #general. Paragraph 4 thanks YOU “for showing me what's possible.” 88 reactions and climbing.",
    choices: [
      { label: "“so proud 🥹” (you did this)", effect: { cred: 7, receipts: 6, note: "was publicly named as the reason an intern rage-quit" } },
      { label: "Distance yourself immediately 🏃", effect: { clout: 5, cred: -6, note: "speed-ran deniability the second the intern I radicalized imploded" } },
      { label: "DM him a recruiter 🪂", effect: { cred: 9, clout: -3, note: "helped the intern I radicalized land somewhere softer" } },
    ],
  },
  {
    id: "skip_lunch",
    channel: "dm",
    from: "The Skip",
    avatar: "🕴️",
    minDay: 6,
    requires: (s) => s.clout >= 52,
    text: "The Skip: “Lunch? Just us. I have some thoughts about your… future.” 🕴️",
    choices: [
      { label: "Go. Absorb the thoughts. 🍽️", effect: { clout: 13, cred: -7, receipts: 5, note: "had a 'future' lunch with the VP and came back changed, and feared" } },
      { label: "“can Priya join?” 🤝", effect: { cred: 8, clout: -6, note: "tried to bring a friend to a power lunch — not how power lunches work" } },
      { label: "“rain check?” (career suicide) 🌧️", effect: { clout: -12, cred: 4, note: "rain-checked a VP and watched a door close in real time" } },
    ],
  },
  {
    id: "birthday_card",
    channel: "slack",
    minDay: 3,
    text: "A card is going around for “Karen from Ops.” You have never met Karen from Ops. “Sign warmly!! 🎂”",
    choices: [
      { label: "“Happy bday Karen!! 🎉” (who?)", effect: { cred: 4 } },
      { label: "Run the whole collection 💐", effect: { clout: 6, cred: 5, receipts: 3, note: "volunteered to run a birthday collection for a stranger and now own it forever" } },
      { label: "Let it die on your desk 💀", effect: { cred: -6, receipts: 4, note: "held a birthday card hostage until the birthday had safely passed" } },
    ],
  },
  {
    id: "huddle_ambush",
    channel: "slack",
    minDay: 4,
    text: "Someone started a Slack Huddle and added you. You are unmuted. You are eating. Loudly.",
    choices: [
      { label: "Mute, swallow, “sorry — here!” 😳", effect: { clout: 2, cred: 2 } },
      { label: "Ghost the huddle 👻", effect: { clout: -5, receipts: 3 } },
      { label: "Keep eating, make it their problem 🍿", effect: { cred: 6, clout: -4, receipts: 8, note: "joined a huddle purely to chew into a hot mic" } },
    ],
  },
  {
    id: "oncall_wedding",
    channel: "calendar",
    minDay: 7,
    text: "You're on-call. The pager just went off. You are also the best man. The toast is in four minutes.",
    choices: [
      { label: "Fix it from the bathroom 🚽", effect: { clout: 12, cred: -8, receipts: 4, note: "resolved a Sev-2 from a wedding bathroom and missed the toast" } },
      { label: "Hand it off, give the toast 🥂", effect: { cred: 9, clout: -7, note: "handed off a page to be a present human being, once" } },
      { label: "Let it page someone else 📟", effect: { clout: -6, receipts: 6, note: "let the pager become a colleague's problem and my gift to myself" } },
    ],
  },
  {
    id: "open_to_work",
    channel: "dm",
    minDay: 6,
    requires: (s) => s.flags.rage_applying === true,
    text: "A recruiter: “Saw you're #OpenToWork 👀 — big fan of your work. 20 min?” You never set that banner. Someone set that banner.",
    choices: [
      { label: "Take the call (just exploring) 📞", effect: { cred: 5, receipts: 5, flag: "interviewing", note: "took a 'just exploring' recruiter call from a stall, on the clock" } },
      { label: "“not looking!” (looking) 🙈", effect: { clout: 3, cred: -2 } },
      { label: "Forward it to the whole team 😈", effect: { clout: 6, cred: -7, receipts: 12, note: "forwarded my own recruiter spam to the team as 'market-rate intel'" } },
    ],
  },
  {
    id: "slide_theft",
    channel: "calendar",
    from: "Dave",
    avatar: "😏",
    minDay: 5,
    requires: (s) => s.flags.dave_war === true,
    text: "Dave's deck is on the big screen. Slide 7 is your slide. It says “Dave.” The Skip is nodding at slide 7.",
    choices: [
      { label: "Let it slide (ha) 😐", effect: { clout: -10, cred: 3, note: "watched my own slide get a standing nod under a rival's name" } },
      { label: "“oh — that's actually mine” out loud 🎤", effect: { clout: 8, cred: -5, receipts: 9, note: "interrupted a VP's nod to reclaim slide 7 in front of the room" } },
      { label: "AirDrop the Skip the original 📲", effect: { clout: 11, cred: -3, receipts: 7, note: "AirDropped a VP timestamped proof of slide 7, mid-presentation" } },
    ],
  },
  {
    id: "wellness_day",
    channel: "email",
    from: "Janet",
    avatar: "📋",
    minDay: 8,
    text: "Surprise company-wide “Wellness Day” 🧘 — a day off! Also a launch is due tomorrow. The invite says “MANDATORY FUN.”",
    choices: [
      { label: "Rest. Actually rest. 🛌", effect: { cred: 6, clout: -6, note: "took the wellness day, then did the launch at 2am anyway" } },
      { label: "Work the whole “day off” 💻", effect: { clout: 9, cred: -6, receipts: 4, note: "spent Wellness Day conspicuously online so it counted" } },
      { label: "Beach pic, keep working 🏖️", effect: { clout: 4, receipts: 8, note: "posted a serene wellness selfie from my desk, mid-incident" } },
    ],
  },
];
