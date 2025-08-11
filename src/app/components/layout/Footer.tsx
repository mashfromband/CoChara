import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ロゴと説明 */}
          <div>
            <Link href="/" className="text-xl font-bold flex items-center">
              <span className="mr-2">🥚</span>
              <span>CoChara</span>
            </Link>
            <p className="mt-3 text-gray-400">
              あなただけのキャラクターを育てよう。
              卵から始まる新しい冒険。
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="text-lg font-semibold mb-4">リンク</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/character/create" className="text-gray-400 hover:text-white transition-colors">
                  卵ガチャ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  CoChara について
                </Link>
              </li>
            </ul>
          </div>

          {/* お問い合わせ */}
          <div>
            <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
            <p className="text-gray-400">
              ご質問やフィードバックがありましたら、お気軽にお問い合わせください。
            </p>
            <Link 
              href="/contact" 
              className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
            >
              お問い合わせ
            </Link>
          </div>
        </div>

        {/* コピーライト */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>© {currentYear === 2025 ? '2025' : `2025-${currentYear}`} CoChara. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;