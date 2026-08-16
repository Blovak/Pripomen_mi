export function OnboardingPage() {
  return (
    <section className="page">
      <div className="eyebrow">iPhone</div>
      <h1>Přidej si aplikaci na plochu</h1>
      <ol className="steps">
        <li><span>1</span><div><strong>Otevři v Safari</strong><p>Použij tuto stránku přímo v Safari.</p></div></li>
        <li><span>2</span><div><strong>Klepni na Sdílet</strong><p>Ikona čtverce se šipkou nahoru.</p></div></li>
        <li><span>3</span><div><strong>Přidat na plochu</strong><p>Potvrď název „Připomeň mi“.</p></div></li>
        <li><span>4</span><div><strong>Spusť z nové ikony</strong><p>Potom v nastavení aplikace povol notifikace.</p></div></li>
      </ol>
      <div className="notice">Web Push na iPhonu vyžaduje iOS 16.4 nebo novější.</div>
    </section>
  )
}
