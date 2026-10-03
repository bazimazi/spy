import { Screen } from '../components/Screen'
import { ChevronRightIcon } from '../components/Icons'

interface GuideScreenProps {
  onClose: () => void
}

const sections = [
  {
    title: 'توضیحات بازی',
    body: 'بازی جاسوس بازی فوق‌العاده هیجان‌انگیز و جذاب است. میان شما یک یا چند نفر جاسوس وجود دارد و مابقی افراد یک کلمه (مثلاً «کتابخانه») را می‌دانند. همه باید با سؤال کردن از هم سعی کنند جاسوس را پیدا کنند.',
  },
  {
    title: 'طرف‌های بازی',
    body: 'افرادی که کلمه را می‌دانند (شهروند) و افرادی که نمی‌دانند (جاسوس). تعداد جاسوس‌ها به انتخاب خود شما است.',
  },
  {
    title: 'شرط پیروزی',
    body: 'شهروندها باید جاسوس‌ها را پیدا و حذف کنند، اما حواسشان باشد جاسوس‌ها متوجه کلمه نشوند. اگر جاسوسی کلمه را درست حدس بزند یا با رأی‌گیری یک شهروند را خارج کند، جاسوس‌ها برنده می‌شوند.',
  },
  {
    title: 'طریقه بازی',
    body: 'گوشی را به ترتیب به بازیکنان بدهید تا هرکس متوجه شود جاسوس است یا کلمه را بداند، سپس بحث را شروع کنید.',
  },
  {
    title: 'قوانین بازی',
    body: 'حق ندارید بپرسید چند حرف است و یا چند بخش دارد!',
  },
  {
    title: 'جمع‌بندی',
    body: 'اگر جاسوس شدید سعی کنید دیگران را گول بزنید و یا کلمه را بفهمید. اگر شهروند هستید سؤال‌های خوب بپرسید تا جاسوس را پیدا کنید.',
  },
]

export function GuideScreen({ onClose }: GuideScreenProps) {
  return (
    <Screen
      topActions={
        <button type="button" className="icon-btn" aria-label="بازگشت" onClick={onClose}>
          <ChevronRightIcon />
        </button>
      }
    >
      <h1 className="title" style={{ textAlign: 'center', marginBottom: 16 }}>
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
