(function() {

    var googleLoginTabId;
    var facebookTabId;

    document.getElementById('googleExport').addEventListener('click', () => {
        if(!confirm("Are you sure you want to allow this extension to grab your Google auth token and login to the game servers as yourself? Press OK to Continue")) {
            return;
        }

        chrome.tabs.create({'url':'https://accounts.google.com/embedded/setup/android?source=com.android.vending&xoauth_display_name=Android%20Device&ph=%2B123456789&imsi=123456789012345&canSk=1&lang=en&langCountry=en_us&hl=en-US&cc=us&use_native_navigation=0'}, (tab) => {
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
        if(!confirm("Are you sure you want to allow this extension to grab your Facebook auth token and login to the game servers as yourself? Press OK to Continue")) {
            return;
        }

        chrome.tabs.create({'url':'https://www.facebook.com'}, (tab) => {
            facebookTabId = tab.id;
            chrome.runtime.sendMessage({
                type:"facebookTabId",
                data: facebookTabId
            });
        });
        $('#googleExport').addClass('hidden');
        $('#facebookExport').addClass('hidden');
        $('#continueFacebookExport').removeClass('hidden');
        $('#how-to-use').addClass('hidden');
        $('#reinit').removeClass('hidden');
    });


    document.getElementById('continueFacebookExport').addEventListener('click', () => {
        chrome.tabs.executeScript(facebookTabId, { file: "/facebook.js" });
        setTimeout(() => chrome.tabs.sendMessage(facebookTabId, {type: "get_facebook_variables"}), 200);
        $('#continueFacebookExport').addClass('hidden');
    });

    document.getElementById('reinit').addEventListener('click', () => {
        $('#googleExport').removeClass('hidden');
        $('#facebookExport').removeClass('hidden');
        $('#continueFacebookExport').addClass('hidden');
        $('#how-to-use').removeClass('hidden');
        $('#reinit').addClass('hidden');
        $('.started').addClass('notStarted').removeClass('started');
    });


    var exportDate;
	
    chrome.runtime.onMessage.addListener(function (msg, sender, data) {
		console.log("received msg: " + msg.type + " for: " + msg.data);
        if (msg.type == 'alert') {
            alert(msg.data);
        } else if (msg.type == "started") {
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
        } else if (msg.type == "userData") {
            exportDate = formatDate(new Date());
            $('#downloadLinks').removeClass('hidden');
            addInventoryLink(msg.data);
            addUnitCollectionLink(msg.data);
            addEspersLink(msg.data);
        }
    });
		
    function addInventoryLink(data) {
        var ret = [];

        let userData = data.userData;
        let userData2 = data.userData2;

        var userEquipListStringArray = userData['w83oV9uP'][0]['HpL3FM4V'].split(",");

        userEquipListStringArray.forEach(function(userEquipStr){
            var equipStrData = userEquipStr.split(':');
            var equipId = equipStrData[0];
            var equipCount = parseInt(equipStrData[1]);
            if (equipId && equipCount) {
                ret.push({'id': equipId, 'count': equipCount});
            }
        });

		if (userData2 != null)
		{
			var userCustomEquips = userData2['uRZxw78i'];
			userCustomEquips.forEach(function(userCustomEquip){
				var equipId = userCustomEquip["J1YX9kmM"];
				var enhancements = [];
				var customAbilityArray = userCustomEquip["nM63Zvtp"].split(",");
				customAbilityArray.forEach(function(customAbilityStr){
				   if (customAbilityStr) {
					   var abilityId = customAbilityStr.split(":")[1];
					   enhancements.push(abilityId);
					}
				});
				ret.push({'id':equipId, 'count':1, 'enhancements': enhancements});
			});
		}

        var userMateriaListStringArray = userData['aS39Eshy'][0]['HpL3FM4V'].split(",");

        userMateriaListStringArray.forEach(function(userMateriaStr){
            var materiaStrData = userMateriaStr.split(':');
            var materiaId = materiaStrData[0];
            var materiaCount = parseInt(materiaStrData[1]);
            if (materiaId && materiaCount) {
                ret.push({'id': materiaId, 'count': materiaCount});
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
        subInfoList.forEach(function(subinfo) {
            var unitUniqueId = subinfo["og2GHy49"];
            var subLvl = subinfo["yjY4GK3X"];
            var subSkillId = subinfo["6bHxDEL0"];

            if (!unitSublimiation[unitUniqueId]){
                unitSublimiation[unitUniqueId] = [];
            }
            unitSublimiation[unitUniqueId].push(subSkillId + "," + subLvl);
        });

        var ret = [];

        var unitList = userData["B71MekS8"];
        unitList.forEach(function(unitToken) {
            var unitId = unitToken["3HriTp6B"];
            var unitUniqueId = unitToken["og2GHy49"];

            var pots = {
                hp:parseInt(unitToken["em5hx4FX"].split("-")[1]),
                mp:parseInt(unitToken["L0MX7edB"].split("-")[1]),
                atk:parseInt(unitToken["o7Ynu1XP"].split("-")[1]),
                def:parseInt(unitToken["6tyb58Kc"].split("-")[1]),
                mag:parseInt(unitToken["Y9H6TWnv"].split("-")[1]),
                spr:parseInt(unitToken["sa8Ewx3H"].split("-")[1])
            }

            var skillEnhancements = [];
            if (unitSublimiation[unitUniqueId]) {
                unitSublimiation[unitUniqueId].forEach(function(skillInfo){
                    skillEnhancements.push(skillInfo.split(",")[0]);
                });
            }
            var unitData = {
                'id': unitId,
                'uniqueId': unitUniqueId,
                'level': parseInt(unitToken["7wV3QZ80"]),
                'pots': pots,
                'enhancements': skillEnhancements,
                'tmr': parseInt(unitToken["f17L8wuX"]),
                'stmr': parseInt(unitToken["o6m7L38B"])
            };
            if (unitId == "904000115" || unitId == "904000103") { // Prism Moogle or specific trust moogle
                var tmrId = unitToken["9mu4boy7"];
                if (tmrId) {
                    tmrId = tmrId.split(":")[1];
                    unitData['tmrId'] = tmrId;
                }
            }
            ret.push(unitData);

        });

        var link = $('#downloadUnitCollection');
        link.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(ret)));
        link.attr('download', userData['LhVz6aD2'][0]['9qh17ZUf'] + "_" + exportDate + "_units.json");
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