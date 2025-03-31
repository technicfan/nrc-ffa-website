function loading_rank(fn){
    return async function(){
        document.getElementById("rank_error").classList.add("d-none");
        document.getElementById("rank_data").classList.remove("d-none");
        var button = document.getElementById("load_more");
        let spinner = "<span class='spinner-border spinner-border-sm' aria-hidden='true'></span>";
        button.disabled = true;
        button.innerHTML = `${spinner} Lade gerade...`;

        try {
            var end = await fn.apply(this, arguments);
        } catch {
            document.getElementById("rank_data").classList.add("d-none");
            document.getElementById("rank_error").classList.remove("d-none");
        }

        if (end == true){
            button.innerHTML = "Ende erreicht";
            return;
        }

        button.disabled = false;
        button.innerHTML = "Mehr laden";
    }
}

async function fill_rank(){
    if (!list || (page === Math.floor((rank_item_number)/100))){
        list = await load_top(sort);
    }
    var start = rank_item_number - (page - 1) * 100;
    let rows_html = await Promise.all(
        list.slice(start, start + steps).map(async (item, index) => {
            html = await add_rank_item(index + 1 + rank_item_number, item);
            return html;
        })
    )
    let table = document.getElementById("rank_table")
    rows_html.forEach(row_html => {
        let row = table.insertRow(-1);
        row.className = "rank_row";
        row.innerHTML = row_html;
    })

    rank_item_number += steps;

    if (rank_item_number - 100 * (page - 1) > list.length){
        return true;
    }
}

async function add_rank_item(number, player){
    let name = await get_player(player.playerId);
    let color = "class='badge text-bg-none'";
    switch(number){
        case 1:
            color = "class='badge text-bg-warning'";
            break;
        case 2:
            color = "class='badge text-bg-secondary'";
            break;
        case 3:
            color = "class='badge' style='background-color: #cd7f32;'";
            break;
    }
    html = `
    <tr>
        <td class="align-middle"><span ${color}>${number}</span></td>
        <td class="rank_name align-middle text-start" onclick="stats_from_rank('${name[0]}')">
            <image class="rounded d-inline" alt="Minecraft Kopf von ${name[1]}"
                   src="https://www.mc-heads.net/avatar/${name[1]}/35"
                   style="margin-right: 6pt;"
            >${name[1]}
        </td>
        <td class="align-middle">${player.kills}</td>
        <td class="align-middle">${player.xp}</td>
        <td class="align-middle">${player.currentKillStreak}</td>
        <td class="align-middle">${player.bounty}</td>
    <tr>
    `;
    return html;
}

async function load_top(sort_by){
    page = Math.floor(rank_item_number / 100) + 1;
    const response = await fetch(`https://api.hglabor.de/stats/ffa/top?sort=${sort_by}&page=${page}`);
    if (response.ok){
        const top = await response.json();
        return top;
    } else {
        throw new Error("Fehler beim Fetchen der Top Liste");
    }
}

async function new_sort_rank(e){
    document.querySelectorAll(".rank_row").forEach(row => { 
        document.getElementById("rank_table").deleteRow(row.parentElement.rowIndex);
    });
    document.querySelectorAll(".rank_col").forEach(element => {
        element.style.setProperty("text-decoration", "none");
    });
    e.style.setProperty("text-decoration", "underline");
    
    rank_item_number = 0;
    if (e.id != sort || page > 1){
        list = await load_top(e.id);
        sort = e.id;
    }
    await fill_rank();
}

function stats_from_rank(id){
    to_page("stats");
    load_stats(id);
}
