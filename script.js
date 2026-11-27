(function () {
  "use strict";

  // 情報技術に関する基本用語（20個）
  var WORDS = [
    {
      term: "CPU",
      reading: "Central Processing Unit / 中央処理装置",
      desc: "コンピュータの頭脳にあたる装置。プログラムの命令を解釈・実行し、演算や各装置の制御を行う。性能はクロック周波数やコア数などで表される。"
    },
    {
      term: "メモリ",
      reading: "主記憶装置 / RAM",
      desc: "CPUが処理するプログラムやデータを一時的に保存する装置。読み書きが高速だが、電源を切ると内容が消える（揮発性）。"
    },
    {
      term: "OS",
      reading: "Operating System / オペレーティングシステム",
      desc: "ハードウェアを管理し、アプリケーションが動作するための基盤を提供する基本ソフトウェア。Windows、macOS、Linux、Android、iOS などがある。"
    },
    {
      term: "アルゴリズム",
      reading: "Algorithm",
      desc: "問題を解決するための明確な手順のこと。同じ問題でも手順によって処理時間や必要なメモリ量が異なり、計算量（O記法）で効率を評価する。"
    },
    {
      term: "データ構造",
      reading: "Data Structure",
      desc: "データを効率よく扱うための格納・整理の方法。配列、連結リスト、スタック、キュー、木構造、ハッシュテーブルなどがある。"
    },
    {
      term: "コンパイラ",
      reading: "Compiler",
      desc: "C言語などの高水準言語で書かれたソースコードを、実行前にまとめて機械語などの低水準な形式に翻訳するプログラム。"
    },
    {
      term: "インタプリタ",
      reading: "Interpreter",
      desc: "ソースコードを1命令ずつ解釈しながら実行するプログラム。事前の翻訳が不要で手軽に実行できる。Python や JavaScript の実行環境などで使われる。"
    },
    {
      term: "IPアドレス",
      reading: "Internet Protocol Address",
      desc: "ネットワーク上の機器を識別するための番号。IPv4 は32ビット（例: 192.168.0.1）、IPv6 は128ビットで表される。"
    },
    {
      term: "DNS",
      reading: "Domain Name System",
      desc: "「example.com」のようなドメイン名と IPアドレスを対応付ける仕組み。人が覚えやすい名前で Web サイトなどにアクセスできるようにする。"
    },
    {
      term: "TCP/IP",
      reading: "Transmission Control Protocol / Internet Protocol",
      desc: "インターネットで標準的に使われる通信プロトコル群。IP が宛先までの経路制御を、TCP がデータを確実に順序どおり届ける役割を担う。"
    },
    {
      term: "HTTP / HTTPS",
      reading: "Hypertext Transfer Protocol (Secure)",
      desc: "Web ブラウザと Web サーバの間でデータをやり取りするためのプロトコル。HTTPS は TLS で通信を暗号化し、盗聴や改ざんを防ぐ。"
    },
    {
      term: "データベース",
      reading: "Database / DB",
      desc: "データを整理して蓄積し、検索・更新しやすくしたもの。表形式でデータを管理するリレーショナルデータベース（RDB）が代表的。"
    },
    {
      term: "SQL",
      reading: "Structured Query Language",
      desc: "リレーショナルデータベースを操作するための言語。SELECT（検索）、INSERT（追加）、UPDATE（更新）、DELETE（削除）などの命令がある。"
    },
    {
      term: "API",
      reading: "Application Programming Interface",
      desc: "ソフトウェア同士が機能やデータをやり取りするための窓口・取り決め。Web API を使うと、外部サービスの機能を自分のプログラムから利用できる。"
    },
    {
      term: "オブジェクト指向",
      reading: "Object-Oriented Programming / OOP",
      desc: "データとそれを操作する処理をひとまとまりの「オブジェクト」として扱うプログラミングの考え方。カプセル化・継承・ポリモーフィズムが主な特徴。"
    },
    {
      term: "バグ",
      reading: "Bug",
      desc: "プログラムに含まれる誤りや欠陥のこと。バグを見つけて取り除く作業を「デバッグ」という。"
    },
    {
      term: "暗号化",
      reading: "Encryption",
      desc: "データを第三者に読めない形に変換すること。同じ鍵で暗号化・復号する共通鍵暗号と、公開鍵と秘密鍵のペアを使う公開鍵暗号がある。"
    },
    {
      term: "ファイアウォール",
      reading: "Firewall",
      desc: "ネットワークの境界で通信を監視し、あらかじめ決めたルールに基づいて不正な通信を遮断するセキュリティの仕組み。"
    },
    {
      term: "クラウドコンピューティング",
      reading: "Cloud Computing",
      desc: "サーバやストレージ、ソフトウェアなどをインターネット経由で必要な分だけ利用する形態。提供範囲によって IaaS・PaaS・SaaS に分類される。"
    },
    {
      term: "バージョン管理",
      reading: "Version Control / 例: Git",
      desc: "ファイルの変更履歴を記録・管理する仕組み。過去の状態に戻したり、複数人で並行して開発した変更を統合したりできる。Git が代表的なツール。"
    }
  ];

  var cardEl = document.getElementById("card");
  var cardArea = cardEl.parentElement;
  var termEl = document.getElementById("cardTerm");
  var readingEl = document.getElementById("cardReading");
  var backTermEl = document.getElementById("cardBackTerm");
  var descEl = document.getElementById("cardDesc");
  var counterEl = document.getElementById("counter");
  var progressEl = document.getElementById("progressBar");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var shuffleBtn = document.getElementById("shuffleBtn");

  var order = WORDS.map(function (_, i) { return i; });
  var current = 0;

  function render() {
    var word = WORDS[order[current]];
    termEl.textContent = word.term;
    readingEl.textContent = word.reading;
    backTermEl.textContent = word.term;
    descEl.textContent = word.desc;

    counterEl.textContent = (current + 1) + " / " + WORDS.length;
    progressEl.style.width = ((current + 1) / WORDS.length * 100) + "%";

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === WORDS.length - 1;
  }

  // 裏面のまま次のカードの説明が見えないよう、アニメーションなしで表面に戻す
  function resetToFront() {
    cardEl.classList.add("is-changing");
    cardEl.classList.remove("is-flipped");
    void cardEl.offsetWidth; // 強制リフロー
    cardEl.classList.remove("is-changing");
  }

  function playSlide(direction) {
    cardArea.classList.remove("slide-next", "slide-prev");
    void cardArea.offsetWidth;
    cardArea.classList.add(direction > 0 ? "slide-next" : "slide-prev");
  }

  function goTo(index, direction) {
    if (index < 0 || index >= WORDS.length || index === current) return;
    current = index;
    resetToFront();
    render();
    playSlide(direction);
  }

  function next() { goTo(current + 1, 1); }
  function prev() { goTo(current - 1, -1); }

  function flip() {
    cardEl.classList.toggle("is-flipped");
  }

  function shuffle() {
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    current = 0;
    resetToFront();
    render();
    playSlide(1);
  }

  // スワイプ操作（スマートフォン）
  var touchStartX = 0;
  var touchStartY = 0;
  var swiped = false;
  var SWIPE_THRESHOLD = 50;

  cardEl.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    swiped = false;
  }, { passive: true });

  cardEl.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      if (dx < 0) { next(); } else { prev(); }
    }
  }, { passive: true });

  cardEl.addEventListener("click", function () {
    if (swiped) {
      swiped = false;
      return;
    }
    flip();
  });

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  shuffleBtn.addEventListener("click", shuffle);

  // キーボード操作（PC）
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if ((e.key === " " || e.key === "Enter") && document.activeElement !== cardEl &&
               !(document.activeElement && document.activeElement.tagName === "BUTTON")) {
      // カード以外にフォーカスがある場合も Space / Enter で裏返す
      e.preventDefault();
      flip();
    }
  });

  render();
})();
