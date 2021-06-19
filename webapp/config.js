//window.endpoint = 'https://cab9-api-apim.azure-api.net/';
//window.signalREndpoint = 'https://api.cab9.co/';
//window.resourceEndpoint = 'https://cab9livedata.blob.core.windows.net/';
window.webbookerEndpoint = 'https://web-booker.cab9.app/';

//window.endpoint = 'http://localhost:6003/';
window.endpoint = 'https://dev-aspnet-api.cab9.app/';
//window.endpoint = 'https://tarpit-dev.cab9.app/';
//window.endpoint = 'https://apifp.ilooklike.me/';
//window.endpoint = 'https://cab9development-slot1.azurewebsites.net/';
//window.endpoint = 'https://cab9development.azurewebsites.net/';
//window.resourceEndpoint = 'https://api.cab9.co/';
//window.resourceEndpoint = 'https://apifp.ilooklike.me/';
window.resourceEndpoint = 'https://cab9developmentdata.blob.core.windows.net/';
window.signalREndpoint = 'https://dev-aspnet-api.cab9.app/';

window.version = '2.1.0';
window.allow7Days = ['B92EB685-D654-4B32-B3CE-595FD6D5A8F7', '301FD400-A0FC-496F-A630-BCB6A6DD5BE7'];
window.newPortalClients = ['8ba3daec-1171-e611-80ca-14187728d133', '2398dc0f-d064-e611-80ca-14187728d133', 'f442a252-ee86-e911-abc4-28187825271e','084a84ae-cc36-ea11-a601-28187824b023'];
//window.customerPortalEndpoint = 'https://cab9-customer.netlify.app';
window.customerPortalEndpoint = 'https://customer-portal.cab9.app';
window.formatImage = function (url, text) {
    if (url) {
        if (url.slice(0, 4) === "http") {
            return url;
        } else if (url.slice(0, 4) === "api/") {
            return window.endpoint + url;
        } else {
            return window.resourceEndpoint + url;
        }
    } else {
        var imageText = '';
        if (text && text.length > 5) {
            text.split(' ').map(function (item) {
                imageText += item[0]
            });
        } else {
            imageText = text
        }
        return window.endpoint + "api/imagegen?text=" + imageText;
    }
};
