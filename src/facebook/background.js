var fb_dstg, jazoest;

chrome.runtime.onMessage.addListener(function (msg, sender, data) {
    if (msg.type == 'facebook_variables') {
        fb_dstg = msg.data.fb_dstg;
        jazoest = msg.data.jazoest;
        console.log("fb_dstg: " + fb_dstg);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "start_get_facebook_token"});
        });
    }
});

chrome.webNavigation.onCompleted.addListener(function(details) {
    if (details.url && details.url.match(/dialog\/oauth/)) {
        var reg = /&state=(.*?)&scope/g;
        var match = reg.exec(details.url);
        var state = match[1];
        var origPayload = "fb_dtsg=" + fb_dstg.replace(":","%3A") + "&jazoest=" + jazoest + "&from_post=1&app_id=1238083776220999&redirect_uri=fbconnect%3A%2F%2Fsuccess&fallback_redirect_uri=&display=touch&access_token=&sdk=android-4.40.0&user_code=&encoded_state=" + state + "&read=&write=&extended=&confirm=&insecure=&insecure_new_user=&reauthorize=&original_redirect_uri=&sheet_name=initial&sdk_version=&screen_height=0&screen_width=0&seen_scopes=&return_format=return_scopes%2Cdenied_scopes%2Csigned_request%2Caccess_token&domain=&sso_device=&auth_type=rerequest&auth_nonce=&auth_token=&default_audience=friends&ref=Default&logger_id=ab638e3b-b6b3-4c04-9ede-62eb006be525&user_code=&nonce=&install_nonce=i2FoAnXpQHSCREmK&__CONFIRM__=Continue";
        $.post( "https://m.facebook.com/v3.2/dialog/oauth/confirm", origPayload)
            .done(function( data ) {
                var tokenReg = /access_token=(.*?)&/;
                var tokenMatch = tokenReg.exec(data);
                var fbToken = tokenMatch[1];

                chrome.runtime.sendMessage({type:"finished", data:"facebookToken"});
                chrome.runtime.sendMessage({type:"started", data:"facebookId"});
                chrome.tabs.update({
                    url: "https://facebook.com"
                });

                var fbUrl = "https://graph.facebook.com/v3.2/me?access_token=" + fbToken + "&fields=id%2Cname%2Cfirst_name%2Clast_name%2Cinstalled%2Cemail%2Cpicture.type(small)&format=json&sdk=android";

                $.get(fbUrl)
                    .done(function(fbResponse)
                    {
                        var fbID = fbResponse["id"];
                        chrome.runtime.sendMessage({type:"finished", data:"facebookId"});
                        chrome.runtime.sendMessage({type:"started", data:"ffbeConnect"});
                        getUserData(fbID, fbToken);
                    });


            })
            .fail(function( jqXHR, textStatus, errorThrown ) {
                console.log(errorThrown);
            });
    }
}, {
    url: [{
        // Runs on example.com, example.net, but also example.foo.com
        hostContains: '.facebook.'
    }],
});

var requestFilter = {
        urls: ["https://m.facebook.com/v3.2/dialog/oauth/confirm"]
    },

    extraInfoSpec = ['requestHeaders', 'blocking'],
    handler = function(details) {
//alert("inside req");
        var isRefererSet = false;
        var headers = details.requestHeaders,
            blockingResponse = {};

        for (var i = 0, l = headers.length; i < l; ++i) {
            if (headers[i].name == 'Origin') {
                headers[i].value = "https://m.facebook.com";
                isRefererSet = true;
                break;
            }
        }

        if (!isRefererSet) {
            headers.push({
                name: "Origin",
                value: "https://m.facebook.com"
            });
        }

        blockingResponse.requestHeaders = headers;
        return blockingResponse;
    };

chrome.webRequest.onBeforeSendHeaders.addListener(handler, requestFilter, extraInfoSpec);

function getUserData(fbID, fbToken)
{

    console.log("getUserDate");
    var fb_dstg = "";
    var jazoest = "";

    var key = "rVG09Xnt\0\0\0\0\0\0\0\0";
    var key2 = "rcsq2eG7\0\0\0\0\0\0\0\0";
    var key3 = "7VNRi6Dk\0\0\0\0\0\0\0\0";
    var token = "";

    var keyUtf8 = CryptoJS.enc.Utf8.parse(key);
    var key2Utf8 = CryptoJS.enc.Utf8.parse(key2);
    var key3Utf8 = CryptoJS.enc.Utf8.parse(key2);


    var testPayload = "{\"LhVz6aD2\":[{\"9Tbns0eI\":null,\"9qh17ZUf\":null,\"6Nf5risL\":\"0\",\"io30YcLA\":\"Nexus 6P_android6.0\",\"K1G4fBjF\":\"2\",\"e8Si6TGh\":\"\",\"U7CPaH9B\":null,\"1WKh6Xqe\":\"ver.2.7.0.1\",\"64anJRhx\":\"2019-02-08 11:15:15\",\"Y76dKryw\":null,\"6e4ik6kA\":\"\",\"NggnPgQC\":\"\",\"X6jT6zrQ\":null,\"DOFV3qRF\":null,\"P_FB_TOKEN\":\"" + fbToken + "\",\"P_FB_ID\":\"" + fbID + "\"}],\"Euv8cncS\":[{\"K2jzG6bp\":\"0\"}],\"c1qYg84Q\":[{\"a4hXTIm0\":\"F_APP_VERSION_IOS\",\"wM9AfX6I\":\"10000\"},{\"a4hXTIm0\":\"F_RSC_VERSION\",\"wM9AfX6I\":\"0\"},{\"a4hXTIm0\":\"F_MST_VERSION\",\"wM9AfX6I\":\"377\"}]}";
    var encrypted = CryptoJS.AES.encrypt(testPayload, keyUtf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
    var finalPayload = "{\"TEAYk6R1\":{\"ytHoz4E2\":\"75527\",\"z5hB3P01\":\"75fYdNxq\"},\"t7n6cVWf\":{\"qrVcDe48\":\"" + encrypted.ciphertext.toString(CryptoJS.enc.Base64) + "\"}}"


    $.post( "https://lapis340v-gndgr.gumi.sg/lapisProd/app/php/gme/actionSymbol/fSG1eXI9.php", finalPayload)
        .done(function( data ) {
            var encryptedPayload = data['t7n6cVWf']['qrVcDe48'];
            var decrypted = CryptoJS.AES.decrypt({
                ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload.toString())
            }, keyUtf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});

            var jsonResponse = $.parseJSON(CryptoJS.enc.Utf8.stringify(decrypted));
            var secondPayload = "{\"LhVz6aD2\":[{\"JC61TPqS\":\"" + jsonResponse["LhVz6aD2"][0]["JC61TPqS"] + "\",\"m3Wghr1j\":\"" + jsonResponse["LhVz6aD2"][0]["m3Wghr1j"] + "\",\"mESKDlqL\":\"" + jsonResponse["LhVz6aD2"][0]["mESKDlqL"] + "\",\"iVN1HD3p\":\"" + jsonResponse["LhVz6aD2"][0]["iVN1HD3p"] + "\",\"9K0Pzcpd\":\"10000\",\"X6jT6zrQ\":\"10101870574910143\",\"9Tbns0eI\":\"" + jsonResponse["LhVz6aD2"][0]["9Tbns0eI"] + "\",\"9qh17ZUf\":\"" + jsonResponse["LhVz6aD2"][0]["9qh17ZUf"] + "\",\"6Nf5risL\":\"" + jsonResponse["LhVz6aD2"][0]["6Nf5risL"] + "\",\"io30YcLA\":\"Nexus 6P_android6.0\",\"K1G4fBjF\":\"2\",\"e8Si6TGh\":\"" + jsonResponse["LhVz6aD2"][0]["e8Si6TGh"] + "\",\"U7CPaH9B\":\"" + jsonResponse["LhVz6aD2"][0]["U7CPaH9B"] + "\",\"1WKh6Xqe\":\"ver.2.7.0.1\",\"64anJRhx\":\"2019-02-08 11:15:15\",\"Y76dKryw\":null,\"6e4ik6kA\":\"\",\"NggnPgQC\":\"\",\"DOFV3qRF\":null,\"P_FB_TOKEN\":null,\"P_FB_ID\":null}],\"QCcFB3h9\":[{\"qrVcDe48\":\"" +jsonResponse["QCcFB3h9"][0]["qrVcDe48"] + "\"}],\"Euv8cncS\":[{\"K2jzG6bp\":\"0\"}],\"c1qYg84Q\":[{\"a4hXTIm0\":\"F_APP_VERSION_IOS\",\"wM9AfX6I\":\"10000\"},{\"a4hXTIm0\":\"F_RSC_VERSION\",\"wM9AfX6I\":\"0\"},{\"a4hXTIm0\":\"F_MST_VERSION\",\"wM9AfX6I\":\"10000\"}]}";
            var secondEncrypted = CryptoJS.AES.encrypt(secondPayload, key2Utf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});

            var secondFinalPayload = "{\"TEAYk6R1\":{\"ytHoz4E2\":\"75528\",\"z5hB3P01\":\"X07iYtp5\"},\"t7n6cVWf\":{\"qrVcDe48\":\"" + secondEncrypted.ciphertext.toString(CryptoJS.enc.Base64) + "\"}}";

            chrome.runtime.sendMessage({type:"finished", data:"ffbeConnect"});
            chrome.runtime.sendMessage({type:"started", data:"ffbeUserData"});

            $.post( "https://lapis340v-gndgr.gumi.sg/lapisProd/app/php/gme/actionSymbol/u7sHDCg4.php", secondFinalPayload)
                .done(function( data2 ) {
                    var encryptedPayload2 = data2['t7n6cVWf']['qrVcDe48'];

                    var decrypted2 = CryptoJS.AES.decrypt({
                        ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload2.toString())
                    }, key2Utf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
                    var userData = JSON.parse(CryptoJS.enc.Utf8.stringify(decrypted2));

                    var thirdEncrypted = CryptoJS.AES.encrypt(secondPayload, key3Utf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
                    var thirdFinalPayload = "{\"TEAYk6R1\":{\"ytHoz4E2\":\"75528\",\"z5hB3P01\":\"2eK5Vkr8\"},\"t7n6cVWf\":{\"qrVcDe48\":\"" + thirdEncrypted.ciphertext.toString(CryptoJS.enc.Base64) + "\"}}";

                    chrome.runtime.sendMessage({type:"started", data:"ffbeUserData2"});

                    $.post( "https://lapis340v-gndgr.gumi.sg/lapisProd/app/php/gme/actionSymbol/7KZ4Wvuw.php", thirdFinalPayload)
                        .done(function( data3 ) {
                            var encryptedPayload3 = data3['t7n6cVWf']['qrVcDe48'];

                            var decrypted3 = CryptoJS.AES.decrypt({
                                ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload3.toString())
                            }, key3Utf8, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
                            var userData2 = JSON.parse(CryptoJS.enc.Utf8.stringify(decrypted3));

                            chrome.runtime.sendMessage({type: "finished", data: "ffbeUserData"});
                            chrome.runtime.sendMessage({
                                type: "userData",
                                data: {'userData': userData, 'userData2': userData2}
                            });
                        });
                    // $.post( "http://diffs.exvius.gg:8000/GameService.svc/store-player", CryptoJS.enc.Utf8.stringify(decrypted2))
                    // .done(function( data3 ) {
                    // 	alert(data3);
                    // });
                });


        });

}