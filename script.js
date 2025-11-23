document.addEventListener("DOMContentLoaded", () => {
  const field = document.getElementById("field");
  const screenArea = document.getElementById("screen-area");
  const town = document.getElementById("town");
  const shopMenu = document.getElementById("shop-menu");
  const battle = document.getElementById("battle");
  const battleLog = document.getElementById("battle-log");
  const playerHPText = document.getElementById("player-hp");
  const enemyHPText = document.getElementById("enemy-hp");
  const goldDisplay = document.getElementById("gold-display");
  const weaponDisplay = document.getElementById("weapon-display");
  const mpDisplay = document.getElementById("mp-display");
  const messageBox = document.getElementById("message-box");
  const magicMenu = document.getElementById("magic-menu");
  const itemMenu = document.getElementById("item-menu");
  const battleEnemyImg = document.getElementById("battle-enemy-img");

  // 画像リスト（ファイル名が正しいか確認してください）
  const enemyImages = [
    "enemy7.png",  // 炎
    "enemy8.png",  // カエル
    "enemy9.png",  // ゴースト
    "enemy10.png"  // 爆弾
  ];

  // ★設定：マップサイズと表示範囲
  const MAP_SIZE = 20;   // 全体のマップの広さ
  const VIEW_SIZE = 7;   // 画面に表示するマス数（奇数が望ましい）
  const VIEW_RADIUS = Math.floor(VIEW_SIZE / 2); // 中心からの半径(3)

  let mapData = [];
  let playerX = Math.floor(MAP_SIZE / 2);
  let playerY = Math.floor(MAP_SIZE / 2);
  
  let inTown = false;
  let inBattle = false;

  // ステータス
  let playerHP = 30;
  const maxHP = 30;
  let playerMP = 10;
  let enemyHP = 10;
  let gold = 50; // 初期所持金
  let weapon = "なし";
  let items = { "回復薬": 2 };

  const weaponPower = {
    "なし": 1,
    "木の剣": 3,
    "鉄の剣": 7,
    "伝説の剣": 20
  };

  // マップ自動生成
  function generateMap() {
    mapData = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      let row = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        let tile = 0; // 0:草原
        if (Math.random() < 0.08) tile = 2; // 8%:敵(ゴブリン)
        if (Math.random() < 0.01) tile = 1; // 1%:街
        row.push(tile);
      }
      mapData.push(row);
    }
    // スタート地点周辺を安全に
    for(let y=playerY-1; y<=playerY+1; y++){
      for(let x=playerX-1; x<=playerX+1; x++){
        if(y>=0 && y<MAP_SIZE && x>=0 && x<MAP_SIZE) mapData[y][x] = 0;
      }
    }
    mapData[playerY][playerX-1] = 1; // 近くに街を配置
  }

  function showMessage(text) {
    messageBox.textContent = text;
    messageBox.classList.remove("hidden");
    setTimeout(() => { messageBox.classList.add("hidden"); }, 2000);
  }

  function updateDisplays() {
    goldDisplay.textContent = `💰:${gold} G`;
    weaponDisplay.textContent = `⚔️:${weapon}`;
    mpDisplay.textContent = `💧:${playerMP}`;
  }

  // ★重要：カメラ追従描画システム
  function drawField() {
    field.innerHTML = "";
    // プレイヤーを中心に表示範囲を計算
    const startX = playerX - VIEW_RADIUS;
    const startY = playerY - VIEW_RADIUS;

    for (let y = startY; y < startY + VIEW_SIZE; y++) {
      for (let x = startX; x < startX + VIEW_SIZE; x++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");

        // マップ範囲外のチェック
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
          cell.classList.add("tile-wall"); // 範囲外は壁
        } else {
          const tile = mapData[y][x];
          if (tile === 1) cell.classList.add("tile-city");
          else if (tile === 2) cell.classList.add("tile-enemy");
          else cell.classList.add("tile-empty");
        }
        field.appendChild(cell);
      }
    }
    
    // 主人公マーカーを中央に追加
    if(!document.querySelector('.player-marker')){
        const marker = document.createElement('div');
        marker.classList.add('player-marker');
        screenArea.appendChild(marker);
    }
  }

  function movePlayer(dx, dy) {
    if (inTown) {
      if (dx !== 0 || dy === -1) { // 横か上移動で街を出る
        inTown = false;
        town.classList.add("hidden");
        shopMenu.classList.add("hidden");
      } else if (dy === 1) { // 下キーで店
        shopMenu.classList.toggle("hidden");
      }
      return;
    }
    if (inBattle) return;

    const newX = playerX + dx;
    const newY = playerY + dy;

    // マップ範囲内かチェック
    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
      playerX = newX;
      playerY = newY;
      drawField(); // 移動したら再描画（これで視点が動く）

      const tile = mapData[newY][newX];
      if (tile === 1) {
        inTown = true;
        town.classList.remove("hidden");
        showMessage("街についた！");
      } else if (tile === 2) {
        startBattle();
      }
    }
  }

  function startBattle() {
    inBattle = true;
    battle.classList.remove("hidden");
    
    // 敵設定
    const enemyLevel = Math.floor(Math.random() * 5);
    enemyHP = 15 + (enemyLevel * 8);
    // 画像パスの生成（パスが正しいか要確認）
    const randomImgFile = enemyImages[Math.floor(Math.random() * enemyImages.length)];
    battleEnemyImg.src = `./${randomImgFile}`; 
    
    // プレイヤーHP回復(簡易)
    playerHP = maxHP;

    updateHP();
    battleLog.textContent = "魔物があらわれた！";
    magicMenu.classList.add("hidden");
    itemMenu.classList.add("hidden");
  }

  function updateHP() {
    playerHPText.textContent = `勇者HP：${playerHP}/${maxHP}`;
    enemyHPText.textContent = `敵HP：${enemyHP}`;
  }

  function enemyTurn() {
    if(!inBattle) return;
    const damage = Math.floor(Math.random() * 6) + 3;
    playerHP -= damage;
    battleLog.textContent = `敵の攻撃！${damage}のダメージを受けた！`;
    updateHP();

    if (playerHP <= 0) {
      battleLog.textContent = "勇者は倒れてしまった……。";
      setTimeout(() => {
        alert("GAME OVER...");
        location.reload();
      }, 1500);
    }
  }

  // コマンド処理
  document.querySelectorAll(".command").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!inBattle) return;
      const cmd = btn.textContent;
      magicMenu.classList.add("hidden");
      itemMenu.classList.add("hidden");

      if (cmd === "戦う") {
        const base = Math.floor(Math.random() * 5) + 3;
        const damage = base + weaponPower[weapon];
        enemyHP -= damage;
        battleLog.textContent = `勇者の攻撃！${damage}のダメージ！`;
        updateHP();
        checkWinOrTurn();
      } else if (cmd === "にげる") {
        if(Math.random() < 0.6){
            battleLog.textContent = "うまくにげきれた！";
            setTimeout(endBattle, 1000);
        } else {
            battleLog.textContent = "にげられなかった！";
            setTimeout(enemyTurn, 1000);
        }
      } else if (cmd === "まほう") {
        magicMenu.classList.remove("hidden");
      } else if (cmd === "どうぐ") {
        itemMenu.classList.remove("hidden");
      }
    });
  });

  function checkWinOrTurn() {
    if (enemyHP <= 0) {
      const earned = 20 + Math.floor(Math.random() * 30);
      gold += earned;
      updateDisplays();
      battleLog.textContent = `敵をたおした！${earned}G手に入れた！`;
      // マップの敵を消す
      mapData[playerY][playerX] = 0;
      drawField();
      setTimeout(endBattle, 1500);
    } else {
      setTimeout(enemyTurn, 1200);
    }
  }

  function endBattle() {
    inBattle = false;
    battle.classList.add("hidden");
  }

  // 魔法・アイテム・買い物（省略せず実装）
  document.querySelectorAll(".magic-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const cost = Number(btn.dataset.cost);
      if(playerMP < cost){ showMessage("MPが足りない！"); return;}
      playerMP -= cost;
      updateDisplays();
      if(btn.dataset.name === "ファイア"){
          const dmg = 15 + Math.floor(Math.random()*5);
          enemyHP -= dmg;
          battleLog.textContent = `ファイア！敵に${dmg}の大ダメージ！`;
      } else {
          playerHP = maxHP;
          battleLog.textContent = `ヒール！HPが全回復した！`;
      }
      updateHP();
      magicMenu.classList.add("hidden");
      checkWinOrTurn();
    });
  });

  document.querySelectorAll(".item-use-btn").forEach(btn => {
      btn.addEventListener("click", () => {
          if(items["回復薬"] > 0){
              items["回復薬"]--;
              playerHP = Math.min(playerHP + 20, maxHP);
              battleLog.textContent = "回復薬を使った！HPが20回復した。";
              updateHP();
              itemMenu.classList.add("hidden");
              setTimeout(enemyTurn, 1000);
          } else {
              showMessage("回復薬を持っていない！");
          }
      });
  });

  document.querySelectorAll(".item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const price = Number(btn.dataset.price);
      if (gold >= price) {
        gold -= price;
        weapon = btn.dataset.name;
        updateDisplays();
        showMessage(`${weapon}を装備した！`);
      } else {
        showMessage("お金が足りないようだ…。");
      }
    });
  });

  // 操作入力
  const handleInput = (key) => {
      if(key === "ArrowUp" || key === "up") movePlayer(0, -1);
      if(key === "ArrowDown" || key === "down") movePlayer(0, 1);
      if(key === "ArrowLeft" || key === "left") movePlayer(-1, 0);
      if(key === "ArrowRight" || key === "right") movePlayer(1, 0);
  };
  document.addEventListener("keydown", (e) => handleInput(e.key));
  ["up","down","left","right"].forEach(id => {
      document.getElementById(id).addEventListener("click", () => handleInput(id));
  });

  // 開始処理
  generateMap();
  updateDisplays();
  drawField();
});