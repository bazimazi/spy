import { Screen } from '../components/Screen'
import { ChevronRightIcon } from '../components/Icons'
import { useBackButton } from '../platform/native'

interface GuideScreenProps {
  onClose: () => void
}

const sections = [
  {
    title: 'یک کلمه، چند جاسوس',
    body: 'شهروندها یک کلمه‌ی مشترک را می‌دانند؛ جاسوس‌ها آن را نمی‌دانند. شهروندها با سؤال‌های غیرمستقیم جاسوس را پیدا می‌کنند و جاسوس از جواب‌ها سرنخ می‌گیرد.',
  },
  {
    title: 'اول کارت‌ها را ببینید',
    body: 'گوشی را به ترتیب به بازیکنان بدهید. هر نفر کارت خودش را می‌بیند، نقش و کلمه را به خاطر می‌سپارد و دکمه‌ی پنهان کردن کارت را می‌زند. اگر راهنمای جاسوس روشن باشد، جاسوس فقط موضوع کلمه را می‌بیند.',
  },
  {
    title: 'سؤال اول با کیه؟',
    body: 'بعد از پخش کارت‌ها، یک بازیکن به صورت تصادفی برای سؤال اول انتخاب می‌شود. وقتی همه آماده شدند، گفت‌وگو را شروع کنید. از یک نفر سؤال بپرسید؛ او جواب کوتاهی بدهد و سؤال بعدی را از یک نفر دیگر بپرسد.',
  },
  {
    title: 'چه سؤالی خوبه؟',
    body: 'مثلاً بپرسید «چه وقت‌هایی باهاش سر و کار داری؟» یا «چه چیزی درباره‌ش دوست داری؟». سؤال خیلی مستقیم، کلمه را به جاسوس لو می‌دهد. خود کلمه، تعداد حرف‌ها و بخش‌هایش را نگویید.',
  },
  {
    title: 'مکث و تصمیم نهایی',
    body: 'برای وقفه می‌توانید زمان را مکث کنید یا یک دقیقه اضافه کنید. جاسوس می‌تواند برای حدس کلمه درخواست پایان گفت‌وگو بدهد. بعد از پایان زمان یا گفت‌وگو، قبل از نمایش نقش‌ها، رأی و حدس نهایی را مشخص کنید.',
  },
  {
    title: 'کی برنده می‌شه؟',
    body: 'شهروندها با پیدا کردن همه‌ی جاسوس‌ها برنده می‌شوند. اگر جاسوسی کلمه را درست حدس بزند یا جمع به اشتباه یک شهروند را جاسوس بداند، جاسوس‌ها برنده‌اند. رأی‌گیری و نتیجه را خود جمع مشخص می‌کند؛ برنامه فقط نقش‌ها و کلمه را نشان می‌دهد.',
  },
]

export function GuideScreen({ onClose }: GuideScreenProps) {
  useBackButton(onClose)
  return (
    <Screen
      topActions={
        <button type="button" className="icon-btn" aria-label="بازگشت" onClick={onClose}>
          <ChevronRightIcon />
        </button>
      }
    >
      <h1 className="title" tabIndex={-1} data-screen-title style={{ textAlign: 'center', marginBottom: 24 }}>
        راهنمای بازی
      </h1>

      <div className="scroll-area">
        <div className="guide-list">
          {sections.map((s) => (
            <article key={s.title} className="guide-item">
              <h2 className="guide-item__title">{s.title}</h2>
              <p className="guide-item__body">{s.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="footer-actions">
        <button type="button" className="btn" onClick={onClose}>
          متوجه شدم
        </button>
      </div>
    </Screen>
  )
}
