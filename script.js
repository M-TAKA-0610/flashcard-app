(function () {
  "use strict";

  // ===== 保存（localStorage） =====
  var KEYS = {
    words: "itFlashcards.words.v1",
    progress: "itFlashcards.progress.v1",
    settings: "itFlashcards.settings.v1"
  };

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // プライベートモードなどで保存できない場合は、そのまま動作を続ける
    }
  }

  function cloneDefaults() {
    return (window.DEFAULT_WORDS || []).map(function (w) {
      return { id: w.id, term: w.term, reading: w.reading, desc: w.desc, category: w.category };
    });
  }

  function isValidWord(w) {
    return w && typeof w.id === "string" && typeof w.term === "string" &&
      typeof w.desc === "string" && typeof w.category === "string";
  }

  var storedWords = load(KEYS.words, null);
  var words = Array.isArray(storedWords) && storedWords.every(isValidWord)
    ? storedWords
    : cloneDefaults();

  // progress: { 単語ID: "known" | "unknown" }
  var progress = load(KEYS.progress, {});
  if (!progress || typeof progress !== "object") progress = {};

  var settings = load(KEYS.settings, {});
  settings = {
    category: typeof settings.category === "string" ? settings.category : "all",
    onlyUnknown: !!settings.onlyUnknown,
    currentId: typeof settings.currentId === "string" ? settings.currentId : null
  };

  function saveWords() { save(KEYS.words, words); }
  function saveProgress() { save(KEYS.progress, progress); }
  function saveSettings() { save(KEYS.settings, settings); }

  // ===== 要素 =====
  function $(id) { return document.getElementById(id); }

  var el = {
    chips: $("categoryChips"),
    onlyUnknown: $("onlyUnknown"),
    stats: $("stats"),
    shuffleBtn: $("shuffleBtn"),
    counterNow: $("counterNow"),
    counterTotal: $("counterTotal"),
    progressBar: $("progressBar"),
    cardArea: $("cardArea"),
    card: $("card"),
    category: $("cardCategory"),
    no: $("cardNo"),
    noBack: $("cardNoBack"),
    badge: $("markBadge"),
    badgeBack: $("markBadgeBack"),
    term: $("cardTerm"),
    reading: $("cardReading"),
    backTerm: $("cardBackTerm"),
    desc: $("cardDesc"),
    empty: $("emptyState"),
    emptyTitle: $("emptyTitle"),
    emptyText: $("emptyText"),
    emptyAction: $("emptyAction"),
    prevBtn: $("prevBtn"),
    nextBtn: $("nextBtn"),
    knownBtn: $("knownBtn"),
    unknownBtn: $("unknownBtn"),
    openManageBtn: $("openManageBtn"),
    manageSheet: $("manageSheet"),
    searchInput: $("searchInput"),
    addWordBtn: $("addWordBtn"),
    listCount: $("listCount"),
    wordList: $("wordList"),
    resetProgressBtn: $("resetProgressBtn"),
    resetWordsBtn: $("resetWordsBtn"),
    formModal: $("formModal"),
    form: $("wordForm"),
    formTitle: $("formTitle"),
    formError: $("formError"),
    deleteWordBtn: $("deleteWordBtn"),
    categoryOptions: $("categoryOptions"),
    toast: $("toast")
  };

  // ===== デッキ（表示中のカードの並び） =====
  var deck = [];          // 表示する単語IDの配列
  var current = 0;        // deck 内の位置
  var shuffleRank = null; // シャッフル中は { id: 乱数 }

  function findWord(id) {
    for (var i = 0; i < words.length; i++) {
      if (words[i].id === id) return words[i];
    }
    return null;
  }

  function categories() {
    var list = [];
    words.forEach(function (w) {
      if (list.indexOf(w.category) === -1) list.push(w.category);
    });
    return list;
  }

  function inCategory(w) {
    return settings.category === "all" || w.category === settings.category;
  }

  function buildDeck(keepId) {
    if (settings.category !== "all" && categories().indexOf(settings.category) === -1) {
      settings.category = "all";
    }
    var list = words.filter(function (w) {
      return inCategory(w) && !(settings.onlyUnknown && progress[w.id] === "known");
    });
    if (shuffleRank) {
      list.sort(function (a, b) {
        return (shuffleRank[a.id] || 0) - (shuffleRank[b.id] || 0);
      });
    }
    deck = list.map(function (w) { return w.id; });

    var idx = keepId ? deck.indexOf(keepId) : -1;
    if (idx !== -1) {
      current = idx;
    } else {
      current = Math.min(current, Math.max(deck.length - 1, 0));
    }
  }

  // ===== 描画 =====
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function renderChips() {
    var cats = ["all"].concat(categories());
    el.chips.textContent = "";
    cats.forEach(function (cat) {
      var inCat = words.filter(function (w) { return cat === "all" || w.category === cat; });
      var known = inCat.filter(function (w) { return progress[w.id] === "known"; }).length;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-chip" + (settings.category === cat ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", settings.category === cat ? "true" : "false");

      var name = document.createElement("span");
      name.textContent = cat === "all" ? "すべて" : cat;
      var count = document.createElement("span");
      count.className = "cat-count";
      count.textContent = known + "/" + inCat.length;
      btn.appendChild(name);
      btn.appendChild(count);

      btn.addEventListener("click", function () {
        if (settings.category === cat) return;
        settings.category = cat;
        current = 0;
        buildDeck(null);
        resetToFront();
        render();
        playSlide(1);
        saveSettings();
        btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      });
      el.chips.appendChild(btn);
    });
  }

  function renderStats() {
    var inCat = words.filter(inCategory);
    var known = inCat.filter(function (w) { return progress[w.id] === "known"; }).length;
    el.stats.innerHTML = "";
    var strong = document.createElement("strong");
    strong.textContent = known;
    el.stats.appendChild(document.createTextNode("覚えた "));
    el.stats.appendChild(strong);
    el.stats.appendChild(document.createTextNode(" / " + inCat.length));
  }

  function setBadge(node, status) {
    node.className = "mark-badge" + (status ? " is-" + status : "");
    node.textContent = status === "known" ? "✓ 覚えた" : status === "unknown" ? "✕ まだ" : "";
  }

  function render() {
    renderChips();
    renderStats();

    var hasCards = deck.length > 0;
    el.card.hidden = !hasCards;
    el.empty.hidden = hasCards;
    el.prevBtn.disabled = !hasCards || current === 0;
    el.nextBtn.disabled = !hasCards || current >= deck.length - 1;
    el.knownBtn.disabled = !hasCards;
    el.unknownBtn.disabled = !hasCards;
    el.counterNow.textContent = hasCards ? pad(current + 1) : "00";
    el.counterTotal.textContent = pad(deck.length);
    el.progressBar.style.width = hasCards ? ((current + 1) / deck.length * 100) + "%" : "0";

    if (!hasCards) {
      renderEmpty();
      settings.currentId = null;
      return;
    }

    var word = findWord(deck[current]);
    var no = "No." + pad(words.indexOf(word) + 1);
    el.category.textContent = word.category;
    el.no.textContent = no;
    el.noBack.textContent = no;
    el.term.textContent = word.term;
    el.reading.textContent = word.reading || "";
    el.backTerm.textContent = word.term;
    el.desc.textContent = word.desc;
    setBadge(el.badge, progress[word.id]);
    setBadge(el.badgeBack, progress[word.id]);

    settings.currentId = word.id;
  }

  function renderEmpty() {
    var inCat = words.filter(inCategory);
    if (inCat.length === 0) {
      el.emptyTitle.textContent = "単語がありません";
      el.emptyText.textContent = "「単語管理」から単語を追加してください。";
      el.emptyAction.textContent = "単語を追加する";
      el.emptyAction.onclick = function () { openForm(null); };
    } else {
      el.emptyTitle.textContent = "すべて覚えました！";
      el.emptyText.textContent = (settings.category === "all" ? "全" : "「" + settings.category + "」の") +
        inCat.length + "語をすべて覚えました。";
      el.emptyAction.textContent = "すべてのカードを表示";
      el.emptyAction.onclick = function () {
        settings.onlyUnknown = false;
        el.onlyUnknown.checked = false;
        current = 0;
        buildDeck(null);
        render();
        saveSettings();
      };
    }
  }

  // 裏面のまま次のカードの説明が見えないよう、アニメーションなしで表面に戻す
  function resetToFront() {
    el.card.classList.add("is-changing");
    el.card.classList.remove("is-flipped");
    void el.card.offsetWidth;
    el.card.classList.remove("is-changing");
  }

  function playSlide(direction) {
    el.cardArea.classList.remove("slide-next", "slide-prev");
    void el.cardArea.offsetWidth;
    el.cardArea.classList.add(direction > 0 ? "slide-next" : "slide-prev");
  }

  // ===== 操作 =====
  function goTo(index, direction) {
    if (index < 0 || index >= deck.length || index === current) return;
    current = index;
    resetToFront();
    render();
    playSlide(direction);
    saveSettings();
  }

  function next() { goTo(current + 1, 1); }
  function prev() { goTo(current - 1, -1); }

  function flip() {
    if (!deck.length) return;
    el.card.classList.toggle("is-flipped");
  }

  function shuffle() {
    shuffleRank = {};
    words.forEach(function (w) { shuffleRank[w.id] = Math.random(); });
    current = 0;
    buildDeck(null);
    resetToFront();
    render();
    playSlide(1);
    saveSettings();
    showToast("カードをシャッフルしました");
  }

  var marking = false;

  function mark(status) {
    if (!deck.length || marking) return;
    var id = deck[current];
    progress[id] = status;
    saveProgress();

    marking = true;
    el.cardArea.classList.remove("flash-known", "flash-unknown");
    void el.cardArea.offsetWidth;
    el.cardArea.classList.add("flash-" + status);
    setBadge(el.badge, status);
    setBadge(el.badgeBack, status);
    renderStats();
    renderChips();

    setTimeout(function () {
      marking = false;
      el.cardArea.classList.remove("flash-known", "flash-unknown");

      if (settings.onlyUnknown && status === "known") {
        // 未習得のみ表示中は、覚えたカードをデッキから外す（同じ位置に次のカードが来る）
        buildDeck(null);
        resetToFront();
        render();
        if (deck.length) playSlide(1);
      } else if (current < deck.length - 1) {
        next();
      } else {
        render();
        showToast("最後のカードです");
      }
      saveSettings();
    }, 320);
  }

  // ===== トースト =====
  var toastTimer = null;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove("is-show");
    }, 2000);
  }

  // ===== モーダル共通 =====
  var lastFocus = null;

  function openOverlay(node, focusTarget) {
    lastFocus = document.activeElement;
    node.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(function () {
      node.classList.add("is-open");
      if (focusTarget) focusTarget.focus();
    });
  }

  function closeOverlay(node) {
    node.classList.remove("is-open");
    node.hidden = true;
    if (el.manageSheet.hidden && el.formModal.hidden) {
      document.body.classList.remove("no-scroll");
    }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  [el.manageSheet, el.formModal].forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest("[data-close]")) {
        closeOverlay(overlay);
      }
    });
  });

  function anyOverlayOpen() {
    return !el.manageSheet.hidden || !el.formModal.hidden;
  }

  // ===== 単語管理（一覧） =====
  function renderList() {
    var q = el.searchInput.value.trim().toLowerCase();
    var list = words.filter(function (w) {
      if (!q) return true;
      return (w.term + " " + (w.reading || "") + " " + w.desc + " " + w.category)
        .toLowerCase().indexOf(q) !== -1;
    });

    el.listCount.textContent = q
      ? list.length + "件ヒット（全" + words.length + "語）"
      : "全" + words.length + "語";
    el.wordList.textContent = "";

    if (!list.length) {
      var li = document.createElement("li");
      li.className = "word-empty";
      li.textContent = "該当する単語がありません";
      el.wordList.appendChild(li);
      return;
    }

    var frag = document.createDocumentFragment();
    list.forEach(function (w) {
      var item = document.createElement("li");
      item.className = "word-item";

      var main = document.createElement("button");
      main.type = "button";
      main.className = "word-main";
      main.setAttribute("aria-label", w.term + "のカードを表示");

      var dot = document.createElement("span");
      dot.className = "status-dot" + (progress[w.id] ? " is-" + progress[w.id] : "");
      dot.title = progress[w.id] === "known" ? "覚えた" : progress[w.id] === "unknown" ? "まだ" : "未学習";

      var text = document.createElement("span");
      text.className = "word-text";
      var term = document.createElement("span");
      term.className = "word-term";
      term.textContent = w.term;
      var cat = document.createElement("span");
      cat.className = "word-cat";
      cat.textContent = w.category;
      text.appendChild(term);
      text.appendChild(cat);

      main.appendChild(dot);
      main.appendChild(text);
      main.addEventListener("click", function () { jumpTo(w.id); });

      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "row-btn";
      edit.textContent = "編集";
      edit.setAttribute("aria-label", w.term + "を編集");
      edit.addEventListener("click", function () { openForm(w.id); });

      item.appendChild(main);
      item.appendChild(edit);
      frag.appendChild(item);
    });
    el.wordList.appendChild(frag);
  }

  function jumpTo(id) {
    var word = findWord(id);
    if (!word) return;
    // 表示中の条件で見えない単語なら、条件を解除して表示する
    if (!inCategory(word)) settings.category = "all";
    if (settings.onlyUnknown && progress[id] === "known") {
      settings.onlyUnknown = false;
      el.onlyUnknown.checked = false;
    }
    buildDeck(id);
    resetToFront();
    render();
    playSlide(1);
    saveSettings();
    closeOverlay(el.manageSheet);
  }

  // ===== 追加・編集フォーム =====
  var editingId = null;

  function openForm(id) {
    editingId = id;
    var word = id ? findWord(id) : null;
    el.formTitle.textContent = word ? "単語を編集" : "単語を追加";
    el.deleteWordBtn.hidden = !word;
    el.formError.textContent = "";

    var f = el.form.elements;
    f.term.value = word ? word.term : "";
    f.reading.value = word ? (word.reading || "") : "";
    f.category.value = word ? word.category
      : (settings.category !== "all" ? settings.category : "");
    f.desc.value = word ? word.desc : "";

    el.categoryOptions.textContent = "";
    categories().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      el.categoryOptions.appendChild(opt);
    });

    openOverlay(el.formModal, f.term);
  }

  function newId() {
    return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  el.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = el.form.elements;
    var data = {
      term: f.term.value.trim(),
      reading: f.reading.value.trim(),
      category: f.category.value.trim(),
      desc: f.desc.value.trim()
    };

    if (!data.term || !data.category || !data.desc) {
      el.formError.textContent = "用語・カテゴリ・説明を入力してください。";
      (!data.term ? f.term : !data.category ? f.category : f.desc).focus();
      return;
    }
    var duplicate = words.some(function (w) {
      return w.id !== editingId && w.term.toLowerCase() === data.term.toLowerCase();
    });
    if (duplicate) {
      el.formError.textContent = "「" + data.term + "」はすでに登録されています。";
      f.term.focus();
      return;
    }

    var keepId;
    if (editingId) {
      var word = findWord(editingId);
      word.term = data.term;
      word.reading = data.reading;
      word.category = data.category;
      word.desc = data.desc;
      keepId = word.id;
      showToast("「" + data.term + "」を更新しました");
    } else {
      data.id = newId();
      words.push(data);
      keepId = data.id;
      showToast("「" + data.term + "」を追加しました");
    }
    saveWords();
    closeOverlay(el.formModal);

    // 追加・編集したカードを表示する
    if (!inCategory(findWord(keepId))) settings.category = "all";
    if (settings.onlyUnknown && progress[keepId] === "known") {
      settings.onlyUnknown = false;
      el.onlyUnknown.checked = false;
    }
    buildDeck(keepId);
    resetToFront();
    render();
    renderList();
    saveSettings();
  });

  el.deleteWordBtn.addEventListener("click", function () {
    var word = findWord(editingId);
    if (!word) return;
    if (!confirm("「" + word.term + "」を削除しますか？\nこの操作は元に戻せません。")) return;

    var wasCurrent = deck[current] === word.id;
    words = words.filter(function (w) { return w.id !== word.id; });
    delete progress[word.id];
    saveWords();
    saveProgress();
    closeOverlay(el.formModal);

    buildDeck(wasCurrent ? null : deck[current]);
    resetToFront();
    render();
    renderList();
    saveSettings();
    showToast("「" + word.term + "」を削除しました");
  });

  // ===== イベント =====
  // スワイプ（スマートフォン）
  var touchStartX = 0;
  var touchStartY = 0;
  var swiped = false;

  el.card.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    swiped = false;
  }, { passive: true });

  el.card.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      if (dx < 0) { next(); } else { prev(); }
    }
  }, { passive: true });

  el.card.addEventListener("click", function () {
    if (swiped) {
      swiped = false;
      return;
    }
    flip();
  });

  // マウスホイールでカテゴリを横スクロール（PC）
  el.chips.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.chips.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  el.prevBtn.addEventListener("click", prev);
  el.nextBtn.addEventListener("click", next);
  el.knownBtn.addEventListener("click", function () { mark("known"); });
  el.unknownBtn.addEventListener("click", function () { mark("unknown"); });
  el.shuffleBtn.addEventListener("click", shuffle);

  el.onlyUnknown.addEventListener("change", function () {
    settings.onlyUnknown = el.onlyUnknown.checked;
    var keep = deck[current];
    buildDeck(keep);
    resetToFront();
    render();
    saveSettings();
  });

  el.openManageBtn.addEventListener("click", function () {
    el.searchInput.value = "";
    renderList();
    openOverlay(el.manageSheet, null);
  });
  el.searchInput.addEventListener("input", renderList);
  el.addWordBtn.addEventListener("click", function () { openForm(null); });

  el.resetProgressBtn.addEventListener("click", function () {
    if (!confirm("「覚えた・まだ」の学習記録をすべてリセットしますか？")) return;
    progress = {};
    saveProgress();
    buildDeck(deck[current]);
    render();
    renderList();
    showToast("学習記録をリセットしました");
  });

  el.resetWordsBtn.addEventListener("click", function () {
    if (!confirm("単語を初期状態（" + (window.DEFAULT_WORDS || []).length +
      "語）に戻しますか？\n自分で追加・編集した内容は消えます。")) return;
    words = cloneDefaults();
    var ids = {};
    words.forEach(function (w) { ids[w.id] = true; });
    Object.keys(progress).forEach(function (id) {
      if (!ids[id]) delete progress[id];
    });
    saveWords();
    saveProgress();
    current = 0;
    buildDeck(null);
    resetToFront();
    render();
    renderList();
    saveSettings();
    showToast("単語を初期状態に戻しました");
  });

  // キーボード（PC）
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!el.formModal.hidden) closeOverlay(el.formModal);
      else if (!el.manageSheet.hidden) closeOverlay(el.manageSheet);
      return;
    }
    if (anyOverlayOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      mark("known");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      mark("unknown");
    } else if ((e.key === " " || e.key === "Enter") && tag !== "BUTTON") {
      e.preventDefault();
      flip();
    }
  });

  // ===== 起動 =====
  el.onlyUnknown.checked = settings.onlyUnknown;
  buildDeck(settings.currentId);
  render();
  saveSettings();
})();
