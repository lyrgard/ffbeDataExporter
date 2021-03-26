console.log("facebook.js executing");

/*
removed need to get fb_dtsg and jazoest from facebook login screen html,
instead, just sends access token from header script element.
*/
const facebookResponse = document.getElementsByTagName('script')[0].innerHTML
const tokenReg = /access_token=(.*?)&/;
const tokenMatch = tokenReg.exec(facebookResponse);
if (tokenMatch){
    chrome.runtime.sendMessage({
        type: "facebookToken",
        //this can also be used in chrome browser console to target facebook response after login
        data: tokenMatch[1]
    })
} else {
    chrome.runtime.sendMessage({type: "fb_login_canceled", data:"Login Canceled"})
}
