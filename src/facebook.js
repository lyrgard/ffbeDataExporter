
chrome.runtime.onMessage.addListener(function (msg, sender, data) {
    if (msg.type == 'get_facebook_variables') {
        chrome.runtime.sendMessage({type:"started", data:"facebookToken"});
        chrome.runtime.sendMessage({
            type:"facebook_variables",
            data: {
                fb_dstg: document.getElementsByName("fb_dtsg")[0].value,
                jazoest: document.getElementsByName("jazoest")[0].value
            }
        });
    } else if (msg.type == "start_get_facebook_token") {
        location.href = "https://m.facebook.com/login.php?skip_api_login=1&api_key=1238083776220999&signed_next=1&next=https%3A%2F%2Fm.facebook.com%2Fv3.2%2Fdialog%2Foauth%3Fredirect_uri%3Dfbconnect%253A%252F%252Fsuccess%26display%3Dtouch%26state%3D%257B%25220_auth_logger_id%2522%253A%2522792e45db-e19b-4aec-9efa-767011b65d81%2522%252C%25223_method%2522%253A%2522web_view%2522%257D%26scope%3Duser_friends%26response_type%3Dtoken%252Csigned_request%26default_audience%3Dfriends%26return_scopes%3Dtrue%26auth_type%3Drerequest%26client_id%3D1238083776220999%26ret%3Dlogin%26sdk%3Dandroid-4.40.0%26logger_id%3D792e45db-e19b-4aec-9efa-767011b65d81&cancel_url=fbconnect%3A%2F%2Fsuccess%3Ferror%3Daccess_denied%26error_code%3D200%26error_description%3DPermissions%2Berror%26error_reason%3Duser_denied%26state%3D%257B%25220_auth_logger_id%2522%253A%2522792e45db-e19b-4aec-9efa-767011b65d81%2522%252C%25223_method%2522%253A%2522web_view%2522%257D%26e2e%3D%257B%2522init%2522%253A1549652357497%257D&display=touch&locale=en_US&logger_id=792e45db-e19b-4aec-9efa-767011b65d81&_rdr";
    } else if (msg.type == "go_back_to_facebook") {
        location.href = "https://facebook.com/";
    }
});