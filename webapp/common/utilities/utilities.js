window.$utilities = {
    formatUrl: formatUrl,
    formatAddress: formatAddress,
    secondsToHms: secondsToHms
}


function formatUrl(ImageUrl, text) {
    return window.formatImage(ImageUrl, text);
}

function formatAddress(address) {
    var summary = '';
    if(address.Address1 && address.Address1.replace(" ", "").length > 0) {
        summary += address.Address1 + ", "
    }
    if(address.Address2 && address.Address2.replace(" ", "").length > 0) {
        summary += address.Address2 + ", "
    }
    if(address.Area && address.Area.length > 0) {
        summary += address.Area + ", "
    }

    if(address.TownCity && address.TownCity.replace(" ", "").length > 0) {
        summary += address.TownCity + ", "
    }

    if(address.Postcode && address.Postcode.replace(" ", "").length > 0) {
        summary += address.Postcode + ", "
    }

    if(address.County && address.County.replace(" ", "").length > 0) {
        summary += address.County + ", "
    }
    
    if(address.Country && address.Country.replace(" ", "").length > 0) {
        summary += address.Country + ", "
    }
    if(summary.substring(summary.length-2, summary.length) == ", ") {
        return summary.substring(0, summary.length - 2);
    } else {
        return summary;
    }
}

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? ":" : ":") : "";
    var mDisplay = m < 10 ? "0" + m + ":" : m + ":";
    var sDisplay = s < 10 ? "0"+ s : s;
    return hDisplay + mDisplay + sDisplay; 
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

