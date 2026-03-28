const tbody_ = document.querySelector(".tbody");

const url_ =
  "https://docs.google.com/spreadsheets/d/1SyFA2P5r4ETjk-Pi6bslTfMYuJn9XiL9524yEyqISfU/gviz/tq?sheet=Messages_";

fetch(url_)
  .then((response) => response.text())
  .then((data) => {
    const jsonPart = data.split("setResponse(")[1];
    const jsonText = jsonPart.slice(0, jsonPart.length - 2);
    const toJson = JSON.parse(jsonText);
    const rows_ = toJson.table.rows;
    rows_.sort((a, b) => {
      const xpA = a.c[2] ? a.c[2].v : 0;
      const xpB = b.c[2] ? b.c[2].v : 0;
      return xpB - xpA;
    });
    const maxXP = Math.max(...rows_.map((row) => (row.c[2] ? row.c[2].v : 0)));
    const top3 = [rows_[1], rows_[0], rows_[2]];

    top3.forEach((player, index) => {
      const alias = player.c[0] ? player.c[0].v : "";
      const xp = player.c[2] ? player.c[2].v : 0;
      const cards = document.querySelectorAll(".podium-card");
      cards[index].querySelector(".podium-name").textContent = alias;
      cards[index].querySelector(".podium-xp").textContent = xp + " XP";
    });
    rows_.forEach((item, index) => {
      const alias = item.c[0] ? item.c[0].v : "";
      const level = item.c[1] ? item.c[1].v : "";
      const xp = item.c[2] ? item.c[2].v : 0;
      const percent = Math.round((xp / maxXP) * 100);

      const tr_ = document.createElement("tr");
      tr_.innerHTML = `
  <td>${index + 1}</td>
  <td>${alias}</td>
  <td>${level}</td>
  <td>
    <div>${xp}</div>
    <div class="xp-bar-wrap">
      <div class="xp-bar" style="width: ${percent}%"></div>
    </div>
  </td>
`;

      tbody_.appendChild(tr_);
    });
  })
  .catch((error) => console.log(error));
