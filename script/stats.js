async function load_stats(request=""){
    if (request){
        var input = request;
    } else {
        var input = document.getElementById("input").value;
    }
    if (input){
        document.getElementById("stats_data").classList.add("d-none");
        document.getElementById("stats_error").classList.add("d-none");
        document.getElementById("stats_spinner").classList.remove("d-none");

        try {
            var [id, name] = await get_player(input);
            const response = await fetch(`https://api.hglabor.de/stats/ffa/${id}`);
            if (!response.ok) throw new Error(`Stats für ${input} nicht gefunden`);
            var player = await response.json();
        } catch {
            icon = "";
            to_page("stats");
            document.getElementById("stats_spinner").classList.add("d-none");
            document.getElementById("stats_error").innerText = `${input}
            existiert nicht
            oder hat noch nie
            HeroFFA gespielt.`;
            document.getElementById("stats_error").classList.remove("d-none");
            return;
        }

        if (request){
            document.getElementById("input").value = name;
        }
    
        document.getElementById("stats_name").innerText = name;
        document.getElementById("stats_xp").innerText = player.xp;
        document.getElementById("stats_kills").innerText = player.kills;
        document.getElementById("stats_streak").innerText = player.currentKillStreak;
        document.getElementById("stats_max_streak").innerText = player.highestKillStreak;
        document.getElementById("stats_deaths").innerText = player.deaths;
        document.getElementById("stats_bounty").innerText = player.bounty;

        document.getElementById("stats_skin").src = `https://www.mc-heads.net/body/${id}/100`;
        document.getElementById("stats_skin").alt = `Minecraft Skin von ${name}`;

        document.getElementById("favicon").href = `https://www.mc-heads.net/avatar/${id}`;
        icon = `https://www.mc-heads.net/avatar/${id}`;

        // hero abilities
        var set_hero = true;
        for (const hero in heroes){
            if (player.heroes[hero]){
                document.getElementById(`to_${hero}`).disabled = false;
                if (set_hero != false) {
                    to_hero(hero);
                    set_hero = false;
                }
                var current = heroes[hero];
                var abilities = current.properties;
                var div = document.getElementById(`${hero}_div`);
                div.innerHTML = "";
                for (const ability in abilities){
                    if (player.heroes[hero][ability]){
                        var ability_table = add_ability(ability, div);
                        for (const attribute of abilities[ability]){
                            var attribute_name = attribute.name.replace(/ /g, "_").toLowerCase();
                            if (attribute.maxLevel != 0 && player.heroes[hero][ability][attribute_name]){
                                add_attribute(attribute, player.heroes[hero][ability][attribute_name].experiencePoints, ability_table);
                            }
                        }
                    }
                }
            } else {
                document.getElementById(`to_${hero}`).disabled = true;
            }
        } 

        document.getElementById("stats_spinner").classList.add("d-none");
        document.getElementById("stats_data").classList.remove("d-none");
    }
}

function add_ability(ability, div){
    var ability_display = ability.split("_").map(part => {
        return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");

    div.innerHTML += `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button"
                        data-bs-toggle="collapse" data-bs-target="#${ability}_item" 
                        aria-expanded="false" aria-controls="${ability}_item"
                >
                ${ability_display}
                </button>
            </h2>
            <div id="${ability}_item" class="accordion-collapse collapse" data-bs-parent="#${div.id}">
                <div class="accordion-body">
                    <table class="table table-borderless" id="${ability}_table" style="width: 100%;"></table>
                </div>
            </div>
        </div>
    `;

    return document.getElementById(`${ability}_table`);
}

function add_attribute(attribute, xp, table){
    let roman_numerals = {
        0: "",
        1: "I",
        2: "II",
        3: "III",
        4: "IV",
        5: "V",
        6: "VI",
        7: "VII",
        8: "VIII",
        9: "IX",
        10: "X"
    };

    var level = Math.trunc(Math.cbrt(xp / attribute.levelScale));
    var level_string =  roman_numerals[level];
    if (attribute.maxLevel > level){
        //                XP seit dem letzten Levelaufstieg            XP, das vom aktuellen bis zum nächsten Level benötigt wird            %
        var progress = (xp - attribute.levelScale * level**3) / (attribute.levelScale * (level + 1)**3 - attribute.levelScale * level**3) * 100;
        var next_level_string = roman_numerals[level+1];
    } else {
        var progress = 100;
        var next_level_string = "<span class='badge text-bg-warning'>max</span> " + level_string;
        level_string = "";
    }

    var value = attribute.baseValue;
    if (level != 0){
        switch(attribute.modifier.type.split(".").at(-1)){
            case "AddValueTotal":
                attribute.modifier.steps.slice(0, level).forEach(step => {
                    value += step;
                });
                break;
            case "MultiplyBase":
                value *= attribute.modifier.steps[level - 1];
                break;
        }
    }

    let row = table.insertRow(-1);
    row.innerHTML = `
        <td>
            <table class="text-nowrap mb-2" style="width: 100%;">
                <tr>
                    <td class="text-start" style="width: 20%;">
                        ${level_string}
                    </td>
                    <td class="text-center">
                        ${attribute.name}: ${value}${attribute.type.split(".").at(-1) == "CooldownProperty" ? "s" : ""}
                    </td>
                    <td class="text-end" style="width: 20%;">
                        ${next_level_string}
                    </td>
                </tr>
            </table>
            <div class="progress" role="progressbar" aria-label="${attribute.name} Fortschritt" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar overflow-visible " style="width: ${progress}%;">${Math.round(progress*100)/100}%</div>
            </div>
        </td>
    `;
}

function to_hero(hero){
    for (var name in heroes){
        document.getElementById(name).classList.add("d-none");
        document.getElementById(`to_${name}`).classList.remove("active");
    }
    document.getElementById(hero).classList.remove("d-none");
    document.getElementById(`to_${hero}`).classList.add("active");
}

async function load_heroes(){
    const response = await fetch("https://api.hglabor.de/ffa/heroes");
    if (!response.ok) throw new Error(`Konnte ${hero} Details nicht fetchen`);
    const available_heroes = await response.json();
    for (hero of available_heroes){
        const response = await fetch(`https://api.hglabor.de/ffa/hero/${hero}`);
        if (!response.ok) throw new Error(`Konnte ${hero} Details nicht fetchen`);
        heroes[hero] = await response.json();

        document.getElementById("hero_buttons").innerHTML += `
            <button id="to_${hero}" type="button" class="btn btn-primary" onclick="to_hero('${hero}')">
                ${hero.charAt(0).toUpperCase()+hero.slice(1)}
            </button>
        `;
        document.getElementById("hero_data").innerHTML += `
            <div id="${hero}">
                <div class="d-flex justify-content-center text-center">
                    <div class="accordion m-4" id="${hero}_div"></div>
                </div>
            </div>
        `;
    }
}
