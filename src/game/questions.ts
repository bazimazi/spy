import { shuffle } from './logic'

/** All prompts work across all categories: public help must never disclose a role or category. */
export const QUESTION_PROMPTS = [
  'چه وقت‌هایی باهاش سر و کار داری؟',
  'چه چیزی درباره‌ش دوست داری؟',
  'یاد چه خاطره‌ای می‌افتی؟',
  'اگه نباشه، چی تغییر می‌کنه؟',
  'بچه‌ها و بزرگ‌ترها چه نگاه متفاوتی بهش دارن؟',
  'چه کسی بیشتر از تو باهاش آشناست؟',
  'اولین بار چطور باهاش آشنا شدی؟',
  'چه چیزی درباره‌ش ممکنه آدم رو غافلگیر کنه؟',
  'یک ویژگی خوب و یک ویژگی بدش چیه؟',
  'توی فیلم‌ها چه تصویری ازش می‌بینیم؟',
  'چه چیزی باعث می‌شه نظرت درباره‌ش عوض بشه؟',
  'اگه بخوای به یک بچه توضیحش بدی، از کجا شروع می‌کنی؟',
  'چه آدمی ازش خوشش نمی‌آد؟',
  'چه احساسی بهت می‌ده؟',
  'در گذشته با امروز چه فرقی داشته؟',
  'آدم‌ها درباره‌ش چه اشتباهی می‌کنن؟',
  'چه چیزی درباره‌ش برای همه یکسان نیست؟',
  'اگه توی یک داستان باشه، چه نقشی داره؟',
] as const

export function createQuestionDeck(previous?: string): string[] {
  const deck = shuffle(QUESTION_PROMPTS)
  // A fresh deck must not immediately repeat the last prompt of the old one.
  if (deck[0] === previous) [deck[0], deck[1]] = [deck[1]!, deck[0]!]
  return deck
}
