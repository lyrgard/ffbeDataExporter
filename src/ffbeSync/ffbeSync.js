/*
facebookExport button now opens directly to the FFBE mobile login gateway.
new Facebook login flow has removed need for continueFacebookExport button
*/
(function () {

    var googleLoginTabId;
    var facebookTabId;

    document.getElementById('googleExport').addEventListener('click', () => {
        
        if (!confirm("Are you sure you want to allow this extension to grab your Google auth token and login to the game servers as yourself? Press OK to Continue")) {
            return;
        }

        chrome.tabs.create({ 'url': 'https://accounts.google.com/embedded/setup/android?source=com.android.vending&xoauth_display_name=Android%20Device&ph=%2B123456789&imsi=123456789012345&canSk=1&lang=en&langCountry=en_us&hl=en-US&cc=us&use_native_navigation=0' }, (tab) => {
            googleLoginTabId = tab.id;
            var div = $("#googleToken");
            div.removeClass("notStarted");
            div.addClass("started");
        });

        $('#googleExport').addClass('hidden');
        $('#facebookExport').addClass('hidden');
        $('#how-to-use').addClass('hidden');
        $('#reinit').removeClass('hidden');

    });

    
    document.getElementById('facebookExport').addEventListener('click', () => {
        var userId = document.getElementById("userId").value;
        if (userId.length === 0) {
            alert("Please fill your facebook Id bellow");
            return;
        } else {
            chrome.runtime.sendMessage({
                type: "facebookUserId",
                data: userId
            });
        }
        if (!confirm("Are you sure you want to allow this extension to grab your Facebook auth token and login to the game servers as yourself? Press OK to Continue")) {
            return;
        }
        
        chrome.tabs.create({ 'url': 'https://m.facebook.com/login.php?skip_api_login=1&api_key=1238083776220999&signed_next=1&next=https%3A%2F%2Fm.facebook.com%2Fv3.3%2Fdialog%2Foauth%3Fredirect_uri%3Dfbconnect%253A%252F%252Fsuccess%26display%3Dtouch%26state%3D%257B%25220_auth_logger_id%2522%253A%2522792e45db-e19b-4aec-9efa-767011b65d81%2522%252C%25223_method%2522%253A%2522web_view%2522%257D%26scope%3Duser_friends%26response_type%3Dtoken%252Csigned_request%26default_audience%3Dfriends%26return_scopes%3Dtrue%26auth_type%3Drerequest%26client_id%3D1238083776220999%26ret%3Dlogin%26sdk%3Dandroid-4.40.0%26logger_id%3D792e45db-e19b-4aec-9efa-767011b65d81&cancel_url=fbconnect%3A%2F%2Fsuccess%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3D%257B%25220_auth_logger_id%2522%253A%2522792e45db-e19b-4aec-9efa-767011b65d81%2522%252C%25223_method%2522%253A%2522web_view%2522%257D%26e2e%3D%257B%2522init%2522%253A1549652357497%257D&display=touch&locale=en_US&logger_id=792e45db-e19b-4aec-9efa-767011b65d81&_rdr' }, (tab) => {
            facebookTabId = tab.id;
            chrome.runtime.sendMessage({
                type: "facebookTabId",
                data: facebookTabId
            });
        });

        $('#googleExport').addClass('hidden');
        $('#facebookExport').addClass('hidden');
        $('#how-to-use').addClass('hidden');
        $('#reinit').removeClass('hidden');
    });

    document.getElementById('reinit').addEventListener('click', () => {
        $('#googleExport').removeClass('hidden');
        $('#facebookExport').removeClass('hidden');
        $('#how-to-use').removeClass('hidden');
        $('#reinit').addClass('hidden');
        $('.started').addClass('notStarted').removeClass('started');
        $('.finished').addClass('notStarted').removeClass('finished');
        $('.inError').addClass('notStarted').removeClass('inError');
        $('.errorMessage').text('');
    });


    var exportDate;

    chrome.runtime.onMessage.addListener(function (msg, sender, data) {
        console.log("received msg: " + msg.type + " for: " + JSON.stringify(msg.data));
        if (msg.type == 'alert') {
            alert(msg.data);
        }
        else if (msg.type == "started") {
            var div = $("#" + msg.data);
            div.removeClass("notStarted");
            div.addClass("started");
        } else if (msg.type == "finished") {
            var div = $("#" + msg.data);
            div.removeClass("started");
            div.addClass("finished");
            if (msg.data === 'googleId') {
                chrome.tabs.remove(googleLoginTabId);
            }
        }
        else if (msg.type == "error") {
            var div = $("#" + msg.data);
            div.removeClass("started");
            div.addClass("inError");
            div.find('.errorMessage').text(msg.message);
        } else if (msg.type == "userData") {
            exportDate = formatDate(new Date());
            $('#downloadLinks').removeClass('hidden');
            addInventoryLink(msg.data);
            addUnitCollectionLink(msg.data);
            addEspersLink(msg.data);
            addConsumablesLink(msg.data);
        }
    });

    function addInventoryLink(data) {
        var ret = [];

        let userData = data.userData;
        let userData2 = data.userData2;
        let userData3 = data.userData3;

        var userEquipListStringArray = userData['w83oV9uP'][0]['HpL3FM4V'].split(",");

        userEquipListStringArray.forEach(function (userEquipStr) {
            var equipStrData = userEquipStr.split(':');
            var equipId = equipStrData[0];
            var equipCount = parseInt(equipStrData[1]);
            if (equipId && equipCount) {
                ret.push({ 'id': equipId, 'count': equipCount });
            }
        });

        var visionCards = userData['2Xi0wuGA'];
        visionCards.forEach(vc => {
            ret.push({ 'id': vc['5giCMUd2'], 'count': 1, 'level': vc['7wV3QZ80'] });
        })

        if (userData3 != null) {
            var userCustomEquips = userData3['uRZxw78i'];
            userCustomEquips.forEach(function (userCustomEquip) {
                var equipId = userCustomEquip["J1YX9kmM"];
                var enhancements = [];
                var customAbilityArray = userCustomEquip["nM63Zvtp"].split(",");
                customAbilityArray.forEach(function (customAbilityStr) {
                    if (customAbilityStr) {
                        var abilityId = customAbilityStr.split(":")[1];
                        enhancements.push(abilityId);
                    }
                });
                ret.push({ 'id': equipId, 'count': 1, 'enhancements': enhancements });
            });
        }

        var userMateriaListStringArray = userData['aS39Eshy'][0]['HpL3FM4V'].split(",");

        userMateriaListStringArray.forEach(function (userMateriaStr) {
            var materiaStrData = userMateriaStr.split(':');
            var materiaId = materiaStrData[0];
            var materiaCount = parseInt(materiaStrData[1]);
            if (materiaId && materiaCount) {
                ret.push({ 'id': materiaId, 'count': materiaCount });
            }
        });


        var link = $('#downloadInventory');
        link.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(ret)));
        link.attr('download', userData['LhVz6aD2'][0]['9qh17ZUf'] + "_" + exportDate + "_inventory.json");
        link.removeClass("hidden");
    }

    function addUnitCollectionLink(data) {
        let userData = data.userData;
        let userData2 = data.userData2;

        var unitSublimiation = {};

        var subInfoList = userData["Duz1v8x9"];
        subInfoList.forEach(function (subinfo) {
            var unitUniqueId = subinfo["og2GHy49"];
            var subLvl = subinfo["yjY4GK3X"];
            var subSkillId = subinfo["6bHxDEL0"];

            if (!unitSublimiation[unitUniqueId]) {
                unitSublimiation[unitUniqueId] = [];
            }
            unitSublimiation[unitUniqueId].push(subSkillId + "," + subLvl);
        });

        var ret = [];

        var unitList = userData["B71MekS8"];
        unitList.forEach(function (unitToken) {
            var unitId = unitToken["3HriTp6B"];
            var unitUniqueId = unitToken["og2GHy49"];

            var pots = {
                hp: parseInt(unitToken["em5hx4FX"].split("-")[1]),
                mp: parseInt(unitToken["L0MX7edB"].split("-")[1]),
                atk: parseInt(unitToken["o7Ynu1XP"].split("-")[1]),
                def: parseInt(unitToken["6tyb58Kc"].split("-")[1]),
                mag: parseInt(unitToken["Y9H6TWnv"].split("-")[1]),
                spr: parseInt(unitToken["sa8Ewx3H"].split("-")[1])
            };
            var doors = {
                hp: parseInt(unitToken["em5hx4FX"].split("-")[2]) || 0,
                mp: parseInt(unitToken["L0MX7edB"].split("-")[2]) || 0,
                atk: parseInt(unitToken["o7Ynu1XP"].split("-")[2]) || 0,
                def: parseInt(unitToken["6tyb58Kc"].split("-")[2]) || 0,
                mag: parseInt(unitToken["Y9H6TWnv"].split("-")[2]) || 0,
                spr: parseInt(unitToken["sa8Ewx3H"].split("-")[2]) || 0
            };

            var skillEnhancements = [];
            if (unitSublimiation[unitUniqueId]) {
                unitSublimiation[unitUniqueId].forEach(function (skillInfo) {
                    skillEnhancements.push(skillInfo.split(",")[0]);
                });
            }
            var unitData = {
                'id': unitId,
                'uniqueId': unitUniqueId,
                'level': parseInt(unitToken["7wV3QZ80"]),
                'pots': pots,
                'doors': doors,
                'enhancements': skillEnhancements,
                'tmr': parseInt(unitToken["f17L8wuX"]),
                'stmr': parseInt(unitToken["o6m7L38B"]),
                'lbLevel': parseInt(unitToken["a71oxzCH"]),
                'currentLbLevelExp': parseInt(unitToken["EXf5G3Mk"]),
                'totalExp': parseInt(unitToken["X9ABM7En"]),
                'currentLevelExp': parseInt(unitToken["B6H34Mea"]),
                'exRank': parseInt(unitToken["f8vk4JrD"]),
                'nvRarity': unitToken["T9Apq5fS"] == '1',
                'nva': unitToken["k9GFaWm1"] == '1'
            };
            if (unitId == "904000115" || unitId == "904000103") { // Prism Moogle or specific trust moogle
                var tmrId = unitToken["9mu4boy7"];
                if (tmrId) {
                    tmrId = tmrId.split(":")[1];
                    unitData['tmrId'] = tmrId;
                }
            }
            if (unitId == "906000103") { // super trust moogle
                var stmrId = unitToken["C74EmZ1I"];
                if (stmrId) {
                    stmrId = stmrId.split(":")[1];
                    unitData['stmrId'] = stmrId;
                }
            }
            ret.push(unitData);

        });

        var link = $('#downloadUnitCollection');
        link.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(ret)));
        link.attr('download', userData['LhVz6aD2'][0]['9qh17ZUf'] + "_" + exportDate + "_units.json");
        link.removeClass("hidden");
    }

    function addConsumablesLink(data) {
        let userData = data.userData;
        let ret = [];
        var itemList = userData["4rC0aLkA"];
        itemList.forEach(function (itemToken) {
            let itemCSV = itemToken["HpL3FM4V"];
            var array = itemCSV.split(',');
            array.forEach(function (array) {
                let itemId = array.split(":")[0];
                let itemQty = array.split(":")[1];
                var consumble = {
                    'itemId': itemId,
                    'itemQty': itemQty
                };
                ret.push(consumble);
            });
        });
        var link = $('#downloadConsumables');
        link.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(ret)));
        link.attr('download', userData['LhVz6aD2'][0]['9qh17ZUf'] + "_" + exportDate + "_consumables.json");
        link.removeClass("hidden");
    }

    function addEspersLink(data) {
        let userData = data.userData;

        let ret = [];
        let map = {};

        userData["gP9TW2Bf"].forEach(e => {
            let esper = {
                "id": e["Iwfx42Wo"],
                "rarity": parseInt(e["9fW0TePj"]),
                "level": parseInt(e["7wV3QZ80"])
            };
            map[esper.id] = esper;
            ret.push(esper);

        });
        userData["1S8P2u9f"].forEach(e => {
            map[e["Iwfx42Wo"]].board = e["E8WRi1bg"];
        });


        var link = $('#downloadEspers');
        link.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(ret)));
        link.attr('download', userData['LhVz6aD2'][0]['9qh17ZUf'] + "_" + exportDate + "_espers.json");
        link.removeClass("hidden");
    }

    function formatDate(d) {
        var month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }
})();
