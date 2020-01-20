var fb_dstg, jazoest;

console.log("executing background page");

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({'url':chrome.extension.getURL("ffbeSync.html")});
});

function getBrowser() {
  if (typeof chrome !== "undefined") {
    if (typeof browser !== "undefined") {
      return "Firefox";
    } else {
      return "Chrome";
    }
  } else {
    return "Edge";
  }
}

/*
 * FACEBOOK PART
 */

var facebookTabId;

chrome.runtime.onMessage.addListener(function (msg, sender, data) {
	if (msg.type === 'facebookTabId') {
        facebookTabId = msg.data;
	} else if (msg.type == 'facebook_variables') {
        fb_dstg = msg.data.fb_dstg;
        jazoest = msg.data.jazoest;
        console.log("fb_dstg: " + fb_dstg);
        chrome.tabs.sendMessage(facebookTabId, {type: "start_get_facebook_token"});
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
                chrome.tabs.remove(facebookTabId);

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

var requestFilter = {urls: ["https://m.facebook.com/v3.2/dialog/oauth/confirm"]};
var extraInfoSpec = ["requestHeaders", "blocking", "extraHeaders"];
if (getBrowser() === 'Firefox') {
    extraInfoSpec = ["requestHeaders", "blocking"];
}
var handler = function(details) {
        var isRefererSet = false;
        var headers = details.requestHeaders


        for (var i = 0, l = details.requestHeaders.length; i < l; i++) {
            if (headers[i].name == 'Origin' || headers[i].name == 'origin') {
            	console.log('change Origin to https://m.facebook.com');
                headers[i].value = "https://m.facebook.com";
                isRefererSet = true;
                break;
            }
        }

        if (!isRefererSet) {
            console.log('set Origin to https://m.facebook.com');
            headers.push({
                name: "Origin",
                value: "https://m.facebook.com"
            });
        }

    	if (getBrowser() === 'Firefox') {
        	if (headers.some(h => h.name == 'User-Agent')) {
                headers.filter(h => h.name == 'User-Agent')[0].value = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36';
			} else {
                headers.push({
                    name: "User-Agent",
                    value: "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36"
                });
			}
        }
        return {requestHeaders: headers};
    };

chrome.webRequest.onBeforeSendHeaders.addListener(handler, requestFilter, extraInfoSpec);
chrome.webRequest.onSendHeaders.addListener((details) => {
	console.log("Header sent: " + JSON.stringify(details.requestHeaders));
}, requestFilter, ['requestHeaders']);

/*
 * GOOGLE PART
 */

	var responseMonitor = {
        urls: ["https://accounts.google.com/*/embeddedsigninconsent*"]
    };
	var responseExtraInfoSpec = ['responseHeaders', 'extraHeaders'];
    if (getBrowser() === 'Firefox') {
		responseExtraInfoSpec = ['responseHeaders', 'blocking'];
	}
    var responseHandler = function(details) {
        var headers = details.responseHeaders;
			
		// Find the oauth2 token
		for (var i = 0, l = headers.length; i < l; ++i) {
			if (headers[i].name == 'set-cookie')
			{
				
				var oauthReg = /oauth_token=(.*?);/;
				var oauthMatch = oauthReg.exec(headers[i].value);
				if (oauthMatch)
				{
					var oauthToken = oauthMatch[1];
					
					console.log("Extracted oauth2 token: \n" + oauthToken);
					chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						console.log("Sending msg to tab: " + tabs[0]);
						chrome.tabs.sendMessage(tabs[0].id, {type: "google_login_done_tab"});
					});
					
					// TODO: Figure out how to get a message from the background task to itself.
					// For now just call a function?
					getMasterToken(oauthToken);
					
					chrome.runtime.sendMessage({type: "google_login_done"});
					chrome.runtime.sendMessage({type:"google_oauth2", data:{oauthToken: oauthToken}});
					
				}
			}
		}
    };	
	
chrome.webRequest.onHeadersReceived.addListener(responseHandler, responseMonitor, responseExtraInfoSpec);

function getMasterToken(oauthToken) {

    var androidGmsTokenRequest =
        'androidId=ffbebeef&lang=en-US&google_play_services_version=19831013&sdk_version=22&device_country=us&callerSig=38918a453d07199354f8b19af05ec6562ced5788&Email=&ACCESS_TOKEN=1&droidguard_results=&service=ac2dm&add_account=1&callerPkg=com.google.android.gms&get_accountid=1&Token=' + oauthToken;

    console.log('Sending request to google auth as GMS with: \n ' + androidGmsTokenRequest);

    $.post( "https://android.googleapis.com/auth", androidGmsTokenRequest)
        .done(function( data ) {
            console.log("Received data for GMS auth: \n" + data);

            // Extract the server auth key
            line = data.split('\n')[0];
            var tokenReg = /Token=(.*?)$/;
            var tokenMatch = tokenReg.exec(line);
            var tokenCode = tokenMatch[1];

            console.log("Extracted GMS auth token: " + tokenCode);

            chrome.runtime.sendMessage({type:"finished", data:"googleToken"});
            chrome.runtime.sendMessage({type:"started", data:"googleId"});

            getFFBEGoogleServerAuth(tokenCode);
        })
        .fail(function( jqXHR, textStatus, errorThrown ) {
            console.log(errorThrown);
        });


}

function getFFBEGoogleServerAuth(master_token) {
	var serverAuthRequest = 'androidId=&lang=en-US&google_play_services_version=19831013&sdk_version=22&request_visible_actions=&client_sig=d3aed7cbd8f386cd56edcb749d5a2684496e52b8&oauth2_include_email=0&oauth2_prompt=auto&callerSig=38918a453d07199354f8b19af05ec6562ced5788&oauth2_include_profile=1&service=oauth2%3Aserver%3Aclient_id%3A19797722756-918ovv15u2kdul81jgkgig2gfinq88no.apps.googleusercontent.com%3Aapi_scope%3Aopenid+profile&app=com.square_enix.android_googleplay.FFBEWW&check_email=1&token_request_options=CAA4AVADWhZLeTlURnVTcHJwZ19iTmxDQmF4a0ZR&callerPkg=com.google.android.gms&Token=' + master_token;

	console.log('Sending request to google auth: ' + serverAuthRequest);


	$.post( "https://android.googleapis.com/auth", serverAuthRequest)
		.done(function( data ) {
			console.log("Received data for server auth: \n" + data);

			// Extract the server auth key
			line = data.split('\n')[0];
			var authReg = /Auth=(.*?)$/;
			var authMatch = authReg.exec(line);
			var authCode = authMatch[1];

			console.log("Extracted auth token: " + authCode);

			// Use the server auth key to get a login token

			var serverLoginRequest = '{"grant_type":"authorization_code","client_id":"19797722756-918ovv15u2kdul81jgkgig2gfinq88no.apps.googleusercontent.com","client_secret":"n5eMUGHuLV__uJ_VMd1gn_70","redirect_uri":"","code":"' + authCode + '"}';

			console.log("Requesting login token with auth: \n" + serverLoginRequest);
			$.ajax({
			  url:"https://www.googleapis.com/oauth2/v4/token",
			  type:"POST",
			  data:serverLoginRequest,
			  contentType:"application/json; charset=utf-8",
			  dataType:"json",
			  success: function(){
			  }
			})
				.done(function( data ) {
					console.log("Received login token: \n" + JSON.stringify(data));

					googleToken = data['access_token'];

					googleIdToken = data['id_token'];

					idJson = JSON.parse(atob(googleIdToken.split('.')[1].replace(/_/g, '/').replace(/-/g, '+')));

					console.log("parsed JWT: \n" + JSON.stringify(idJson));

					googleId = idJson["sub"]

					console.log("Extracted google id: " + googleId);

					chrome.runtime.sendMessage({type:"finished", data:"googleId"});
					chrome.runtime.sendMessage({type:"started", data:"ffbeConnect"});
					getUserData(googleId, googleToken, true);

				})
				.fail(function( jqXHR, textStatus, errorThrown ) {
					console.log(errorThrown);
				});
		})
		.fail(function( jqXHR, textStatus, errorThrown ) {
			console.log(errorThrown);
		});
}

/*
 * FFBE PART
 */

function getUserData(fbID, fbToken, isGoogle) {

    console.log("getUserDate");
    var fb_dstg = "";
    var jazoest = "";

    var key = "rVG09Xnt\0\0\0\0\0\0\0\0";
    var key2 = "rcsq2eG7\0\0\0\0\0\0\0\0";
    var key3 = "7VNRi6Dk\0\0\0\0\0\0\0\0";
    var token = "";

    var keyUtf8 = CryptoJS.enc.Utf8.parse(key);
    var key2Utf8 = CryptoJS.enc.Utf8.parse(key2);
    var key3Utf8 = CryptoJS.enc.Utf8.parse(key3);


	if (isGoogle) {
		var testPayload = "{\"LhVz6aD2\":[{\"6Nf5risL\":\"0\",\"40w6brpQ\":\"0\",\"jHstiL12\":\"0\",\"io30YcLA\":\"Nexus 6P_android6.0\",\"K1G4fBjF\":\"2\",\"e8Si6TGh\":\"\",\"1WKh6Xqe\":\"ver.2.7.0.1\",\"64anJRhx\":\"2019-02-08 11:15:15\",\"Y76dKryw\":null,\"6e4ik6kA\":\"\",\"NggnPgQC\":\"\",\"e5zgvyv7\":\"" + fbToken + "\",\"GwtMEDfU\":\"" + fbID + "\"}],\"Euv8cncS\":[{\"K2jzG6bp\":\"1\"}],\"c402FmRD\":[{\"kZdGGshD\":\"2\"}],\"c1qYg84Q\":[{\"a4hXTIm0\":\"F_APP_VERSION_AND\",\"wM9AfX6I\":\"10000\"},{\"a4hXTIm0\":\"F_RSC_VERSION\",\"wM9AfX6I\":\"0\"},{\"a4hXTIm0\":\"F_MST_VERSION\",\"wM9AfX6I\":\"2047\"}]}";
	} else {
		var testPayload = "{\"LhVz6aD2\":[{\"9Tbns0eI\":null,\"9qh17ZUf\":null,\"6Nf5risL\":\"0\",\"io30YcLA\":\"Nexus 6P_android6.0\",\"K1G4fBjF\":\"2\",\"e8Si6TGh\":\"\",\"U7CPaH9B\":null,\"1WKh6Xqe\":\"ver.2.7.0.1\",\"64anJRhx\":\"2019-02-08 11:15:15\",\"Y76dKryw\":null,\"6e4ik6kA\":\"\",\"NggnPgQC\":\"\",\"X6jT6zrQ\":null,\"DOFV3qRF\":null,\"P_FB_TOKEN\":\"" + fbToken + "\",\"P_FB_ID\":\"" + fbID + "\"}],\"Euv8cncS\":[{\"K2jzG6bp\":\"0\"}],\"c1qYg84Q\":[{\"a4hXTIm0\":\"F_APP_VERSION_IOS\",\"wM9AfX6I\":\"10000\"},{\"a4hXTIm0\":\"F_RSC_VERSION\",\"wM9AfX6I\":\"0\"},{\"a4hXTIm0\":\"F_MST_VERSION\",\"wM9AfX6I\":\"377\"}]}";
	}
	var encrypted = CryptoJS.AES.encrypt(testPayload, keyUtf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
	var finalPayload = "{\"TEAYk6R1\":{\"ytHoz4E2\":\"75527\",\"z5hB3P01\":\"75fYdNxq\"},\"t7n6cVWf\":{\"qrVcDe48\":\"" + encrypted.ciphertext.toString(CryptoJS.enc.Base64) + "\"}}"
	
	


    $.post( "https://lapis340v-gndgr.gumi.sg/lapisProd/app/php/gme/actionSymbol/fSG1eXI9.php", finalPayload)
        .done(function( data ) {
            var encryptedPayload = data['t7n6cVWf']['qrVcDe48'];
            var decrypted = CryptoJS.AES.decrypt({
                ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload.toString())
            }, keyUtf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});

            var jsonResponse = $.parseJSON(CryptoJS.enc.Utf8.stringify(decrypted));
			
			console.log('Init response length: ' + CryptoJS.enc.Utf8.stringify(decrypted).length);
			
			if (isGoogle)
			{
				var secondPayload = "{\"LhVz6aD2\":[{" +
				"\"9qh17ZUf\":\"" + jsonResponse["LhVz6aD2"][0]["9qh17ZUf"] + "\"," +
				"\"JC61TPqS\":\"" + jsonResponse["LhVz6aD2"][0]["JC61TPqS"] + "\"," +
				"\"6Nf5risL\":\"" + jsonResponse["LhVz6aD2"][0]["6Nf5risL"] + "\"," +
				"\"40w6brpQ\":\"0\"," +
				"\"jHstiL12\":\"0\"," + 
				"\"io30YcLA\":\"Nexus 6P_android6.0\"," + 
				"\"K1G4fBjF\":\"2\"," +
				"\"e8Si6TGh\":\"" + jsonResponse["LhVz6aD2"][0]["e8Si6TGh"] + "\"," +
				"\"1WKh6Xqe\":\"ver.2.7.0.1\"," + 
				"\"64anJRhx\":\"2019-02-08 11:15:15\"," +
				"\"m3Wghr1j\":\"" + jsonResponse["LhVz6aD2"][0]["m3Wghr1j"] + "\"," +
				"\"ma6Ac53v\":\"0\"," +
				"\"D2I1Vtog\":\"0\"," +
				"\"9K0Pzcpd\":\"10000\"," +
				"\"mESKDlqL\":\"" + jsonResponse["LhVz6aD2"][0]["mESKDlqL"] + "\"," + 
				"\"iVN1HD3p\":\"" + jsonResponse["LhVz6aD2"][0]["iVN1HD3p"] + "\"," +
				"\"Y76dKryw\":null," +
				"\"6e4ik6kA\":\"\"," +
				"\"NggnPgQC\":\"" + jsonResponse["LhVz6aD2"][0]["NggnPgQC"] + "\"," +
				"\"GwtMEDfU\":\"" + fbID + "\"," +
				"\"e5zgvyv7\":\"" + fbToken + "\"," + 
				"\"9Tbns0eI\":\"" + jsonResponse["LhVz6aD2"][0]["9Tbns0eI"] + "\"" +
				"}],\"QCcFB3h9\":[{\"qrVcDe48\":\"" + jsonResponse["QCcFB3h9"][0]["qrVcDe48"] +
				 "\"}],\"c1qYg84Q\":[{\"a4hXTIm0\":\"F_APP_VERSION_AND\",\"wM9AfX6I\":\"10000\"},{\"a4hXTIm0\":\"F_RSC_VERSION\",\"wM9AfX6I\":\"0\"},{\"a4hXTIm0\":\"F_MST_VERSION\",\"wM9AfX6I\":\"10000\"}]}";				
			}
			else
			{
				var secondPayload = "{\"LhVz6aD2\":[{\"JC61TPqS\":\"" + jsonResponse["LhVz6aD2"][0]["JC61TPqS"] + "\",\"m3Wghr1j\":\"" + jsonResponse["LhVz6aD2"][0]["m3Wghr1j"] + "\",\"mESKDlqL\":\"" + jsonResponse["LhVz6aD2"][0]["mESKDlqL"] + "\",\"iVN1HD3p\":\"" + jsonResponse["LhVz6aD2"][0]["iVN1HD3p"] + "\",\"9K0Pzcpd\":\"10000\",\"X6jT6zrQ\":\"10101870574910143\",\"9Tbns0eI\":\"" + jsonResponse["LhVz6aD2"][0]["9Tbns0eI"] + "\",\"9qh17ZUf\":\"" + jsonResponse["LhVz6aD2"][0]["9qh17ZUf"] + "\",\"6Nf5risL\":\"" + jsonResponse["LhVz6aD2"][0]["6Nf5risL"] + "\",\"io30YcLA\":\"Nexus 6P_android6.0\",\"K1G4fBjF\":\"2\",\"e8Si6TGh\":\"" + jsonResponse["LhVz6aD2"][0]["e8Si6TGh"] + "\",\"U7CPaH9B\":\"" + jsonResponse["LhVz6aD2"][0]["U7CPaH9B"] + "\",\"1WKh6Xqe\":\"ver.2.7.0.1\",\"64anJRhx\":\"2019-02-08 11:15:15\",\"Y76dKryw\":null,\"6e4ik6kA\":\"\",\"NggnPgQC\":\"\",\"DOFV3qRF\":null,\"P_FB_TOKEN\":null,\"P_FB_ID\":null}],\"QCcFB3h9\":[{\"qrVcDe48\":\"" +jsonResponse["QCcFB3h9"][0]["qrVcDe48"] + "\"}],\"Euv8cncS\":[{\"K2jzG6bp\":\"0\"}],\"c1qYg84Q\":[{\"a4hXTIm0\":\"F_APP_VERSION_IOS\",\"wM9AfX6I\":\"10000\"},{\"a4hXTIm0\":\"F_RSC_VERSION\",\"wM9AfX6I\":\"0\"},{\"a4hXTIm0\":\"F_MST_VERSION\",\"wM9AfX6I\":\"10000\"}]}";
			}
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
					
					console.log('Logon response length: ' + CryptoJS.enc.Utf8.stringify(decrypted2).length);

                    var thirdEncrypted = CryptoJS.AES.encrypt(secondPayload, key3Utf8, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
                    var thirdFinalPayload = "{\"TEAYk6R1\":{\"ytHoz4E2\":\"75528\",\"z5hB3P01\":\"2eK5Vkr8\"},\"t7n6cVWf\":{\"qrVcDe48\":\"" + thirdEncrypted.ciphertext.toString(CryptoJS.enc.Base64) + "\"}}";

                    chrome.runtime.sendMessage({type:"started", data:"ffbeUserData2"});

                    $.post( "https://lapis340v-gndgr.gumi.sg/lapisProd/app/php/gme/actionSymbol/7KZ4Wvuw.php", thirdFinalPayload)
                        .done(function( data3 ) {
							
							console.log('Userinfo2 response length: ' + JSON.stringify(data3).length);
							
							var userData2 = null;
							// Some accounts don't have this field
							if (data3 != null && data3['t7n6cVWf'] != null && 'qrVcDe48' in data3['t7n6cVWf'])
							{
							
								var encryptedPayload3 = data3['t7n6cVWf']['qrVcDe48'];

								var decrypted3 = CryptoJS.AES.decrypt({
									ciphertext: CryptoJS.enc.Base64.parse(encryptedPayload3.toString())
								}, key3Utf8, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
								userData2 = JSON.parse(CryptoJS.enc.Utf8.stringify(decrypted3));
							}

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
