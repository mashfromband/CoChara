'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-800">
      <div className="container mx-auto px-4 py-12">
        <header className="flex justify-between items-center mb-12">
          <Link href="/" className="text-3xl font-bold text-white">CoChara</Link>
          <Link href="/" className="bg-white text-indigo-700 px-6 py-2 rounded-full font-medium hover:bg-indigo-100 transition-colors">
            ホームに戻る
          </Link>
        </header>

        <main className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-8 text-center">CoChara について</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 border-b border-white/20 pb-2">アプリケーションの概要</h2>
            <p className="text-lg mb-4">
              CoCharaは、ユニークなキャラクターを育成し、コンテンツを共有できるプラットフォームです。
              特別な卵から生まれるキャラクターは、あなたの関わり方によって成長し、進化していきます。
            </p>
            <p className="text-lg">
              友達とキャラクターを共有したり、キャラクターと一緒にコンテンツを作成したりすることで、
              あなただけの特別な体験を創り出すことができます。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 border-b border-white/20 pb-2">キャラクターの育成</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-2">卵の選択</h3>
                <p className="mb-4">
                  キャラクターは様々な特性を持つ卵から生まれます。卵の種類によって、
                  キャラクターの初期特性や成長パターンが異なります。
                </p>
                <p>
                  レアな卵を集めることで、特別な能力を持つキャラクターを育てることができます。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">進化と成長</h3>
                <p className="mb-4">
                  キャラクターはレベルが上がると進化のチャンスを得ます。進化の選択肢は
                  キャラクターの特性や、あなたの関わり方によって変化します。
                </p>
                <p>
                  独自の進化ルートを探索し、世界に一つだけのキャラクターを育てましょう。
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 border-b border-white/20 pb-2">コンテンツ共有</h2>
            <p className="text-lg mb-4">
              キャラクターと一緒にコンテンツを作成し、友達と共有することができます。
              キャラクターの特性を活かしたコンテンツを作成することで、より魅力的な作品に仕上がります。
            </p>
            <p className="text-lg">
              また、他のユーザーのキャラクターとコラボレーションすることで、新しい可能性を探ることもできます。
            </p>
          </section>

          <div className="text-center mt-12">
            <Link href="/character/create" className="bg-white text-indigo-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-indigo-100 transition-colors inline-block">
              キャラクターを作る
            </Link>
          </div>
        </main>

        <footer className="mt-12 pt-8 border-t border-white/20 text-white/60 text-center">
          <p>© 2023 CoChara. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}