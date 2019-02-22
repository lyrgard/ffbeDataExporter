(function() {

    var exportDate;

    function onClick() {
		
		if(!confirm("Are you sure you want to allow this extension to grab your facebook auth token and login to the game servers as yourself? Press OK to Continue"))
		{
			return;
		}

        chrome.tabs.executeScript(null, { file: "/facebook.js" });

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "get_facebook_variables"});
        });
    }

    document.getElementById('export').addEventListener('click', onClick);

    chrome.runtime.onMessage.addListener(function (msg, sender, data) {
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
        } else if (msg.type == "userData") {
            exportDate = formatDate(new Date());
            addExviusDBLink(msg.data);
            addInventoryLink(msg.data);
            addUnitCollectionLink(msg.data);
        }
    });

    function addExviusDBLink(userData) {
		var baseExviusGGURL = "https://exvius.gg";
		//var baseExviusGGURL = "http://127.0.0.1:8000";
        var button = $('#exviusLink');
        button.click(function() {
            button.addClass('started');
            button.prop("disabled",true);
			var servicePayload = {"Duz1v8x9": userData["Duz1v8x9"], "uRZxw78i": userData["uRZxw78i"], "gP9TW2Bf": userData["gP9TW2Bf"],"1S8P2u9f": userData["1S8P2u9f"],"3oU9Ktb7": userData["3oU9Ktb7"],"LhVz6aD2": userData["LhVz6aD2"],"aS39Eshy": userData["aS39Eshy"],"w83oV9uP": userData["w83oV9uP"],"TJ9eL80N": userData["TJ9eL80N"],"49rQB3fP": userData["49rQB3fP"],"B71MekS8": userData["B71MekS8"],"5Eb0Rig6": userData["5Eb0Rig6"]}
            $.post( baseExviusGGURL + "/gl/p/upload/", JSON.stringify(servicePayload))
               .done(function( data3 ) {
                    button.addClass('finished');
                    button.prop("disabled",false);
                    chrome.tabs.create({active: true, url: baseExviusGGURL + "/gl/p/" + userData["LhVz6aD2"][0]["m3Wghr1j"] + "/"});
                });
        });
        button.removeClass("hidden");
        $('.or').removeClass('hidden');
    }

    function addInventoryLink(userData) {
        var ret = [];
		
        var userEquipListStringArray = userData['w83oV9uP'][0]['HpL3FM4V'].split(",");

        userEquipListStringArray.forEach(function(userEquipStr){
            var equipStrData = userEquipStr.split(':');
            var equipId = equipStrData[0];
            var equipCount = parseInt(equipStrData[1]);
            ret.push({'id':equipId, 'count':equipCount});
        });

        var userCustomEquips = userData['uRZxw78i'];
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

        var userMateriaListStringArray = userData['aS39Eshy'][0]['HpL3FM4V'].split(",");

        userMateriaListStringArray.forEach(function(userMateriaStr){
            var materiaStrData = userMateriaStr.split(':');
            var materiaId = materiaStrData[0];
            var materiaCount = parseInt(materiaStrData[1]);
            ret.push({'id':materiaId, 'count':materiaCount});
        });
		
		

        var link = $('#downloadInventory');
        link.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(ret)));
        link.attr('download', userData['LhVz6aD2'][0]['9qh17ZUf'] + "_" + exportDate + "_inventory.json");
        link.removeClass("hidden");
    }

    function addUnitCollectionLink(userData) {
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
                'level': parseInt(unitToken["7wV3QZ80"]),
                'pots': pots,
                'enhancements': skillEnhancements,
                'tmr': parseInt(unitToken["f17L8wuX"]),
                'stmr': parseInt(unitToken["o6m7L38B"])
            };
            if (unitId == "904000115") { // Prism Moogle
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

    function formatDate(d) {
        var month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs[0].url != "https://www.facebook.com/") {
            $('#container').addClass("notOnFacebook");
        } else {
            $('#container').removeClass("notOnFacebook");
        }
    });


})();